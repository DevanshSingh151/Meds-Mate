from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from datetime import datetime, timedelta
import joblib
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


# Initialize or load model
def initialize_model():
    model_path = 'model.pkl'
    scaler_path = 'scaler.pkl'

    if os.path.exists(model_path) and os.path.exists(scaler_path):
        # Load existing model
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        print("Loaded existing model")
    else:
        # Create a simple model for demonstration
        print("Creating new model for demonstration...")
        model = RandomForestRegressor(n_estimators=50, random_state=42)
        scaler = StandardScaler()

        # Create simple training data
        np.random.seed(42)
        X_train = np.random.rand(100, 5)  # 100 samples, 5 features
        y_train = 15 + np.random.rand(100) * 10  # IOP values between 15-25 mmHg

        # Train model
        X_scaled = scaler.fit_transform(X_train)
        model.fit(X_scaled, y_train)

        # Save model
        joblib.dump(model, model_path)
        joblib.dump(scaler, scaler_path)
        print("Created and saved new model")

    return model, scaler


# Initialize the model
model, scaler = initialize_model()


@app.route('/')
def home():
    return jsonify({"message": "IOP Forecasting API", "status": "active", "model": "demo_model"})


@app.route('/api/predict-iop', methods=['POST', 'OPTIONS'])
def predict_iop():
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({"status": "ok"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

    try:
        patient_data = request.json
        print("Received data:", patient_data)  # Debug print

        # Set defaults for missing values
        defaults = {
            'age': 50,
            'sleep_quality': 7,
            'stress_level': 4,
            'physical_activity': 5,
            'last_drop_hours_ago': 24,
        }

        for key, value in defaults.items():
            if key not in patient_data:
                patient_data[key] = value

        # Prepare input for the model
        model_input = np.array([[
            patient_data['age'],
            patient_data['sleep_quality'],
            patient_data['stress_level'],
            patient_data['physical_activity'],
            patient_data['last_drop_hours_ago'],
        ]])

        # Scale and predict
        model_input_scaled = scaler.transform(model_input)
        base_prediction = model.predict(model_input_scaled)[0]

        # Generate IOP predictions with circadian rhythm
        predictions = generate_iop_predictions(base_prediction, patient_data)

        # Calculate optimal drop time
        optimal_time = calculate_optimal_drop_time(predictions)

        response = {
            'predictions': predictions,
            'optimal_drop_time': optimal_time,
            'circadian_analysis': analyze_circadian_pattern(predictions),
            'risk_assessment': assess_overall_risk(predictions),
            'model_type': 'demo_model'
        }

        return jsonify(response)

    except Exception as e:
        print("Error:", str(e))  # Debug print
        return jsonify({"error": str(e)}), 500


def generate_iop_predictions(base_prediction, patient_data):
    """Generate IOP predictions with circadian rhythm patterns"""
    predictions = []
    current_time = datetime.now()

    for hour_offset in range(24):
        prediction_time = current_time + timedelta(hours=hour_offset)

        # Create circadian rhythm pattern (higher in morning)
        hour = prediction_time.hour
        circadian_effect = 4 * np.sin((hour - 8) * np.pi / 12)  # Peak around 8am

        # Adjust based on patient factors
        sleep_effect = (10 - patient_data['sleep_quality']) * 0.3
        stress_effect = patient_data['stress_level'] * 0.4
        activity_effect = -patient_data['physical_activity'] * 0.2

        # Apply medication effect if recently taken
        medication_effect = 0
        if patient_data['last_drop_hours_ago'] < 12:
            medication_effect = -3 * (12 - patient_data['last_drop_hours_ago']) / 12

        predicted_iop = base_prediction + circadian_effect + sleep_effect + stress_effect + activity_effect + medication_effect

        # Add some randomness for realism
        predicted_iop += np.random.normal(0, 0.5)

        # Ensure IOP stays in realistic range (10-30 mmHg)
        predicted_iop = max(10, min(30, round(predicted_iop, 1)))

        predictions.append({
            'time': prediction_time.strftime('%Y-%m-%d %H:%M'),
            'hour': prediction_time.hour,
            'predicted_iop': predicted_iop,
            'risk_level': calculate_risk_level(predicted_iop),
            'recommended_action': generate_recommendation(predicted_iop, prediction_time.hour)
        })

    return predictions


def calculate_risk_level(iop_value):
    if iop_value < 18:
        return "low"
    elif iop_value < 22:
        return "moderate"
    elif iop_value < 26:
        return "high"
    else:
        return "critical"


def generate_recommendation(iop_value, hour):
    if iop_value > 25:
        return "Consider emergency consultation - very high pressure detected"
    elif iop_value > 21:
        return "Administer drops and avoid stressful activities"
    elif iop_value > 18:
        if hour >= 20 or hour <= 6:
            return "Monitor through night - consider sleep position adjustment"
        else:
            return "Normal pressure - maintain current regimen"
    else:
        return "Pressure well-controlled - continue current treatment"


def calculate_optimal_drop_time(predictions):
    """Calculate the best time to administer drops based on prediction pattern"""
    # Find when IOP starts rising significantly
    threshold = 21  # mmHg
    for i in range(1, len(predictions)):
        if (predictions[i]['predicted_iop'] > threshold and
                predictions[i]['predicted_iop'] > predictions[i - 1]['predicted_iop']):
            return predictions[i]['time']

    # Default to morning if no critical rise detected
    return "08:00"


def analyze_circadian_pattern(predictions):
    """Analyze the circadian rhythm pattern from predictions"""
    iop_values = [p['predicted_iop'] for p in predictions]

    analysis = {
        'peak_iop': max(iop_values),
        'trough_iop': min(iop_values),
        'avg_iop': sum(iop_values) / len(iop_values),
        'amplitude': max(iop_values) - min(iop_values),
        'peak_time': predictions[iop_values.index(max(iop_values))]['time'],
        'trough_time': predictions[iop_values.index(min(iop_values))]['time']
    }

    return analysis


def assess_overall_risk(predictions):
    """Provide overall risk assessment based on predictions"""
    high_iop_hours = sum(1 for p in predictions if p['predicted_iop'] > 21)
    critical_iop_hours = sum(1 for p in predictions if p['predicted_iop'] > 25)

    risk_percentage = (high_iop_hours / len(predictions)) * 100

    if critical_iop_hours > 0:
        return {
            'level': 'critical',
            'message': f'Critical pressure predicted for {critical_iop_hours} hours - immediate attention recommended',
            'risk_percentage': risk_percentage
        }
    elif risk_percentage > 30:
        return {
            'level': 'high',
            'message': f'High pressure predicted for {high_iop_hours} hours ({risk_percentage:.1f}% of time) - treatment adjustment may be needed',
            'risk_percentage': risk_percentage
        }
    elif risk_percentage > 10:
        return {
            'level': 'moderate',
            'message': f'Moderate elevation predicted for {high_iop_hours} hours - monitor closely',
            'risk_percentage': risk_percentage
        }
    else:
        return {
            'level': 'low',
            'message': 'Pressure well-controlled throughout prediction period',
            'risk_percentage': risk_percentage
        }


@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({"status": "healthy", "message": "Backend is running"})


if __name__ == '__main__':
    print("Starting IOP Forecast API server...")
    print("Server will be available at: http://localhost:5000")
    app.run(debug=True, port=5000, host='0.0.0.0')