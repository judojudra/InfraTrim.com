import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import joblib
import json

print("🚀 Starting ML Model Training...")

# Load the data
print("📊 Loading data...")
df = pd.read_csv('aws_usage_data.csv')
print(f"✅ Loaded {len(df)} rows")

# Encode categorical variables
print("🔧 Preprocessing data...")
le_service = LabelEncoder()
le_instance = LabelEncoder()
le_region = LabelEncoder()

df['Service_Encoded'] = le_service.fit_transform(df['Service'])
df['InstanceType_Encoded'] = le_instance.fit_transform(df['InstanceType'])
df['Region_Encoded'] = le_region.fit_transform(df['Region'])

# Features for training
features = ['Service_Encoded', 'InstanceType_Encoded', 'Region_Encoded', 
            'Cost', 'CPUUtilization', 'MemoryUtilization', 
            'NetworkIO', 'StorageUsed', 'RunningHours']

X = df[features]
y = df['Recommendation']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print(f"📚 Training set: {len(X_train)} samples")
print(f"🧪 Test set: {len(X_test)} samples")

# Train Random Forest model
print("\n🌲 Training Random Forest model...")
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=20,
    min_samples_split=5,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)
print("✅ Model trained!")

# Evaluate
print("\n📊 Evaluating model...")
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"\n🎯 Accuracy: {accuracy * 100:.2f}%")
print("\n📋 Detailed Classification Report:")
print(classification_report(y_test, y_pred))

# Feature importance
feature_importance = pd.DataFrame({
    'feature': features,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print("\n🔍 Feature Importance:")
print(feature_importance)

# Save the model
print("\n💾 Saving model and encoders...")
joblib.dump(model, 'cost_optimizer_model.pkl')
joblib.dump(le_service, 'le_service.pkl')
joblib.dump(le_instance, 'le_instance.pkl')
joblib.dump(le_region, 'le_region.pkl')

# Save feature names for later use
with open('model_features.json', 'w') as f:
    json.dump(features, f)

print("✅ Model saved as 'cost_optimizer_model.pkl'")
print("✅ Encoders saved")
print("\n🎉 Training complete!")

# Test with a sample prediction
print("\n🧪 Testing with sample prediction...")
sample = X_test.iloc[0:1]
prediction = model.predict(sample)
probabilities = model.predict_proba(sample)

print(f"Sample input: {sample.values[0]}")
print(f"Prediction: {prediction[0]}")
print(f"Confidence: {max(probabilities[0]) * 100:.2f}%")