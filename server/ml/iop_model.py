#!/usr/bin/env python3
import json
import sys
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

def create_circadian_features(hour):
    """Create circadian rhythm features"""
    return {
        'hour_sin': np.sin(2 * np.pi * hour / 24),
        'hour_cos': np.cos(2 * np.pi * hour / 24),
        'is_morning': 1 if 6 <= hour <= 11 else 0,
        'is_evening': 1 if 18 <= hour <= 23 else 0,
        'is_night': 1 if hour >= 22 or hour <= 5 else 0
    }

def encode_categorical(value, categories):
    """One-hot encode categorical variables"""
    return [1 if value == cat else 0 for cat in categories]

def predict_iop_24h(patient_data):
    """Predict IOP for 24 hours using Random Forest model"""
    
    # Create synthetic training data based on medical literature
    # This simulates a model trained on real glaucoma datasets
    np.random.seed(42)
    
    # Initialize Random Forest model
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    
    # Create synthetic training data representing realistic IOP patterns
    n_samples = 1000
    training_data = []
    training_targets = []
    
    for _ in range(n_samples):
        # Generate synthetic patient profiles
        age = np.random.normal(60, 15)
        sleep_quality = np.random.randint(1, 11)
        stress_level = np.random.randint(1, 11)
        physical_activity = np.random.randint(1, 11)
        systolic_bp = np.random.normal(130, 20)
        diastolic_bp = np.random.normal(80, 10)
        diabetes_factor = np.random.choice([0, 1, 2])  # none, prediabetes, diabetes
        family_history_factor = np.random.choice([0, 1, 2])  # none, some, strong
        hours_since_drop = np.random.uniform(0, 48)
        
        # Generate 24-hour IOP patterns
        for hour in range(24):
            circadian = create_circadian_features(hour)
            
            # Base IOP with circadian rhythm
            base_iop = 15 + 3 * np.sin((hour - 6) * np.pi / 12)
            
            # Risk factors influence
            age_effect = max(0, (age - 40) * 0.1)
            sleep_effect = (10 - sleep_quality) * 0.3
            stress_effect = stress_level * 0.2
            activity_effect = (10 - physical_activity) * 0.15
            bp_effect = max(0, (systolic_bp - 120) * 0.05)
            diabetes_effect = diabetes_factor * 2
            family_effect = family_history_factor * 1.5
            
            # Medication decay effect
            med_effectiveness = max(0.1, 1 - (hours_since_drop / 24) * 0.7)
            
            # Calculate final IOP
            iop = base_iop + age_effect + sleep_effect + stress_effect + activity_effect + bp_effect + diabetes_effect + family_effect
            iop = iop / med_effectiveness
            iop = max(8, min(35, iop + np.random.normal(0, 1)))
            
            # Create feature vector
            features = [
                age, sleep_quality, stress_level, physical_activity,
                systolic_bp, diastolic_bp, diabetes_factor, family_history_factor,
                hours_since_drop, circadian['hour_sin'], circadian['hour_cos'],
                circadian['is_morning'], circadian['is_evening'], circadian['is_night']
            ]
            
            training_data.append(features)
            training_targets.append(iop)
    
    # Train the model
    X_train = np.array(training_data)
    y_train = np.array(training_targets)
    model.fit(X_train, y_train)
    
    # Generate predictions for the actual patient
    predictions = []
    
    # Map patient data to model format
    age = patient_data['age']
    sleep_quality = patient_data['sleepQuality']
    stress_level = patient_data['stressLevel']
    physical_activity = patient_data['physicalActivity']
    systolic_bp = patient_data['systolicBP']
    diastolic_bp = patient_data['diastolicBP']
    
    # Map diabetes status
    diabetes_map = {'none': 0, 'prediabetes': 1, 'type1': 2, 'type2': 2}
    diabetes_factor = diabetes_map.get(patient_data['diabetesStatus'], 0)
    
    # Map family history
    family_map = {'none': 0, 'parent': 1, 'sibling': 1, 'multiple': 2}
    family_history_factor = family_map.get(patient_data['familyHistory'], 0)
    
    hours_since_drop = patient_data['lastDropHours']
    
    # Predict for each hour
    for hour in range(24):
        circadian = create_circadian_features(hour)
        
        # Create feature vector for prediction
        features = np.array([[
            age, sleep_quality, stress_level, physical_activity,
            systolic_bp, diastolic_bp, diabetes_factor, family_history_factor,
            hours_since_drop, circadian['hour_sin'], circadian['hour_cos'],
            circadian['is_morning'], circadian['is_evening'], circadian['is_night']
        ]])
        
        predicted_iop = model.predict(features)[0]
        predicted_iop = max(8, min(35, predicted_iop))
        
        # Determine risk level
        if predicted_iop < 18:
            risk_level = 'low'
        elif predicted_iop < 21:
            risk_level = 'moderate'
        elif predicted_iop < 26:
            risk_level = 'high'
        else:
            risk_level = 'critical'
        
        predictions.append({
            'hour': hour,
            'predicted_iop': round(predicted_iop, 1),
            'risk_level': risk_level
        })
        
        # Update hours since drop for next prediction
        hours_since_drop += 1
    
    # Analysis
    iop_values = [p['predicted_iop'] for p in predictions]
    peak_iop = max(iop_values)
    trough_iop = min(iop_values)
    average_iop = sum(iop_values) / len(iop_values)
    
    # Find optimal drop time (hour before peak)
    peak_hour = next(p['hour'] for p in predictions if p['predicted_iop'] == peak_iop)
    optimal_hour = (peak_hour - 2) % 24  # 2 hours before peak for drug onset
    
    # Risk assessment
    high_risk_hours = sum(1 for p in predictions if p['predicted_iop'] >= 21)
    risk_percentage = (high_risk_hours / 24) * 100
    
    if risk_percentage < 10:
        risk_level = 'low'
        risk_message = 'Current treatment appears to be working effectively. Continue current regimen.'
    elif risk_percentage < 25:
        risk_level = 'moderate'
        risk_message = 'Elevated risk detected. Consider adjusting treatment schedule or medication.'
    elif risk_percentage < 50:
        risk_level = 'high'
        risk_message = 'High risk of elevated IOP. Recommend immediate consultation with ophthalmologist.'
    else:
        risk_level = 'critical'
        risk_message = 'Critical risk level. Emergency ophthalmology consultation required.'
    
    return {
        'predictions': predictions,
        'optimal_drop_time': f"Day 1 {optimal_hour:02d}:00",
        'circadian_analysis': {
            'peak_iop': round(peak_iop, 1),
            'trough_iop': round(trough_iop, 1),
            'average_iop': round(average_iop, 1)
        },
        'risk_assessment': {
            'level': risk_level,
            'message': risk_message,
            'risk_percentage': round(risk_percentage, 1)
        }
    }

def main():
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Generate predictions
        result = predict_iop_24h(input_data)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'predictions': [],
            'optimal_drop_time': '',
            'circadian_analysis': {'peak_iop': 0, 'trough_iop': 0, 'average_iop': 0},
            'risk_assessment': {'level': 'unknown', 'message': 'Error in calculation', 'risk_percentage': 0}
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()
