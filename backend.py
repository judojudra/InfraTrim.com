from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import json

app = Flask(__name__)
CORS(app)  # Allow React to connect

# Load trained model and encoders
print("🔧 Loading ML model...")
model = joblib.load('cost_optimizer_model.pkl')
le_service = joblib.load('le_service.pkl')
le_instance = joblib.load('le_instance.pkl')
le_region = joblib.load('le_region.pkl')
print("✅ Model loaded successfully!")

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Backend is running!"})

@app.route('/api/analyze', methods=['POST'])
def analyze_costs():
    try:
        # Get uploaded file
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files['file']
        
        # Read CSV
        df = pd.read_csv(file)
        print(f"📊 Received {len(df)} rows")
        
        # Required columns
        required_cols = ['Service', 'Region', 'Cost']
        if not all(col in df.columns for col in required_cols):
            return jsonify({"error": f"CSV must have columns: {required_cols}"}), 400
        
        # Add default values for missing columns
        if 'CPUUtilization' not in df.columns:
            df['CPUUtilization'] = np.random.uniform(20, 80, len(df))
        if 'MemoryUtilization' not in df.columns:
            df['MemoryUtilization'] = np.random.uniform(20, 80, len(df))
        if 'NetworkIO' not in df.columns:
            df['NetworkIO'] = np.random.uniform(10, 100, len(df))
        if 'StorageUsed' not in df.columns:
            df['StorageUsed'] = np.random.uniform(50, 500, len(df))
        if 'RunningHours' not in df.columns:
            df['RunningHours'] = 730
        if 'InstanceType' not in df.columns:
            df['InstanceType'] = 't3.large'
        
        # Encode categorical variables
        df['Service_Encoded'] = df['Service'].apply(
            lambda x: le_service.transform([x])[0] if x in le_service.classes_ else 0
        )
        df['InstanceType_Encoded'] = df['InstanceType'].apply(
            lambda x: le_instance.transform([x])[0] if x in le_instance.classes_ else 0
        )
        df['Region_Encoded'] = df['Region'].apply(
            lambda x: le_region.transform([x])[0] if x in le_region.classes_ else 0
        )
        
        # Prepare features
        features = ['Service_Encoded', 'InstanceType_Encoded', 'Region_Encoded',
                   'Cost', 'CPUUtilization', 'MemoryUtilization',
                   'NetworkIO', 'StorageUsed', 'RunningHours']
        
        X = df[features]
        
        # Make predictions
        predictions = model.predict(X)
        probabilities = model.predict_proba(X)
        
        # Add predictions to dataframe
        df['Recommendation'] = predictions
        df['Confidence'] = [max(prob) * 100 for prob in probabilities]
        
        # Calculate savings
        total_cost = df['Cost'].sum()
        
        # Group recommendations
        rec_counts = df['Recommendation'].value_counts().to_dict()
        
        # Generate recommendation details
        recommendations = []
        rec_id = 1
        
        for rec_type, count in rec_counts.items():
            if rec_type == 'optimal':
                continue
                
            subset = df[df['Recommendation'] == rec_type]
            potential_saving = subset['Cost'].sum() * 0.3  # Assume 30% savings
            
            # Map recommendation types to user-friendly messages
            rec_map = {
                'downsize': {
                    'type': 'Right-Size Instances',
                    'desc': f'{count} oversized instances detected',
                    'action': 'Downsize to appropriate instance types',
                    'icon': 'Server'
                },
                'terminate': {
                    'type': 'Terminate Unused Resources',
                    'desc': f'{count} barely-used resources found',
                    'action': 'Shut down or delete unused resources',
                    'icon': 'Server'
                },
                'reserved_instance': {
                    'type': 'Reserved Instances',
                    'desc': f'{count} stable workloads on on-demand pricing',
                    'action': 'Purchase Reserved Instances',
                    'icon': 'DollarSign'
                },
                'move_to_glacier': {
                    'type': 'S3 Storage Optimization',
                    'desc': f'{count} infrequently accessed S3 buckets',
                    'action': 'Move to Glacier storage class',
                    'icon': 'Database'
                },
                'intelligent_tiering': {
                    'type': 'S3 Intelligent Tiering',
                    'desc': f'{count} S3 buckets with variable access',
                    'action': 'Enable Intelligent-Tiering',
                    'icon': 'Database'
                },
                'delete_unused': {
                    'type': 'Delete Unused Volumes',
                    'desc': f'{count} unattached EBS volumes',
                    'action': 'Delete after backup verification',
                    'icon': 'HardDrive'
                },
                'downgrade_to_gp3': {
                    'type': 'Optimize EBS Storage',
                    'desc': f'{count} expensive storage types detected',
                    'action': 'Downgrade to gp3 volumes',
                    'icon': 'HardDrive'
                },
                'upsize': {
                    'type': 'Upsize Instances',
                    'desc': f'{count} undersized instances detected',
                    'action': 'Upgrade to higher instance types',
                    'icon': 'Server'
                },
                'reduce_memory': {
                    'type': 'Optimize Lambda Memory',
                    'desc': f'{count} Lambda functions with excess memory',
                    'action': 'Reduce memory allocation',
                    'icon': 'Zap'
                }
            }
            
            if rec_type in rec_map:
                info = rec_map[rec_type]
                recommendations.append({
                    'id': rec_id,
                    'type': info['type'],
                    'desc': info['desc'],
                    'action': info['action'],
                    'icon': info['icon'],
                    'save': round(potential_saving, 2),
                    'conf': round(subset['Confidence'].mean(), 0),
                    'sev': 'high' if potential_saving > total_cost * 0.1 else 'med',
                    'count': int(count),
                    'current_cost': round(subset['Cost'].sum(), 2)
                })
                rec_id += 1
        
        # Sort by savings
        recommendations = sorted(recommendations, key=lambda x: x['save'], reverse=True)
        
        total_savings = sum([r['save'] for r in recommendations])
        
        # Prepare response
        response = {
            'total_cost': round(total_cost, 2),
            'total_savings': round(total_savings, 2),
            'savings_percentage': round((total_savings / total_cost) * 100, 1) if total_cost > 0 else 0,
            'recommendations': recommendations,
            'total_rows': len(df),
            'services': df['Service'].value_counts().to_dict()
        }
        
        print(f"✅ Analysis complete: ${total_cost:.2f} cost, ${total_savings:.2f} savings")
        
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Flask backend...")
    print("📡 Backend running on http://localhost:5000")
    app.run(debug=True, port=5000)