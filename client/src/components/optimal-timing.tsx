import { Card } from "@/components/ui/card";
import { Clock, TrendingUp, TrendingDown, Lightbulb } from "lucide-react";

interface OptimalTimingProps {
  optimalTime?: string;
  analysis?: {
    peak_iop: number;
    trough_iop: number;
    average_iop: number;
  };
}

export default function OptimalTiming({ optimalTime, analysis }: OptimalTimingProps) {
  if (!optimalTime || !analysis) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center mb-6">
          <Clock className="text-chart-4 mr-3" />
          Optimal Treatment Timing
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Recommended Time", value: "--:--", icon: Clock },
            { label: "Peak Pressure", value: "-- mmHg", icon: TrendingUp },
            { label: "Trough Pressure", value: "-- mmHg", icon: TrendingDown },
          ].map((item, index) => (
            <div key={index} className="text-center p-6 bg-muted rounded-lg">
              <item.icon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold text-muted-foreground mb-2">{item.value}</div>
              <div className="text-sm text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // Parse optimal time
  const timeString = optimalTime.includes(" ") ? optimalTime.split(" ")[1] : optimalTime;
  const [hour] = timeString.split(":");
  const formattedTime = `${hour.padStart(2, "0")}:00`;

  // Determine if time is today or tomorrow
  const currentHour = new Date().getHours();
  const optimalHour = parseInt(hour);
  const isFutureToday = optimalHour > currentHour;

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-foreground flex items-center mb-6">
        <Clock className="text-chart-4 mr-3" />
        Optimal Treatment Timing
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-6 bg-primary/10 border border-primary/20 rounded-lg">
          <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
          <div className="text-3xl font-bold text-primary mb-2" data-testid="text-optimal-time">
            {formattedTime}
          </div>
          <div className="text-sm text-primary">Recommended Time</div>
          <div className="text-xs text-muted-foreground mt-1">
            {isFutureToday ? "Today" : "Tomorrow"}
          </div>
        </div>
        
        <div className="text-center p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-destructive" />
          <div className="text-3xl font-bold text-destructive mb-2" data-testid="text-peak-pressure">
            {analysis.peak_iop.toFixed(1)} mmHg
          </div>
          <div className="text-sm text-destructive">Peak Pressure</div>
          <div className="text-xs text-muted-foreground mt-1">Highest predicted IOP</div>
        </div>
        
        <div className="text-center p-6 bg-chart-1/10 border border-chart-1/20 rounded-lg">
          <TrendingDown className="w-8 h-8 mx-auto mb-2 text-chart-1" />
          <div className="text-3xl font-bold text-chart-1 mb-2" data-testid="text-trough-pressure">
            {analysis.trough_iop.toFixed(1)} mmHg
          </div>
          <div className="text-sm text-chart-1">Trough Pressure</div>
          <div className="text-xs text-muted-foreground mt-1">Lowest predicted IOP</div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-accent rounded-lg border border-border">
        <div className="flex items-start">
          <Lightbulb className="text-chart-3 mt-1 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-foreground mb-2">Clinical Insights</h4>
            <p className="text-sm text-muted-foreground">
              Optimal timing based on Random Forest analysis of clinical datasets.
              Personalized recommendations can improve treatment effectiveness by up to 35%.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
