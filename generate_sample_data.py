#!/usr/bin/env python3
"""Healthcare Analytics Sample Data Generator.

Generates realistic fake data for healthcare insurance analytics dashboard.
"""

import os
import random
import string
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

# Configuration
NUM_MEMBERS = 1200
NUM_CLAIMS = 5000
NUM_PROVIDERS = 250
NUM_EMPLOYERS = 25
MONTHS_OF_DATA = 24  # 2 years

# Common first and last names for realistic data
FIRST_NAMES = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
    "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
    "Matthew", "Betty", "Anthony", "Dorothy", "Donald", "Sandra", "Mark", "Ashley",
    "Paul", "Kimberly", "Steven", "Donna", "Andrew", "Emily", "Kenneth", "Michelle",
    "Joshua", "Carol", "Kevin", "Amanda", "Brian", "Melissa", "George", "Deborah"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
    "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill"
]

CITIES = [
    ("New York", "NY", "10001"), ("Los Angeles", "CA", "90001"), ("Chicago", "IL", "60601"),
    ("Houston", "TX", "77001"), ("Phoenix", "AZ", "85001"), ("Philadelphia", "PA", "19101"),
    ("San Antonio", "TX", "78201"), ("San Diego", "CA", "92101"), ("Dallas", "TX", "75201"),
    ("San Jose", "CA", "95101"), ("Austin", "TX", "78701"), ("Jacksonville", "FL", "32099"),
    ("Fort Worth", "TX", "76101"), ("Columbus", "OH", "43201"), ("Charlotte", "NC", "28201"),
    ("San Francisco", "CA", "94101"), ("Indianapolis", "IN", "46201"), ("Seattle", "WA", "98101"),
    ("Denver", "CO", "80201"), ("Boston", "MA", "02101"), ("Portland", "OR", "97201"),
    ("Miami", "FL", "33101"), ("Atlanta", "GA", "30301"), ("Minneapolis", "MN", "55401")
]

COMPANY_NAMES = [
    "Acme Corporation", "TechCorp Solutions", "Global Industries", "Premier Manufacturing",
    "Innovative Systems", "Digital Dynamics", "Alpha Enterprises", "Omega Holdings",
    "Strategic Partners", "Unified Services", "Peak Performance", "Summit Group",
    "Apex Technologies", "Zenith Corporation", "Prime Solutions", "Core Industries",
    "Vertex Systems", "Quantum Enterprises", "Fusion Corp", "Nexus Holdings",
    "Synergy Partners", "Vanguard Group", "Pioneer Industries", "Elite Services", "Matrix Corp"
]

# Medical service types
SERVICE_TYPES = [
    "Professional", "Outpatient", "Inpatient", "Emergency", "Pharmacy", 
    "Lab", "Radiology", "Surgery", "Therapy", "Preventive", "Specialty",
    "Mental Health", "Dental", "Vision", "DME", "Home Health"
]

# Common ICD-10 codes with descriptions
ICD10_CODES = [
    ("E11.9", "Type 2 diabetes mellitus without complications", "Diabetes"),
    ("I10", "Essential (primary) hypertension", "High blood pressure"),
    ("E78.5", "Hyperlipidemia, unspecified", "High cholesterol"),
    ("K21.9", "Gastro-esophageal reflux disease without esophagitis", "GERD"),
    ("F41.9", "Anxiety disorder, unspecified", "Anxiety"),
    ("M79.3", "Myalgia", "Muscle pain"),
    ("J44.0", "COPD with acute lower respiratory infection", "COPD"),
    ("N39.0", "Urinary tract infection", "UTI"),
    ("E66.9", "Obesity, unspecified", "Obesity"),
    ("G43.909", "Migraine, unspecified", "Migraine"),
    ("M54.5", "Low back pain", "Back pain"),
    ("J06.9", "Acute upper respiratory infection", "Common cold"),
    ("B34.2", "Coronavirus infection", "COVID-19"),
    ("Z23", "Encounter for immunization", "Vaccination"),
    ("Z00.00", "General adult medical examination", "Check-up"),
    ("I25.10", "Atherosclerotic heart disease", "Heart disease"),
    ("E03.9", "Hypothyroidism, unspecified", "Hypothyroidism"),
    ("J45.909", "Unspecified asthma", "Asthma"),
    ("F32.9", "Major depressive disorder", "Depression"),
    ("M17.9", "Osteoarthritis of knee", "Knee arthritis")
]

