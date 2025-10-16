import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Set seed for reproducibility
np.random.seed(42)
random.seed(42)

# Configuration
num_rows = 25000
start_date = datetime(2024, 1, 1)

# Define realistic options
services = ['EC2', 'RDS', 'S3', 'Lambda', 'EBS']
instance_types = {
    'EC2': ['t3.micro', 't3.small', 't3.medium', 't3.large', 't3.xlarge', 't3.2xlarge', 
            'm5.large', 'm5.xlarge', 'm5.2xlarge', 'c5.large', 'c5.xlarge'],
    'RDS': ['db.t3.micro', 'db.t3.small', 'db.t3.medium', 'db.r5.large', 'db.r5.xlarge'],
    'S3': ['Standard', 'Intelligent-Tiering', 'Glacier'],
    'Lambda': ['128MB', '256MB', '512MB', '1024MB'],
    'EBS': ['gp2', 'gp3', 'io1', 'io2']
}
regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-south-1', 'ap-southeast-1']

# Generate data
data = []

for i in range(num_rows):
    # Random date within last 12 months
    date = start_date + timedelta(days=random.randint(0, 365))
    
    # Random service
    service = random.choice(services)
    instance_type = random.choice(instance_types[service])
    region = random.choice(regions)
    
    # Generate realistic metrics based on service type
    if service == 'EC2':
        # EC2 instances - some are oversized (low utilization, high cost)
        cpu_util = np.random.beta(2, 5) * 100  # Skewed towards lower utilization
        memory_util = cpu_util + np.random.normal(0, 10)
        memory_util = np.clip(memory_util, 5, 95)
        
        # Cost based on instance type
        base_cost = {
            't3.micro': 0.0104, 't3.small': 0.0208, 't3.medium': 0.0416,
            't3.large': 0.0832, 't3.xlarge': 0.1664, 't3.2xlarge': 0.3328,
            'm5.large': 0.096, 'm5.xlarge': 0.192, 'm5.2xlarge': 0.384,
            'c5.large': 0.085, 'c5.xlarge': 0.17
        }
        hourly_cost = base_cost.get(instance_type, 0.1)
        running_hours = random.randint(100, 730)  # Up to 730 hours/month
        cost = hourly_cost * running_hours
        
        network_io = np.random.gamma(2, 50)  # GB
        storage_used = np.random.gamma(3, 30)  # GB
        
        # Determine recommendation based on utilization
        if cpu_util < 30 and cost > 50:
            recommendation = 'downsize'
        elif cpu_util > 80 and memory_util > 80:
            recommendation = 'upsize'
        elif running_hours < 200:
            recommendation = 'terminate'
        else:
            recommendation = 'optimal'
            
    elif service == 'RDS':
        cpu_util = np.random.beta(3, 4) * 100
        memory_util = np.random.beta(3, 4) * 100
        
        base_cost = {
            'db.t3.micro': 0.017, 'db.t3.small': 0.034, 'db.t3.medium': 0.068,
            'db.r5.large': 0.24, 'db.r5.xlarge': 0.48
        }
        hourly_cost = base_cost.get(instance_type, 0.1)
        running_hours = random.randint(400, 730)
        cost = hourly_cost * running_hours
        
        network_io = np.random.gamma(1.5, 30)
        storage_used = np.random.gamma(5, 100)
        
        if cpu_util < 25 and cost > 100:
            recommendation = 'downsize'
        elif running_hours > 500 and cost > 150:
            recommendation = 'reserved_instance'
        else:
            recommendation = 'optimal'
            
    elif service == 'S3':
        cpu_util = 0  # Not applicable
        memory_util = 0
        storage_used = np.random.gamma(4, 1000)  # GB
        
        cost_per_gb = {'Standard': 0.023, 'Intelligent-Tiering': 0.0125, 'Glacier': 0.004}
        cost = storage_used * cost_per_gb.get(instance_type, 0.023)
        
        running_hours = 730
        network_io = np.random.gamma(1, 50)
        
        # Access frequency (requests per month)
        access_frequency = np.random.poisson(100)
        
        if instance_type == 'Standard' and access_frequency < 50 and storage_used > 1000:
            recommendation = 'move_to_glacier'
        elif instance_type == 'Standard' and storage_used > 5000:
            recommendation = 'intelligent_tiering'
        else:
            recommendation = 'optimal'
            
    elif service == 'Lambda':
        cpu_util = np.random.beta(2, 3) * 100
        memory_util = np.random.beta(2, 3) * 100
        
        invocations = np.random.poisson(10000)
        memory_mb = int(instance_type.replace('MB', ''))
        cost = (invocations * 0.0000002) + (invocations * memory_mb * 0.0000000167)
        
        running_hours = 0
        network_io = np.random.gamma(0.5, 5)
        storage_used = 0
        
        if memory_util < 40 and memory_mb > 512:
            recommendation = 'reduce_memory'
        else:
            recommendation = 'optimal'
            
    elif service == 'EBS':
        cpu_util = 0
        memory_util = 0
        storage_used = np.random.gamma(3, 100)
        
        cost_per_gb = {'gp2': 0.10, 'gp3': 0.08, 'io1': 0.125, 'io2': 0.125}
        cost = storage_used * cost_per_gb.get(instance_type, 0.1)
        
        running_hours = 730
        network_io = np.random.gamma(2, 20)
        
        # Check if attached
        is_attached = random.random() > 0.15  # 15% unattached
        
        if not is_attached:
            recommendation = 'delete_unused'
        elif instance_type in ['io1', 'io2'] and network_io < 50:
            recommendation = 'downgrade_to_gp3'
        else:
            recommendation = 'optimal'
    
    # Add some noise
    cost = cost * np.random.uniform(0.95, 1.05)
    
    data.append({
        'Date': date.strftime('%Y-%m-%d'),
        'Service': service,
        'InstanceType': instance_type,
        'Region': region,
        'Cost': round(cost, 2),
        'CPUUtilization': round(cpu_util, 2),
        'MemoryUtilization': round(memory_util, 2),
        'NetworkIO': round(network_io, 2),
        'StorageUsed': round(storage_used, 2),
        'RunningHours': running_hours,
        'Recommendation': recommendation
    })

# Create DataFrame
df = pd.DataFrame(data)

# Save to CSV
df.to_csv('aws_usage_data.csv', index=False)

print(f"✅ Generated {len(df)} rows of AWS usage data")
print(f"📊 Columns: {list(df.columns)}")
print(f"\n📈 Recommendation Distribution:")
print(df['Recommendation'].value_counts())
print(f"\n💰 Total Cost Range: ${df['Cost'].min():.2f} - ${df['Cost'].max():.2f}")
print(f"💰 Average Cost: ${df['Cost'].mean():.2f}")
print(f"\n✅ Saved to: aws_usage_data.csv")