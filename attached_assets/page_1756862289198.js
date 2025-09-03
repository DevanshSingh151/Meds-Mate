// app/page.js
"use client";

import { useState, useEffect } from 'react';

export default function Home() {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    age: '50',
    sleep_quality: '7',
    stress_level: '4',
    physical_activity: '5',
    last_drop_hours_ago: '24',
  });

  // Animation state
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    setIsVisible(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const testBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health');
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const isBackendRunning = await testBackendConnection();
      if (!isBackendRunning) {
        throw new Error('Backend server is not running. Please start the Flask server first.');
      }

      const processedData = {
        age: parseInt(formData.age),
        sleep_quality: parseInt(formData.sleep_quality),
        stress_level: parseInt(formData.stress_level),
        physical_activity: parseInt(formData.physical_activity),
        last_drop_hours_ago: parseInt(formData.last_drop_hours_ago),
      };

      const response = await fetch('http://localhost:5000/api/predict-iop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(processedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setPredictions(data);

    } catch (err) {
      setError(err.message || 'Failed to get predictions. Please try again.');
      console.error('Error details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Animated Card Component
  const AnimatedCard = ({ children, className = "", delay = 0 }) => (
    <div
      className={`bg-white rounded-xl shadow-lg transform transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease-out, transform 0.5s ease-out, box-shadow 0.3s ease`,
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );

  // Pulse loading animation
  const PulseLoader = () => (
    <div className="flex justify-center items-center space-x-2 py-6">
      <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
      <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
      <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
    </div>
  );

  // Enhanced chart component with animations
  const EnhancedChart = ({ data }) => {
    if (!data) return null;
    const maxIop = Math.max(...data.map(item => item.predicted_iop));
    const minIop = Math.min(...data.map(item => item.predicted_iop));
    const [hoveredIndex, setHoveredIndex] = useState(null);

    return (
      <AnimatedCard className="p-6 mt-6" delay={200}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">📊</span> 24-Hour IOP Forecast
        </h2>

        <div className="relative">
          <div className="flex h-48 items-end space-x-1">
            {data.filter((_, i) => i % 3 === 0).map((item, index) => {
              const height = ((item.predicted_iop - minIop) / (maxIop - minIop + 1)) * 90;
              const isHovered = hoveredIndex === index;

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center group relative"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div
                    className={`w-full rounded-t transition-all duration-300 ease-out ${
                      item.predicted_iop < 18 ? 'bg-gradient-to-b from-green-400 to-green-500' :
                      item.predicted_iop < 22 ? 'bg-gradient-to-b from-yellow-400 to-yellow-500' :
                      item.predicted_iop < 26 ? 'bg-gradient-to-b from-orange-400 to-orange-500' :
                      'bg-gradient-to-b from-red-500 to-red-600'
                    } ${isHovered ? 'opacity-100' : 'opacity-90'} hover:opacity-100`}
                    style={{
                      height: `${height}%`,
                      minHeight: '8px',
                      transition: 'height 0.5s ease-out, opacity 0.2s ease'
                    }}
                  />

                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-10 transform -translate-x-1/2 left-1/2">
                      <div className="font-semibold">{item.hour}:00</div>
                      <div>{item.predicted_iop} mmHg</div>
                      <div className="capitalize">{item.risk_level} risk</div>
                      <div className="triangle-down absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mt-2 transition-opacity duration-200 group-hover:opacity-100 opacity-70">
                    {item.hour}:00
                  </div>
                </div>
              );
            })}
          </div>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-48 flex flex-col justify-between text-xs text-gray-500 py-1 -ml-10">
            <span>{maxIop.toFixed(0)}</span>
            <span>{((maxIop + minIop) / 2).toFixed(0)}</span>
            <span>{minIop.toFixed(0)}</span>
          </div>

          <div className="flex justify-between text-sm text-gray-600 mt-3 font-medium">
            <span>Minimum: {minIop.toFixed(1)} mmHg</span>
            <span>Maximum: {maxIop.toFixed(1)} mmHg</span>
          </div>
        </div>
      </AnimatedCard>
    );
  };

  // Enhanced risk assessment with animations
  const EnhancedRiskAssessment = ({ assessment }) => {
    if (!assessment) return null;

    const riskConfig = {
      low: {
        bg: 'bg-gradient-to-r from-green-100 to-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        progress: 'bg-green-500',
        icon: '✅'
      },
      moderate: {
        bg: 'bg-gradient-to-r from-yellow-100 to-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        progress: 'bg-yellow-500',
        icon: '⚠️'
      },
      high: {
        bg: 'bg-gradient-to-r from-orange-100 to-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        progress: 'bg-orange-500',
        icon: '🔶'
      },
      critical: {
        bg: 'bg-gradient-to-r from-red-100 to-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        progress: 'bg-red-600',
        icon: '🚨'
      }
    };

    const config = riskConfig[assessment.level] || riskConfig.low;

    return (
      <AnimatedCard className={`border-2 p-5 mt-6 ${config.bg} ${config.border} ${config.text}`} delay={300}>
        <div className="flex items-start">
          <span className="text-2xl mr-3">{config.icon}</span>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">Risk Assessment</h3>
            <p className="mb-3 leading-relaxed">{assessment.message}</p>

            <div className="w-full bg-white rounded-full h-3 shadow-inner overflow-hidden">
              <div
                className={`h-3 rounded-full ${config.progress} transition-all duration-1000 ease-out`}
                style={{ width: `${Math.min(100, assessment.risk_percentage)}%` }}
              ></div>
            </div>

            <p className="text-sm mt-2 text-center font-medium">
              {assessment.risk_percentage.toFixed(1)}% of time above safe threshold
            </p>
          </div>
        </div>
      </AnimatedCard>
    );
  };

  // Enhanced optimal timing display
  const EnhancedOptimalTiming = ({ optimalTime, analysis }) => {
    if (!optimalTime || !analysis) return null;

    const timeString = optimalTime.includes(' ') ? optimalTime.split(' ')[1] : optimalTime;
    const [hour, minute] = timeString.split(':');
    const formattedTime = `${hour}:${minute || '00'}`;

    const now = new Date();
    const currentHour = now.getHours();
    const isFutureToday = parseInt(hour) > currentHour;

    return (
      <AnimatedCard className="p-6 mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200" delay={400}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">⏰</span> Optimal Treatment Timing
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-xl shadow-md transform transition-transform hover:scale-105">
            <div className="text-3xl font-bold text-blue-600 mb-2">{formattedTime}</div>
            <div className="text-sm text-blue-700">
              {isFutureToday ? "Today" : "Tomorrow"}
            </div>
            <div className="text-xs text-gray-500 mt-1">Recommended drop time</div>
          </div>

          <div className="text-center p-4 bg-white rounded-xl shadow-md transform transition-transform hover:scale-105">
            <div className="text-2xl font-bold text-green-600 mb-2">{analysis.peak_iop.toFixed(1)}</div>
            <div className="text-sm text-green-700">mmHg</div>
            <div className="text-xs text-gray-500 mt-1">Peak pressure</div>
          </div>

          <div className="text-center p-4 bg-white rounded-xl shadow-md transform transition-transform hover:scale-105">
            <div className="text-2xl font-bold text-purple-600 mb-2">{analysis.trough_iop.toFixed(1)}</div>
            <div className="text-sm text-purple-700">mmHg</div>
            <div className="text-xs text-gray-500 mt-1">Lowest pressure</div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <span className="text-yellow-600 mr-2">💡</span>
            <p className="text-sm text-yellow-700">
              Administering drops at the optimal time can improve effectiveness by up to 30%
            </p>
          </div>
        </div>
      </AnimatedCard>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      {/* Animated Header */}
      <header className={`bg-white rounded-2xl shadow-lg p-6 mb-8 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            IOP Forecast
          </h1>
          <p className="text-gray-600 text-lg">AI-Powered Glaucoma Treatment Optimization</p>

          <div className="mt-4 flex justify-center space-x-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Predictive</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">Personalized</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">AI-Driven</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 transform transition-all duration-500 animate-shake">
            <div className="flex items-start">
              <span className="text-red-600 text-xl mr-2">⚠️</span>
              <div>
                <h3 className="font-semibold text-red-800">Connection Issue</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <p className="text-red-600 text-xs mt-2">
                  Make sure your Flask backend is running: <code className="bg-red-100 px-2 py-1 rounded">python app.py</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Patient Input Form */}
        <AnimatedCard className="p-6 mb-8" delay={100}>
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="mr-2">👤</span> Patient Information
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="18"
                  max="100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hours Since Last Drop
                </label>
                <input
                  type="number"
                  name="last_drop_hours_ago"
                  value={formData.last_drop_hours_ago}
                  onChange={handleChange}
                  min="0"
                  max="48"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Slider Inputs with improved styling */}
            {[
              { name: 'sleep_quality', label: 'Sleep Quality', minLabel: 'Poor', maxLabel: 'Excellent', emoji: '😴' },
              { name: 'stress_level', label: 'Stress Level', minLabel: 'Low', maxLabel: 'High', emoji: '😌' },
              { name: 'physical_activity', label: 'Physical Activity', minLabel: 'Low', maxLabel: 'High', emoji: '🏃' }
            ].map(({ name, label, minLabel, maxLabel, emoji }) => (
              <div key={name} className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="mr-2">{emoji}</span> {label} (0-10)
                </label>

                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500 w-16">{minLabel}</span>
                  <input
                    type="range"
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    min="0"
                    max="10"
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                  <span className="text-sm text-gray-500 w-16 text-right">{maxLabel}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">0</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105">
                    Current: {formData[name]}/10
                  </span>
                  <span className="text-xs text-gray-500">10</span>
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-6 rounded-xl text-white font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              } flex items-center justify-center`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Forecast...
                </>
              ) : (
                <>
                  <span className="mr-2">✨</span> Generate IOP Forecast
                </>
              )}
            </button>
          </form>
        </AnimatedCard>

        {/* Loading Animation */}
        {loading && <PulseLoader />}

        {/* Results Section */}
        {predictions && (
          <div className="space-y-6">
            <EnhancedChart data={predictions.predictions} />
            <EnhancedOptimalTiming
              optimalTime={predictions.optimal_drop_time}
              analysis={predictions.circadian_analysis}
            />
            <EnhancedRiskAssessment assessment={predictions.risk_assessment} />
          </div>
        )}
      </main>

      {/* Enhanced Footer */}
      <footer className="mt-12 py-8 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <div className="border-t border-gray-200 pt-6">
            <p className="text-gray-600">
              IOP Forecast — Predictive glaucoma treatment optimization system
            </p>
            <p className="text-gray-500 text-sm mt-2">
              © {new Date().getFullYear()} Powered by AI and Medical Research
            </p>
          </div>
        </div>
      </footer>

      {/* Custom CSS for slider and animations */}
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(to bottom, #3b82f6, #2563eb);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
          transition: all 0.2s ease;
        }

        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.6);
        }

        .slider-thumb::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(to bottom, #3b82f6, #2563eb);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
          border: none;
          transition: all 0.2s ease;
        }

        .slider-thumb::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.6);
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}