# Drug/Pharmacy data
DRUG_NAMES = [
    ("Lisinopril", "Blood pressure", 30, 150),
    ("Metformin", "Diabetes", 25, 100),
    ("Atorvastatin", "Cholesterol", 35, 180),
    ("Omeprazole", "GERD", 40, 200),
    ("Amlodipine", "Blood pressure", 30, 140),
    ("Simvastatin", "Cholesterol", 25, 120),
    ("Losartan", "Blood pressure", 35, 160),
    ("Albuterol", "Asthma", 45, 250),
    ("Gabapentin", "Pain", 30, 180),
    ("Hydrochlorothiazide", "Blood pressure", 20, 80),
    ("Sertraline", "Depression", 40, 200),
    ("Levothyroxine", "Thyroid", 25, 100),
    ("Azithromycin", "Antibiotic", 50, 150),
    ("Amoxicillin", "Antibiotic", 20, 60),
    ("Prednisone", "Inflammation", 15, 50),
    ("Insulin Glargine", "Diabetes", 250, 1200),
    ("Adalimumab", "Autoimmune", 5000, 8000),
    ("Apixaban", "Blood thinner", 400, 600)
]

def generate_phone() -> str:
    """Generate random phone number."""
    return f"({random.randint(200, 999)}) {random.randint(200, 999)}-{random.randint(1000, 9999)}"

def generate_email(first_name: str, last_name: str) -> str:
    """Generate email from name."""
    domains = ["gmail.com", "yahoo.com", "outlook.com", "email.com", "mail.com"]
    return f"{first_name.lower()}.{last_name.lower()}@{random.choice(domains)}"

def generate_address() -> str:
    """Generate random street address."""
    street_nums = range(100, 9999)
    street_names = [
        "Main", "Oak", "Maple", "First", "Second", "Third", "Park", "Pine",
        "Elm", "Washington", "Lake", "Hill", "Forest", "River", "Sunset"
    ]
    street_types = ["St", "Ave", "Rd", "Blvd", "Dr", "Ln", "Way", "Ct"]
    
    return f"{random.choice(street_nums)} {random.choice(street_names)} {random.choice(street_types)}"

def generate_date_range(start_date: datetime, end_date: datetime) -> datetime:
    """Generate random date between start and end."""
    time_between = end_date - start_date
    days_between = time_between.days
    random_days = random.randrange(days_between)
    return start_date + timedelta(days=random_days)

