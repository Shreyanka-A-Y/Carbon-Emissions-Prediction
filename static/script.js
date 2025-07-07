// DOM elements
const form = document.getElementById('predictionForm');
const predictBtn = document.getElementById('predictBtn');
const clearBtn = document.getElementById('clearBtn');
const loadSampleBtn = document.getElementById('loadSampleBtn');
const resultsDiv = document.getElementById('results');
const errorDiv = document.getElementById('error');
const predictionValue = document.getElementById('predictionValue');
const inputSummary = document.getElementById('inputSummary');
const errorMessage = document.getElementById('errorMessage');

// Chart elements
const co2Level = document.getElementById('co2Level');
const countrySelect = document.getElementById('countrySelect');
const updateHistoricalBtn = document.getElementById('updateHistoricalBtn');
const sensitivityFeature = document.getElementById('sensitivityFeature');
const runSensitivityBtn = document.getElementById('runSensitivityBtn');

// New feature elements
const exportPdfBtn = document.getElementById('exportPdfBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const shareResultBtn = document.getElementById('shareResultBtn');
const saveSessionBtn = document.getElementById('saveSessionBtn');
const downloadChartBtn = document.getElementById('downloadChartBtn');
const randomDataBtn = document.getElementById('randomDataBtn');
const compareCountriesBtn = document.getElementById('compareCountriesBtn');
const whatIfBtn = document.getElementById('whatIfBtn');
const helpBtn = document.getElementById('helpBtn');
const historicalInsights = document.getElementById('historicalInsights');

// Chart instances
let comparisonChart = null;
let featureChart = null;
let historicalChart = null;
let sensitivityChart = null;

// Sample values for demonstration (India 2008 approximate values)
const sampleValues = {
    cereal_yield: 2800,
    gni_per_cap: 1200,
    en_per_cap: 500,
    pop_urb_aggl_perc: 30,
    prot_area_perc: 5,
    pop_growth_perc: 1.5,
    urb_pop_growth_perc: 2.5
};

// Feature descriptions for help text
const helpTexts = {
    cereal_yield: "Typical range: 1000-8000 kg/ha",
    gni_per_cap: "Typical range: $500-$50,000",
    en_per_cap: "Typical range: 200-8000 kg oil equivalent",
    pop_urb_aggl_perc: "Percentage: 0-100%",
    prot_area_perc: "Percentage: 0-50%",
    pop_growth_perc: "Typical range: -2% to +5%",
    urb_pop_growth_perc: "Typical range: -5% to +10%"
};

// Global data for charts
const globalCO2Data = {
    'global': [8.2, 8.5, 8.8, 9.1, 9.3, 9.5, 9.2, 8.9, 8.7, 8.5],
    'usa': [19.8, 19.2, 18.5, 17.8, 16.9, 16.2, 15.8, 15.3, 14.9, 14.2],
    'china': [3.2, 4.1, 5.2, 6.8, 7.9, 8.5, 8.8, 9.2, 9.8, 10.1],
    'india': [1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1],
    'germany': [11.2, 10.8, 10.3, 9.8, 9.4, 9.1, 8.7, 8.3, 8.0, 7.8],
    'japan': [9.8, 9.5, 9.2, 8.9, 8.6, 8.3, 8.0, 7.7, 7.4, 7.1]
};

const years = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    addHelpTexts();
    initializeCharts();
});

function setupEventListeners() {
    // Form submission
    form.addEventListener('submit', handleFormSubmit);

    // Clear button
    clearBtn.addEventListener('click', clearForm);

    // Load sample button
    loadSampleBtn.addEventListener('click', loadSampleValues);

    // Chart controls
    updateHistoricalBtn.addEventListener('click', updateHistoricalChart);
    runSensitivityBtn.addEventListener('click', runSensitivityAnalysis);

    // Export and share features
    exportPdfBtn.addEventListener('click', exportToPDF);
    exportCsvBtn.addEventListener('click', exportToCSV);
    shareResultBtn.addEventListener('click', shareResult);
    saveSessionBtn.addEventListener('click', saveSession);
    downloadChartBtn.addEventListener('click', downloadChart);

    // Quick actions
    randomDataBtn.addEventListener('click', generateRandomData);
    compareCountriesBtn.addEventListener('click', compareCountries);
    whatIfBtn.addEventListener('click', whatIfAnalysis);
    helpBtn.addEventListener('click', showHelp);

    // Input validation
    const inputs = form.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', validateInput);
    });
}

