from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import json
import os

app = Flask(__name__)
CORS(app, origins=os.environ.get('CORS_ORIGINS', '*').split(','))

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

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

@app.route('/api/generate-terraform', methods=['POST'])
def generate_terraform():
    try:
        data = request.json
        recommendations = data.get('recommendations', [])
        
        # Start building Terraform script
        terraform_script = """# Auto-generated Terraform script for AWS cost optimization
# Generated based on ML analysis

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"  # Update to your region
}

"""
        
        # Process recommendations and generate appropriate Terraform
        for rec in recommendations:
            rec_type = rec.get('type', '')
            
            if 'Right-Size' in rec_type or 'Downsize' in rec_type:
                terraform_script += f"""
# {rec_type}: {rec.get('desc', '')}
# Potential savings: ${rec.get('save', 0):.2f}/month

resource "aws_instance" "optimized_instance_{rec.get('id', 1)}" {{
  ami           = "ami-0c55b159cbfafe1f0"  # Update with your AMI
  instance_type = "t3.medium"  # Downsized from larger instance
  
  tags = {{
    Name        = "optimized-instance"
    CostCenter  = "optimized"
    Savings     = "${rec.get('save', 0):.2f}"
  }}
}}
"""
            
            elif 'Reserved Instance' in rec_type:
                terraform_script += f"""
# {rec_type}: {rec.get('desc', '')}
# Potential savings: ${rec.get('save', 0):.2f}/month

# Note: Reserved Instances should be purchased through AWS Console
# This creates the instance that should be covered by RI
resource "aws_instance" "reserved_instance_candidate_{rec.get('id', 1)}" {{
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.large"
  
  tags = {{
    Name             = "ri-candidate"
    ReservedInstance = "true"
    Savings          = "${rec.get('save', 0):.2f}"
  }}
}}
"""
            
            elif 'S3' in rec_type and 'Glacier' in rec_type:
                terraform_script += f"""
# {rec_type}: {rec.get('desc', '')}
# Potential savings: ${rec.get('save', 0):.2f}/month

resource "aws_s3_bucket" "optimized_bucket_{rec.get('id', 1)}" {{
  bucket = "optimized-storage-bucket-{rec.get('id', 1)}"
}}

resource "aws_s3_bucket_lifecycle_configuration" "glacier_transition_{rec.get('id', 1)}" {{
  bucket = aws_s3_bucket.optimized_bucket_{rec.get('id', 1)}.id

  rule {{
    id     = "move-to-glacier"
    status = "Enabled"

    transition {{
      days          = 30
      storage_class = "GLACIER"
    }}

    transition {{
      days          = 90
      storage_class = "DEEP_ARCHIVE"
    }}
  }}
}}
"""
            
            elif 'Intelligent' in rec_type and 'Tiering' in rec_type:
                terraform_script += f"""
# {rec_type}: {rec.get('desc', '')}
# Potential savings: ${rec.get('save', 0):.2f}/month

resource "aws_s3_bucket" "intelligent_tiering_bucket_{rec.get('id', 1)}" {{
  bucket = "intelligent-tiering-bucket-{rec.get('id', 1)}"
}}

resource "aws_s3_bucket_intelligent_tiering_configuration" "entire_bucket_{rec.get('id', 1)}" {{
  bucket = aws_s3_bucket.intelligent_tiering_bucket_{rec.get('id', 1)}.id
  name   = "EntireBucket"

  tiering {{
    access_tier = "DEEP_ARCHIVE_ACCESS"
    days        = 180
  }}

  tiering {{
    access_tier = "ARCHIVE_ACCESS"
    days        = 90
  }}
}}
"""
            
            elif 'EBS' in rec_type or 'gp3' in rec_type:
                terraform_script += f"""
# {rec_type}: {rec.get('desc', '')}
# Potential savings: ${rec.get('save', 0):.2f}/month

resource "aws_ebs_volume" "optimized_volume_{rec.get('id', 1)}" {{
  availability_zone = "us-east-1a"
  size              = 100
  type              = "gp3"  # Optimized from gp2 or io1/io2
  
  tags = {{
    Name    = "optimized-volume"
    Savings = "${rec.get('save', 0):.2f}"
  }}
}}
"""
            
            elif 'Lambda' in rec_type:
                terraform_script += f"""
# {rec_type}: {rec.get('desc', '')}
# Potential savings: ${rec.get('save', 0):.2f}/month

resource "aws_lambda_function" "optimized_function_{rec.get('id', 1)}" {{
  filename      = "lambda_function.zip"
  function_name = "optimized-lambda-{rec.get('id', 1)}"
  role          = aws_iam_role.lambda_role_{rec.get('id', 1)}.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  
  memory_size = 512  # Optimized from higher value
  timeout     = 30
  
  tags = {{
    Optimized = "true"
    Savings   = "${rec.get('save', 0):.2f}"
  }}
}}

resource "aws_iam_role" "lambda_role_{rec.get('id', 1)}" {{
  name = "optimized-lambda-role-{rec.get('id', 1)}"

  assume_role_policy = jsonencode({{
    Version = "2012-10-17"
    Statement = [{{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {{
        Service = "lambda.amazonaws.com"
      }}
    }}]
  }})
}}
"""
            
            elif 'Terminate' in rec_type or 'Unused' in rec_type or 'Delete' in rec_type:
                terraform_script += f"""
# {rec_type}: {rec.get('desc', '')}
# Potential savings: ${rec.get('save', 0):.2f}/month
# Action: These resources should be terminated/deleted manually after verification
# Resource count: {rec.get('count', 0)}

"""
        
        # Add summary comment
        total_savings = sum([rec.get('save', 0) for rec in recommendations])
        terraform_script += f"""
# ==========================================
# OPTIMIZATION SUMMARY
# ==========================================
# Total monthly savings: ${total_savings:.2f}
# Total annual savings: ${total_savings * 12:.2f}
# Number of optimizations: {len(recommendations)}
# ==========================================
"""
        
        print(f"✅ Terraform generated: ${total_savings:.2f} savings, {len(recommendations)} optimizations")
        
        return jsonify({
            'terraform_script': terraform_script,
            'total_savings': round(total_savings, 2),
            'optimization_count': len(recommendations)
        })
        
    except Exception as e:
        print(f"❌ Error generating Terraform: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    print(f"🚀 Starting Flask backend on port {port}...")
    app.run(debug=debug, host='0.0.0.0', port=port)