def generate_reference_data() -> tuple[pd.DataFrame, ...]:
    """Generate reference/lookup tables."""
    print("Generating reference data...")
    
    # Service Types
    service_types_df = pd.DataFrame({
        'service_type_id': range(1, len(SERVICE_TYPES) + 1),
        'service_type': SERVICE_TYPES,
        'category': ['Medical'] * 11 + ['Ancillary'] * 5,
        'requires_auth': [random.choice([True, False]) for _ in SERVICE_TYPES],
        'typical_cost_min': [100, 500, 5000, 2000, 50, 150, 400, 10000, 200, 100, 1000, 300, 200, 150, 500, 800],
        'typical_cost_max': [2000, 5000, 50000, 15000, 500, 1000, 3000, 100000, 1500, 500, 10000, 2000, 1500, 800, 5000, 5000]
    })
    
    # ICD-10 Codes
    icd10_df = pd.DataFrame(ICD10_CODES, columns=['icd10_code', 'medical_description', 'laymans_term'])
    icd10_df['diagnosis_category'] = ['Chronic'] * 10 + ['Acute'] * 10
    icd10_df['hcc_code'] = [f"HCC{random.randint(1,200)}" if random.random() > 0.5 else None for _ in range(len(ICD10_CODES))]
    icd10_df['risk_weight'] = [round(random.uniform(0.5, 3.5), 2) for _ in range(len(ICD10_CODES))]
    
    # Plan Types
    plan_types_df = pd.DataFrame({
        'plan_type_id': range(1, 11),
        'plan_name': ['PPO Premium', 'PPO Standard', 'HMO Gold', 'HMO Silver', 'HMO Bronze',
                     'HDHP with HSA', 'EPO Select', 'POS Plus', 'Medicare Advantage', 'Medicaid Managed'],
        'plan_code': ['PPO-P', 'PPO-S', 'HMO-G', 'HMO-S', 'HMO-B', 'HDHP', 'EPO', 'POS', 'MA', 'MM'],
        'deductible': [500, 1000, 0, 250, 500, 2000, 750, 500, 0, 0],
        'oop_max': [3000, 5000, 2000, 3500, 5000, 6000, 4000, 4500, 3000, 1000],
        'coinsurance': [0.1, 0.2, 0.0, 0.1, 0.2, 0.3, 0.15, 0.2, 0.2, 0.0],
        'premium_employee': [200, 150, 175, 125, 100, 75, 140, 160, 0, 0],
        'premium_employer': [600, 450, 525, 375, 300, 225, 420, 480, 0, 0]
    })
    
    # Geographic Regions
    regions_df = pd.DataFrame({
        'region_id': range(1, 51),
        'region_name': [f"Region {i}" for i in range(1, 51)],
        'country': ['USA'] * 40 + ['Canada'] * 5 + ['Mexico'] * 3 + ['UK'] * 1 + ['Japan'] * 1,
        'domestic_flag': [True] * 40 + [False] * 10,
        'cost_index': [round(random.uniform(0.8, 1.3), 2) for _ in range(50)]
    })
    
    # Employer Groups
    employer_df = pd.DataFrame({
        'employer_group_id': range(1, NUM_EMPLOYERS + 1),
        'company_name': COMPANY_NAMES[:NUM_EMPLOYERS],
        'industry': random.choices(['Technology', 'Manufacturing', 'Healthcare', 'Finance', 
                                   'Retail', 'Education', 'Government'], k=NUM_EMPLOYERS),
        'size': random.choices(['Small (1-99)', 'Medium (100-999)', 'Large (1000+)'], 
                               weights=[0.5, 0.35, 0.15], k=NUM_EMPLOYERS),
        'effective_date': pd.date_range(start='2020-01-01', periods=NUM_EMPLOYERS, freq='M'),
        'status': ['Active'] * (NUM_EMPLOYERS - 2) + ['Terminated'] * 2
    })
    
    return service_types_df, icd10_df, plan_types_df, regions_df, employer_df

def generate_providers():
    """Generate provider data"""
    print("Generating provider data...")
    
    provider_types = ['Hospital', 'Clinic', 'Physician', 'Specialist', 'Lab', 'Pharmacy', 'Urgent Care']
    specialties = ['Primary Care', 'Cardiology', 'Orthopedics', 'Neurology', 'Oncology', 
                  'Pediatrics', 'OB/GYN', 'Emergency', 'General', 'Internal Medicine']
    
    providers = []
    for i in range(NUM_PROVIDERS):
        city_data = random.choice(CITIES)
        providers.append({
            'provider_id': f"PRV{str(i+1).zfill(5)}",
            'provider_name': f"{random.choice(['St.', 'Mount', 'Valley', 'City', 'Regional'])} {random.choice(['General', 'Memorial', 'Community', 'Medical'])} {random.choice(['Hospital', 'Center', 'Clinic', 'Associates'])}",
            'provider_type': random.choice(provider_types),
            'specialty': random.choice(specialties),
            'address': generate_address(),
            'city': city_data[0],
            'state': city_data[1],
            'zip': city_data[2],
            'phone': generate_phone(),
            'in_network': random.random() > 0.2,  # 80% in-network
            'quality_rating': round(random.uniform(3.0, 5.0), 1),
            'avg_cost_index': round(random.uniform(0.7, 1.5), 2)
        })
    
    return pd.DataFrame(providers)

