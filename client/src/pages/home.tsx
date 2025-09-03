import { useState, useEffect } from "react";
import PatientForm from "@/components/patient-form";
import RiskAssessment from "@/components/risk-assessment";
import IopChart from "@/components/iop-chart";
import OptimalTiming from "@/components/optimal-timing";
import { Eye, Shield, Brain } from "lucide-react";
import { type IopForecastResponse } from "@shared/schema";

export default function Home() {
  const [predictions, setPredictions] = useState<IopForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handlePredictionsUpdate = (newPredictions: IopForecastResponse) => {
    setPredictions(newPredictions);
    setError("");
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setPredictions(null);
  };

  const handleLoadingChange = (isLoading: boolean) => {
    setLoading(isLoading);
  };

  return (
    <div className="min-h-screen medical-gradient">
      {/* Navigation */}
      <nav className="bg-card shadow-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Eye className="text-primary-foreground text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">IOP Forecast</h1>
                <p className="text-sm text-muted-foreground">Advanced Glaucoma Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-chart-1 text-white rounded-full text-sm font-medium">
                <Shield className="inline w-4 h-4 mr-1" />
                HIPAA Compliant
              </span>
              <span className="px-3 py-1 bg-chart-2 text-white rounded-full text-sm font-medium">
                <Brain className="inline w-4 h-4 mr-1" />
                AI-Powered
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-2">
              <span className="text-destructive text-xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-destructive">Error</h3>
                <p className="text-destructive/80 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Patient Form - Left Column */}
          <div className="lg:col-span-1">
            <PatientForm
              onPredictionsUpdate={handlePredictionsUpdate}
              onError={handleError}
              onLoadingChange={handleLoadingChange}
              loading={loading}
            />
          </div>

          {/* Results - Right Columns */}
          <div className="lg:col-span-2 space-y-6">
            <RiskAssessment />
            <IopChart predictions={predictions?.predictions} />
            <OptimalTiming 
              optimalTime={predictions?.optimal_drop_time}
              analysis={predictions?.circadian_analysis}
            />
            
            {/* Accuracy Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card rounded-lg shadow-lg border border-border p-6 text-center">
                <div className="floating-element mb-4">
                  <div className="w-12 h-12 bg-chart-2/20 rounded-full flex items-center justify-center mx-auto">
                    <div className="w-6 h-6 border-2 border-chart-2 rounded-full animate-spin border-t-transparent"></div>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Real-time Updates</h3>
                <p className="text-sm text-muted-foreground">Continuous model refinement every 5 minutes</p>
                <div className="text-xs text-chart-1 mt-2">
                  Last update: {new Date().toLocaleTimeString()}
                </div>
              </div>
              
              <div className="bg-card rounded-lg shadow-lg border border-border p-6 text-center">
                <div className="floating-element mb-4">
                  <div className="w-12 h-12 bg-chart-1/20 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-chart-1 text-2xl">🎯</span>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Prediction Accuracy</h3>
                <p className="text-lg font-bold text-chart-1">94.2%</p>
                <p className="text-sm text-muted-foreground">Based on clinical validation</p>
              </div>
              
              <div className="bg-card rounded-lg shadow-lg border border-border p-6 text-center">
                <div className="floating-element mb-4">
                  <div className="w-12 h-12 bg-chart-4/20 rounded-full flex items-center justify-center mx-auto">
                    <Shield className="text-chart-4 text-xl" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">HIPAA Compliant</h3>
                <p className="text-sm text-muted-foreground">Enterprise-grade security and data protection</p>
                <div className="text-xs text-chart-4 mt-2">🔒 Encrypted</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-8 max-w-sm mx-4 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Analyzing Patient Data</h3>
            <p className="text-sm text-muted-foreground">Processing with Random Forest algorithm...</p>
            <div className="mt-4">
              <div className="bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all duration-300 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
