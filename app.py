from flask import Flask, render_template, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)

# Load the trained model
try:
    model = joblib.load('forecasting_co2_emmision.pkl')
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

# Feature names in the correct order
FEATURE_NAMES = [
    'cereal_yield',
    'gni_per_cap', 
    'en_per_cap',
    'pop_urb_aggl_perc',
    'prot_area_perc',
    'pop_growth_perc',
    'urb_pop_growth_perc'
]

# Feature descriptions for the UI
FEATURE_DESCRIPTIONS = {
    'cereal_yield': 'Cereal Yield (kg per hectare)',
    'gni_per_cap': 'GNI per Capita (current US$)',
    'en_per_cap': 'Energy Use per Capita (kg of oil equivalent)',
    'pop_urb_aggl_perc': 'Population in Urban Agglomerations (%)',
    'prot_area_perc': 'Terrestrial Protected Areas (% of total land)',
    'pop_growth_perc': 'Population Growth Rate (%)',
    'urb_pop_growth_perc': 'Urban Population Growth Rate (%)'
}

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html', 
                         feature_names=FEATURE_NAMES,
                         feature_descriptions=FEATURE_DESCRIPTIONS)

@app.route('/predict', methods=['POST'])
def predict():
    """Handle prediction requests"""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract features in the correct order
        features = []
        missing_features = []
        
        for feature_name in FEATURE_NAMES:
            if feature_name in data:
                try:
                    value = float(data[feature_name])
                    features.append(value)
                except (ValueError, TypeError):
                    return jsonify({'error': f'Invalid value for {feature_name}'}), 400
            else:
                missing_features.append(feature_name)
        
        if missing_features:
            return jsonify({'error': f'Missing features: {", ".join(missing_features)}'}), 400
        
        # Convert to numpy array and reshape for prediction
        features_array = np.array(features).reshape(1, -1)
        
        # Make prediction
        prediction = model.predict(features_array)[0]
        
        # Return prediction
        return jsonify({
            'prediction': round(prediction, 3),
            'unit': 'metric tons CO2 per capita',
            'features_used': dict(zip(FEATURE_NAMES, features))
        })
        
    except Exception as e:
        return jsonify({'error': f'Prediction error: {str(e)}'}), 500

@app.route('/batch_predict', methods=['POST'])
def batch_predict():
    """Handle batch prediction requests for sensitivity analysis"""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500

        # Get JSON data from request
        data = request.get_json()

        if not data or 'predictions' not in data:
            return jsonify({'error': 'No prediction data provided'}), 400

        results = []

        for prediction_data in data['predictions']:
            # Extract features in the correct order
            features = []
            missing_features = []

            for feature_name in FEATURE_NAMES:
                if feature_name in prediction_data:
                    try:
                        value = float(prediction_data[feature_name])
                        features.append(value)
                    except (ValueError, TypeError):
                        return jsonify({'error': f'Invalid value for {feature_name}'}), 400
                else:
                    missing_features.append(feature_name)

            if missing_features:
                return jsonify({'error': f'Missing features: {", ".join(missing_features)}'}), 400

            # Convert to numpy array and reshape for prediction
            features_array = np.array(features).reshape(1, -1)

            # Make prediction
            prediction = model.predict(features_array)[0]
            results.append(round(prediction, 3))

        return jsonify({'predictions': results})

    except Exception as e:
        return jsonify({'error': f'Batch prediction error: {str(e)}'}), 500

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'features_required': len(FEATURE_NAMES)
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