def generate_members(employer_df, plan_types_df):
    """Generate member/enrollment data"""
    print("Generating member data...")
    
    members = []
    claimant_counter = 100000
    
    for i in range(NUM_MEMBERS):
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        city_data = random.choice(CITIES)
        
        # Age distribution: working age population
        age = np.random.normal(45, 15)
        age = max(18, min(85, int(age)))
        dob = datetime.now() - timedelta(days=age*365)
        
        # Enrollment dates
        enrollment_date = generate_date_range(datetime(2020, 1, 1), datetime(2023, 6, 1))
        is_active = random.random() > 0.2  # 80% active
        termination_date = None if is_active else enrollment_date + timedelta(days=random.randint(90, 730))
        
        # Member type based on age
        if age >= 65:
            member_type = "Retiree"
        elif random.random() > 0.7:
            member_type = "Dependent"
        else:
            member_type = "Employee"
        
        # Risk scoring based on age and random factors
        base_risk = 0.5 + (age / 100) * 2
        risk_score = round(base_risk * random.uniform(0.5, 2.0), 2)
        
        members.append({
            'member_id': f"MEM{str(i+1).zfill(6)}",
            'claimant_number': str(claimant_counter + i),
            'first_name': first_name,
            'last_name': last_name,
            'dob': dob.strftime('%Y-%m-%d'),
            'age': age,
            'gender': random.choice(['M', 'F']),
            'email': generate_email(first_name, last_name),
            'phone': generate_phone(),
            'address': generate_address(),
            'city': city_data[0],
            'state': city_data[1],
            'zip': city_data[2],
            'employer_group_id': random.choice(employer_df['employer_group_id'].tolist()),
            'plan_type_id': random.choice(plan_types_df['plan_type_id'].tolist()),
            'enrollment_date': enrollment_date.strftime('%Y-%m-%d'),
            'termination_date': termination_date.strftime('%Y-%m-%d') if termination_date else None,
            'member_type': member_type,
            'dependent_count': random.randint(0, 4) if member_type == "Employee" else 0,
            'risk_score': risk_score,
            'chronic_conditions': random.randint(0, 3) if risk_score > 1.5 else 0,
            'status': 'Active' if is_active else 'Terminated',
            'created_at': enrollment_date.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })
    
    return pd.DataFrame(members)

def generate_claims(members_df, providers_df, icd10_df, service_types_df):
    """Generate claims data with realistic distributions"""
    print("Generating claims data...")
    
    claims = []
    claim_id_counter = 1000000
    
    # Create weighted member selection (high utilizers)
    member_weights = members_df['risk_score'].values
    member_weights = member_weights / member_weights.sum()
    
    for i in range(NUM_CLAIMS):
        # Select member (weighted by risk score)
        member = members_df.sample(n=1, weights=member_weights).iloc[0]
        
        # Service date within member's enrollment period
        start_date = datetime.strptime(member['enrollment_date'], '%Y-%m-%d')
        end_date = datetime.now()
        if member['termination_date']:
            end_date = datetime.strptime(member['termination_date'], '%Y-%m-%d')
        
        service_date = generate_date_range(start_date, end_date)
        
        # Select service type and costs
        service_type = random.choice(SERVICE_TYPES)
        service_info = service_types_df[service_types_df['service_type'] == service_type].iloc[0]
        
        # Generate costs based on service type
        if service_type == "Pharmacy":
            drug_info = random.choice(DRUG_NAMES)
            medical_cost = 0
            rx_cost = random.uniform(drug_info[2], drug_info[3])
            icd_code = "Z79.899"  # Long term drug therapy
            med_desc = f"Prescription: {drug_info[0]}"
            layman = drug_info[1]
        else:
            medical_cost = random.uniform(service_info['typical_cost_min'], service_info['typical_cost_max'])
            # Add outliers (5% chance of high cost)
            if random.random() < 0.05:
                medical_cost *= random.uniform(5, 20)
            rx_cost = 0
            icd_info = random.choice(ICD10_CODES)
            icd_code = icd_info[0]
            med_desc = icd_info[1]
            layman = icd_info[2]
        
        total_cost = medical_cost + rx_cost
        
        # Domestic vs non-domestic (85% domestic)
        domestic_flag = random.random() < 0.85
        
        # Payment status
        status = random.choices(['Paid', 'Pending', 'Denied'], weights=[0.85, 0.10, 0.05])[0]
        
        claims.append({
            'claim_id': f"CLM{str(claim_id_counter + i).zfill(7)}",
            'claimant_number': member['claimant_number'],
            'member_id': member['member_id'],
            'service_date': service_date.strftime('%Y-%m-%d'),
            'Service Type': service_type,  # Capital S and T to match expected format
            'provider_id': random.choice(providers_df['provider_id'].tolist()),
            'ICD-10-CM Code': icd_code,  # Exact format expected
            'Medical Description': med_desc,  # Capital M and D
            "Layman's Term": layman,  # Exact format with apostrophe
            'Medical': round(medical_cost, 2),  # Capital M
            'Rx': round(rx_cost, 2),  # Capital R
            'Total': round(total_cost, 2),  # Capital T
            'domestic_flag': domestic_flag,
            'plan_type_id': member['plan_type_id'],
            'diagnosis_category': 'Chronic' if member['chronic_conditions'] > 0 else 'Acute',
            'hcc_code': f"HCC{random.randint(1,200)}" if random.random() > 0.6 else None,
            'risk_score': member['risk_score'],
            'paid_date': (service_date + timedelta(days=random.randint(15, 45))).strftime('%Y-%m-%d') if status == 'Paid' else None,
            'status': status,
            'created_at': service_date.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })
    
    # Add required "Claimant Number" column (without underscore)
    claims_df = pd.DataFrame(claims)
    claims_df['Claimant Number'] = claims_df['claimant_number']  # Duplicate with exact expected name
    
    return claims_df