function addHelpTexts() {
    // Add help texts to form inputs
    Object.keys(helpTexts).forEach(feature => {
        const helpElement = document.querySelector(`#${feature} + .help-text`);
        if (helpElement) {
            helpElement.textContent = helpTexts[feature];
        }
    });
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Hide previous results/errors
    hideResults();
    hideError();
    
    // Show loading state
    setLoadingState(true);
    
    try {
        // Collect form data
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = parseFloat(value);
        }
        
        // Validate data
        if (!validateFormData(data)) {
            throw new Error('Please fill in all fields with valid numbers');
        }
        
        // Make prediction request
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Prediction failed');
        }
        
        // Display results
        displayResults(result);
        
    } catch (error) {
        displayError(error.message);
    } finally {
        setLoadingState(false);
    }
}

function validateFormData(data) {
    const requiredFields = [
        'cereal_yield', 'gni_per_cap', 'en_per_cap',
        'pop_urb_aggl_perc', 'prot_area_perc',
        'pop_growth_perc', 'urb_pop_growth_perc'
    ];
    
    for (let field of requiredFields) {
        if (!(field in data) || isNaN(data[field])) {
            return false;
        }
    }
    return true;
}

function validateInput(e) {
    const input = e.target;
    const value = parseFloat(input.value);
    
    // Remove any previous validation classes
    input.classList.remove('invalid');
    
    // Basic validation
    if (input.value && isNaN(value)) {
        input.classList.add('invalid');
    }
}

function displayResults(result) {
    predictionValue.textContent = result.prediction;

    // Update CO2 level indicator
    updateCO2Indicator(result.prediction);

    // Create input summary
    let summaryHTML = '<div class="input-grid">';
    Object.entries(result.features_used).forEach(([key, value]) => {
        const description = getFeatureDescription(key);
        summaryHTML += `<div><strong>${description}:</strong> ${value}</div>`;
    });
    summaryHTML += '</div>';

    inputSummary.innerHTML = summaryHTML;

    // Update charts
    updateComparisonChart(result.prediction);
    updateFeatureChart(result.features_used);

    // Show results
    showResults();
}

function displayError(message) {
    errorMessage.textContent = message;
    showError();
}

function getFeatureDescription(key) {
    const descriptions = {
        cereal_yield: 'Cereal Yield',
        gni_per_cap: 'GNI per Capita',
        en_per_cap: 'Energy per Capita',
        pop_urb_aggl_perc: 'Urban Agglomeration %',
        prot_area_perc: 'Protected Areas %',
        pop_growth_perc: 'Population Growth %',
        urb_pop_growth_perc: 'Urban Growth %'
    };
    return descriptions[key] || key;
}

function clearForm() {
    form.reset();
    hideResults();
    hideError();
    
    // Remove validation classes
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => input.classList.remove('invalid'));
}

function loadSampleValues() {
    Object.entries(sampleValues).forEach(([key, value]) => {
        const input = document.getElementById(key);
        if (input) {
            input.value = value;
        }
    });
    
    hideResults();
    hideError();
}

function setLoadingState(loading) {
    const btnText = predictBtn.querySelector('.btn-text');
    const loadingText = predictBtn.querySelector('.loading');
    
    if (loading) {
        btnText.style.display = 'none';
        loadingText.style.display = 'inline';
        predictBtn.disabled = true;
    } else {
        btnText.style.display = 'inline';
        loadingText.style.display = 'none';
        predictBtn.disabled = false;
    }
}

function showResults() {
    resultsDiv.style.display = 'block';
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

function hideResults() {
    resultsDiv.style.display = 'none';
}

function showError() {
    errorDiv.style.display = 'block';
    errorDiv.scrollIntoView({ behavior: 'smooth' });
}

function hideError() {
    errorDiv.style.display = 'none';
}

// Chart initialization and management functions
function initializeCharts() {
    // Initialize historical chart
    const historicalCtx = document.getElementById('historicalChart').getContext('2d');
    historicalChart = new Chart(historicalCtx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Global Average',
                data: globalCO2Data.global,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'CO2 Emissions per Capita Over Time'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'CO2 per Capita (metric tons)'
                    }
                }
            }
        }
    });
}

