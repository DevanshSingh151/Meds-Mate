import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";
import { type RealTimeRiskResponse } from "@shared/schema";

export default function RiskAssessment() {
  const [riskData, setRiskData] = useState<RealTimeRiskResponse>({
    risk_percentage: 0,
    risk_level: "low",
    average_predicted_iop: 14.5,
    message: "Enter patient data to calculate personalized risk assessment..."
  });

  useEffect(() => {
    const handleRiskUpdate = (event: CustomEvent<RealTimeRiskResponse>) => {
      setRiskData(event.detail);
    };

    window.addEventListener('riskUpdate', handleRiskUpdate as EventListener);
    return () => window.removeEventListener('riskUpdate', handleRiskUpdate as EventListener);
  }, []);

  const getRiskConfig = (level: string) => {
    const configs = {
      low: {
        bg: "bg-chart-1/10",
        border: "border-chart-1/20",
        text: "text-chart-1",
        badge: "bg-chart-1 text-white",
        progress: "bg-chart-1"
      },
      moderate: {
        bg: "bg-chart-3/10",
        border: "border-chart-3/20", 
        text: "text-chart-3",
        badge: "bg-chart-3 text-white",
        progress: "bg-chart-3"
      },
      high: {
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        text: "text-orange-600",
        badge: "bg-orange-500 text-white",
        progress: "bg-orange-500"
      },
      critical: {
        bg: "bg-destructive/10",
        border: "border-destructive/20",
        text: "text-destructive",
        badge: "bg-destructive text-destructive-foreground",
        progress: "bg-destructive"
      }
    };
    return configs[level as keyof typeof configs] || configs.low;
  };

  const config = getRiskConfig(riskData.risk_level);

  return (
    <Card className={`p-6 ${config.bg} border-2 ${config.border}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center">
          <AlertTriangle className="text-chart-3 mr-3" />
          Real-Time Risk Assessment
        </h2>
        <div className={`risk-indicator px-3 py-1 rounded-full text-sm font-medium ${config.badge}`}>
          {riskData.risk_level.charAt(0).toUpperCase() + riskData.risk_level.slice(1)} Risk
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className={`text-3xl font-bold ${config.text}`} data-testid="text-current-risk">
            {riskData.risk_percentage.toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">Above Threshold</div>
        </div>
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-3xl font-bold text-chart-2" data-testid="text-avg-iop">
            {riskData.average_predicted_iop.toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground">Predicted Avg IOP (mmHg)</div>
        </div>
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className={`text-3xl font-bold ${config.text}`} data-testid="text-risk-level">
            {riskData.risk_level.charAt(0).toUpperCase() + riskData.risk_level.slice(1)}
          </div>
          <div className="text-sm text-muted-foreground">Risk Category</div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>Risk Progress</span>
          <span data-testid="text-risk-percentage">{riskData.risk_percentage.toFixed(1)}%</span>
        </div>
        <Progress 
          value={riskData.risk_percentage} 
          className="h-3"
          data-testid="progress-risk"
        />
      </div>
      
      <div className="mt-4 p-4 bg-accent rounded-lg">
        <p className="text-sm text-foreground" data-testid="text-risk-message">
          {riskData.message}
        </p>
      </div>
    </Card>
  );
}