def generate_budget_data(claims_df, members_df):
    """Generate monthly budget and financial data"""
    print("Generating budget data...")
    
    # Generate monthly dates
    start_date = datetime.now() - timedelta(days=730)  # 2 years ago
    months = pd.date_range(start=start_date, periods=MONTHS_OF_DATA, freq='M')
    
    budget_data = []
    
    for month_date in months:
        month_str = month_date.strftime('%b %Y')
        month_start = month_date.replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        # Filter claims for this month
        month_claims = claims_df[
            (pd.to_datetime(claims_df['service_date']) >= month_start) & 
            (pd.to_datetime(claims_df['service_date']) <= month_end)
        ]
        
        # Calculate actual costs from claims
        medical_claims = month_claims[month_claims['Service Type'] != 'Pharmacy']['Medical'].sum()
        rx_claims = month_claims[month_claims['Service Type'] == 'Pharmacy']['Rx'].sum()
        
        # Break down medical claims
        inpatient = month_claims[month_claims['Service Type'] == 'Inpatient']['Medical'].sum()
        outpatient = month_claims[month_claims['Service Type'] == 'Outpatient']['Medical'].sum()
        professional = month_claims[month_claims['Service Type'] == 'Professional']['Medical'].sum()
        emergency = month_claims[month_claims['Service Type'] == 'Emergency']['Medical'].sum()
        
        # Geographic breakdown
        domestic_claims = month_claims[month_claims['domestic_flag'] == True]['Total'].sum()
        non_domestic_claims = month_claims[month_claims['domestic_flag'] == False]['Total'].sum()
        
        # Calculate enrollment for this month
        active_members = members_df[
            (pd.to_datetime(members_df['enrollment_date']) <= month_end) &
            ((members_df['termination_date'].isna()) | (pd.to_datetime(members_df['termination_date']) >= month_start))
        ]
        
        employee_count = len(active_members[active_members['member_type'] == 'Employee'])
        dependent_count = len(active_members[active_members['member_type'] == 'Dependent'])
        retiree_count = len(active_members[active_members['member_type'] == 'Retiree'])
        total_enrollment = len(active_members)
        
        # Fixed costs (relatively stable)
        admin_fees = total_enrollment * random.uniform(25, 35)
        stop_loss_premium = total_enrollment * random.uniform(40, 50)
        wellness_programs = total_enrollment * random.uniform(5, 10)
        
        # Credits/reimbursements (variable)
        stop_loss_reimb = max(0, (medical_claims - 500000) * 0.9) if medical_claims > 500000 else 0
        rx_rebates = rx_claims * random.uniform(0.15, 0.25)
        
        # Calculate totals
        total_expenses = medical_claims + rx_claims + admin_fees + stop_loss_premium + wellness_programs
        total_credits = stop_loss_reimb + rx_rebates
        net_cost = total_expenses - total_credits
        
        # Budget (with some variance)
        budget = net_cost * random.uniform(0.95, 1.08)
        variance = budget - net_cost
        variance_percent = (variance / budget * 100) if budget > 0 else 0
        
        # Loss ratio
        premiums = total_enrollment * 750  # Average premium
        loss_ratio = (medical_claims + rx_claims) / premiums * 100 if premiums > 0 else 0
        
        budget_data.append({
            'month': month_str,
            'budget': round(budget, 2),
            'medical_claims': round(medical_claims, 2),
            'rx_claims': round(rx_claims, 2),
            'inpatient': round(inpatient, 2),
            'outpatient': round(outpatient, 2),
            'professional': round(professional, 2),
            'emergency': round(emergency, 2),
            'admin_fees': round(admin_fees, 2),
            'stop_loss_premium': round(stop_loss_premium, 2),
            'stop_loss_reimb': round(stop_loss_reimb, 2),
            'rx_rebates': round(rx_rebates, 2),
            'wellness_programs': round(wellness_programs, 2),
            'domestic_claims': round(domestic_claims, 2),
            'non_domestic_claims': round(non_domestic_claims, 2),
            'employee_count': employee_count,
            'dependent_count': dependent_count,
            'retiree_count': retiree_count,
            'total_enrollment': total_enrollment,
            'loss_ratio': round(loss_ratio, 2),
            'net_cost': round(net_cost, 2),
            'variance': round(variance, 2),
            'variance_percent': round(variance_percent, 2),
            'created_at': month_date.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })
    
    return pd.DataFrame(budget_data)