function updateCO2Indicator(prediction) {
    const maxValue = 25; // Maximum expected CO2 value
    const percentage = Math.min((prediction / maxValue) * 100, 100);
    co2Level.style.left = `${percentage}%`;
}

function updateComparisonChart(userPrediction) {
    const ctx = document.getElementById('comparisonChart').getContext('2d');

    if (comparisonChart) {
        comparisonChart.destroy();
    }

    const countries = ['Global Avg', 'USA', 'China', 'India', 'Germany', 'Your Input'];
    const values = [8.5, 14.2, 10.1, 2.1, 7.8, userPrediction];
    const colors = ['#36a2eb', '#ff6384', '#ff9f40', '#4bc0c0', '#9966ff', '#667eea'];

    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: countries,
            datasets: [{
                label: 'CO2 per Capita',
                data: values,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'CO2 per Capita (metric tons)'
                    }
                }
            }
        }
    });
}

function updateFeatureChart(features) {
    const ctx = document.getElementById('featureChart').getContext('2d');

    if (featureChart) {
        featureChart.destroy();
    }

    // Normalize features for visualization (0-100 scale)
    const normalizedFeatures = {
        'Cereal Yield': (features.cereal_yield / 8000) * 100,
        'GNI per Capita': (features.gni_per_cap / 50000) * 100,
        'Energy per Capita': (features.en_per_cap / 8000) * 100,
        'Urban Agglomeration': features.pop_urb_aggl_perc,
        'Protected Areas': features.prot_area_perc * 2, // Scale up for visibility
        'Population Growth': (features.pop_growth_perc + 2) * 20, // Shift and scale
        'Urban Growth': (features.urb_pop_growth_perc + 5) * 10 // Shift and scale
    };

    featureChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: Object.keys(normalizedFeatures),
            datasets: [{
                label: 'Feature Values (Normalized)',
                data: Object.values(normalizedFeatures),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function updateHistoricalChart() {
    const selectedCountry = countrySelect.value;
    const data = globalCO2Data[selectedCountry];
    const countryName = selectedCountry.charAt(0).toUpperCase() + selectedCountry.slice(1);

    historicalChart.data.datasets[0].data = data;
    historicalChart.data.datasets[0].label = countryName;
    historicalChart.update();

    // Update insights
    updateHistoricalInsights(selectedCountry, data);
}

function updateHistoricalInsights(country, data) {
    const trend = calculateTrend(data);
    const average = data.reduce((a, b) => a + b, 0) / data.length;
    const latest = data[data.length - 1];
    const change = ((latest - data[0]) / data[0] * 100).toFixed(1);

    const insights = `
        <p><strong>Average CO2 emissions:</strong> ${average.toFixed(1)} tons per capita</p>
        <p><strong>Latest value (2023):</strong> ${latest} tons per capita</p>
        <p><strong>Overall change:</strong> ${change}% since 2014</p>
        <p><strong>Trend:</strong> ${trend > 0 ? '📈 Increasing' : trend < 0 ? '📉 Decreasing' : '➡️ Stable'}</p>
    `;

    historicalInsights.innerHTML = insights;
}

function calculateTrend(data) {
    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = data.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = data.reduce((sum, _, x) => sum + x * x, 0);

    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

async function runSensitivityAnalysis() {
    const feature = sensitivityFeature.value;
    const ctx = document.getElementById('sensitivityChart').getContext('2d');

    if (sensitivityChart) {
        sensitivityChart.destroy();
    }

    // Show loading
    ctx.canvas.parentElement.innerHTML = '<div class="chart-loading">Running sensitivity analysis...</div>';

    // Get current form values
    const formData = new FormData(form);
    const baseData = {};
    for (let [key, value] of formData.entries()) {
        baseData[key] = parseFloat(value) || sampleValues[key];
    }

    // Generate range of values for the selected feature
    const baseValue = baseData[feature];
    const variations = [];
    const predictions = [];

    for (let i = -50; i <= 50; i += 10) {
        const variation = baseValue * (1 + i / 100);
        variations.push(i);

        // Create modified data
        const modifiedData = { ...baseData };
        modifiedData[feature] = variation;

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(modifiedData)
            });
            const result = await response.json();
            predictions.push(result.prediction);
        } catch (error) {
            predictions.push(null);
        }
    }

    // Recreate canvas
    ctx.canvas.parentElement.innerHTML = '<canvas id="sensitivityChart"></canvas>';
    const newCtx = document.getElementById('sensitivityChart').getContext('2d');

    sensitivityChart = new Chart(newCtx, {
        type: 'line',
        data: {
            labels: variations.map(v => `${v}%`),
            datasets: [{
                label: 'CO2 Prediction',
                data: predictions,
                borderColor: '#ff6384',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `Sensitivity to ${getFeatureDescription(feature)}`
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Percentage Change from Base Value'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'CO2 per Capita (metric tons)'
                    }
                }
            }
        }
    });
}