def main():
    """Main function to generate all sample data"""
    print("="*60)
    print("Healthcare Analytics Sample Data Generator")
    print("="*60)
    
    # Generate reference data
    service_types_df, icd10_df, plan_types_df, regions_df, employer_df = generate_reference_data()
    
    # Generate providers
    providers_df = generate_providers()
    
    # Generate members
    members_df = generate_members(employer_df, plan_types_df)
    
    # Generate claims
    claims_df = generate_claims(members_df, providers_df, icd10_df, service_types_df)
    
    # Generate budget data
    budget_df = generate_budget_data(claims_df, members_df)
    
    # Save all files
    print("\nSaving CSV files...")
    
    # Main data files
    budget_df.to_csv('sample_data/main_data/budget_data.csv', index=False)
    claims_df.to_csv('sample_data/main_data/claims_data.csv', index=False)
    members_df.to_csv('sample_data/main_data/members.csv', index=False)
    
    # Reference data files
    providers_df.to_csv('sample_data/reference_data/providers.csv', index=False)
    icd10_df.to_csv('sample_data/reference_data/icd10_codes.csv', index=False)
    plan_types_df.to_csv('sample_data/reference_data/plan_types.csv', index=False)
    service_types_df.to_csv('sample_data/reference_data/service_types.csv', index=False)
    regions_df.to_csv('sample_data/reference_data/geographic_regions.csv', index=False)
    employer_df.to_csv('sample_data/reference_data/employer_groups.csv', index=False)
    
    # Print summary
    print("\n" + "="*60)
    print("DATA GENERATION COMPLETE!")
    print("="*60)
    print(f"\nFiles created in sample_data/ directory:")
    print(f"  Main Data:")
    print(f"    - budget_data.csv: {len(budget_df)} months")
    print(f"    - claims_data.csv: {len(claims_df)} claims")
    print(f"    - members.csv: {len(members_df)} members")
    print(f"  Reference Data:")
    print(f"    - providers.csv: {len(providers_df)} providers")
    print(f"    - icd10_codes.csv: {len(icd10_df)} diagnosis codes")
    print(f"    - plan_types.csv: {len(plan_types_df)} plans")
    print(f"    - service_types.csv: {len(service_types_df)} service types")
    print(f"    - geographic_regions.csv: {len(regions_df)} regions")
    print(f"    - employer_groups.csv: {len(employer_df)} employers")
    
    # Create sample analysis
    print("\n" + "="*60)
    print("SAMPLE DATA STATISTICS:")
    print("="*60)
    print(f"\nClaims Analysis:")
    print(f"  Total Claims Value: ${claims_df['Total'].sum():,.2f}")
    print(f"  Average Claim: ${claims_df['Total'].mean():,.2f}")
    print(f"  Max Claim: ${claims_df['Total'].max():,.2f}")
    print(f"  Domestic vs International: {(claims_df['domestic_flag'].sum()/len(claims_df)*100):.1f}% domestic")
    
    print(f"\nMember Demographics:")
    print(f"  Active Members: {(members_df['status'] == 'Active').sum()}")
    print(f"  Average Age: {members_df['age'].mean():.1f} years")
    print(f"  Average Risk Score: {members_df['risk_score'].mean():.2f}")
    print(f"  Members with Chronic Conditions: {(members_df['chronic_conditions'] > 0).sum()}")
    
    print(f"\nMonthly Budget Summary:")
    print(f"  Average Monthly Budget: ${budget_df['budget'].mean():,.2f}")
    print(f"  Average Monthly Net Cost: ${budget_df['net_cost'].mean():,.2f}")
    print(f"  Average Loss Ratio: {budget_df['loss_ratio'].mean():.1f}%")
    
    print("\n✓ All sample data generated successfully!")
    print("✓ Ready to load into Healthcare Analytics Dashboard")

if __name__ == "__main__":
    main()