// Export and Share Functions
function exportToPDF() {
    // Simple PDF export using browser print
    const printWindow = window.open('', '_blank');
    const resultsContent = document.getElementById('results').innerHTML;

    printWindow.document.write(`
        <html>
            <head>
                <title>CO2 Emissions Prediction Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .prediction-value { font-size: 2rem; color: #667eea; text-align: center; }
                    .chart-container { margin: 20px 0; }
                    canvas { max-width: 100%; }
                </style>
            </head>
            <body>
                <h1>🌍 CO2 Emissions Prediction Report</h1>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>
                ${resultsContent}
            </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.print();
}

function exportToCSV() {
    const formData = new FormData(form);
    const data = [];

    // Add headers
    data.push(['Feature', 'Value', 'Unit']);

    // Add form data
    for (let [key, value] of formData.entries()) {
        const description = getFeatureDescription(key);
        data.push([description, value, getFeatureUnit(key)]);
    }

    // Add prediction if available
    const prediction = predictionValue.textContent;
    if (prediction !== '--') {
        data.push(['CO2 Prediction', prediction, 'metric tons per capita']);
    }

    // Convert to CSV
    const csvContent = data.map(row => row.join(',')).join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `co2_prediction_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function shareResult() {
    const prediction = predictionValue.textContent;
    if (prediction === '--') {
        alert('Please make a prediction first!');
        return;
    }

    const shareText = `🌍 My CO2 emissions prediction: ${prediction} metric tons per capita. Check out this interactive CO2 predictor!`;
    const shareUrl = window.location.href;

    if (navigator.share) {
        navigator.share({
            title: 'CO2 Emissions Prediction',
            text: shareText,
            url: shareUrl
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
            alert('Result copied to clipboard!');
        });
    }
}

function saveSession() {
    const sessionData = {
        timestamp: new Date().toISOString(),
        formData: {},
        prediction: predictionValue.textContent
    };

    // Save form data
    const formData = new FormData(form);
    for (let [key, value] of formData.entries()) {
        sessionData.formData[key] = value;
    }

    // Save to localStorage
    const sessions = JSON.parse(localStorage.getItem('co2_sessions') || '[]');
    sessions.push(sessionData);
    localStorage.setItem('co2_sessions', JSON.stringify(sessions));

    alert('Session saved! You can load it later from the browser storage.');
}

function downloadChart() {
    if (!historicalChart) {
        alert('No chart available to download!');
        return;
    }

    const canvas = historicalChart.canvas;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `co2_historical_chart_${new Date().toISOString().split('T')[0]}.png`;
    a.click();
}

// Quick Action Functions
function generateRandomData() {
    const randomValues = {
        cereal_yield: Math.floor(Math.random() * 6000) + 1000,
        gni_per_cap: Math.floor(Math.random() * 45000) + 500,
        en_per_cap: Math.floor(Math.random() * 7000) + 200,
        pop_urb_aggl_perc: Math.floor(Math.random() * 80) + 10,
        prot_area_perc: Math.floor(Math.random() * 40) + 1,
        pop_growth_perc: (Math.random() * 6 - 1).toFixed(1),
        urb_pop_growth_perc: (Math.random() * 8 - 2).toFixed(1)
    };

    Object.entries(randomValues).forEach(([key, value]) => {
        const input = document.getElementById(key);
        if (input) {
            input.value = value;
            input.classList.add('fade-in');
        }
    });

    hideResults();
    hideError();
}

function compareCountries() {
    const countryData = {
        'USA': { cereal_yield: 7000, gni_per_cap: 65000, en_per_cap: 7000, pop_urb_aggl_perc: 82, prot_area_perc: 15, pop_growth_perc: 0.7, urb_pop_growth_perc: 1.2 },
        'China': { cereal_yield: 6200, gni_per_cap: 10500, en_per_cap: 2200, pop_urb_aggl_perc: 60, prot_area_perc: 18, pop_growth_perc: 0.4, urb_pop_growth_perc: 2.8 },
        'India': { cereal_yield: 2800, gni_per_cap: 1900, en_per_cap: 600, pop_urb_aggl_perc: 34, prot_area_perc: 5, pop_growth_perc: 1.0, urb_pop_growth_perc: 2.3 }
    };

    const countries = Object.keys(countryData);
    const selectedCountry = countries[Math.floor(Math.random() * countries.length)];
    const data = countryData[selectedCountry];

    Object.entries(data).forEach(([key, value]) => {
        const input = document.getElementById(key);
        if (input) {
            input.value = value;
        }
    });

    alert(`Loaded sample data for ${selectedCountry}. Click predict to see the results!`);
}

function whatIfAnalysis() {
    const currentValues = {};
    const formData = new FormData(form);

    for (let [key, value] of formData.entries()) {
        currentValues[key] = parseFloat(value) || 0;
    }

    if (Object.keys(currentValues).length === 0) {
        alert('Please fill in the form first!');
        return;
    }

    const scenarios = [
        { name: '🌱 Green Scenario', multipliers: { en_per_cap: 0.7, prot_area_perc: 1.5, cereal_yield: 1.2 } },
        { name: '🏭 Industrial Scenario', multipliers: { en_per_cap: 1.5, gni_per_cap: 1.3, urb_pop_growth_perc: 1.4 } },
        { name: '🌿 Conservation Scenario', multipliers: { prot_area_perc: 2.0, en_per_cap: 0.6, pop_growth_perc: 0.8 } }
    ];

    let analysisText = 'What-If Analysis Results:\n\n';

    scenarios.forEach(scenario => {
        const modifiedValues = { ...currentValues };
        Object.entries(scenario.multipliers).forEach(([key, multiplier]) => {
            if (modifiedValues[key]) {
                modifiedValues[key] *= multiplier;
            }
        });

        analysisText += `${scenario.name}: Modified values ready for prediction\n`;
    });

    alert(analysisText + '\nTry different scenarios by modifying the values and predicting!');
}

function showHelp() {
    const helpContent = `
🌍 CO2 Emissions Predictor Help

📊 How to Use:
1. Fill in all 7 environmental and economic indicators
2. Click "Predict CO2 Emissions" to get results
3. Explore visualizations and comparisons
4. Use sensitivity analysis to understand feature impacts

📈 Features:
• Real-time predictions with visual indicators
• Global comparison charts
• Historical trend analysis
• Interactive sensitivity analysis
• Export and sharing options

💡 Tips:
• Use "Load Sample Values" for quick testing
• Try "Generate Random Data" for exploration
• Export results as PDF or CSV
• Save sessions for later reference

❓ Need more help? Check the documentation or contact support.
    `;

    alert(helpContent);
}

// Utility Functions
function getFeatureUnit(feature) {
    const units = {
        cereal_yield: 'kg/hectare',
        gni_per_cap: 'USD',
        en_per_cap: 'kg oil equivalent',
        pop_urb_aggl_perc: '%',
        prot_area_perc: '%',
        pop_growth_perc: '%',
        urb_pop_growth_perc: '%'
    };
    return units[feature] || '';
}

// Add some CSS for invalid inputs
const style = document.createElement('style');
style.textContent = `
    .form-group input.invalid {
        border-color: #dc3545;
        box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
    }

    .input-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 10px;
    }

    .input-grid div {
        padding: 8px;
        background: #f8f9fa;
        border-radius: 4px;
        border-left: 3px solid #667eea;
    }
`;
document.head.appendChild(style);
