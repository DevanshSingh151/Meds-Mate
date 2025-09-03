import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download } from "lucide-react";

interface IopPrediction {
  hour: number;
  predicted_iop: number;
  risk_level: string;
}

interface IopChartProps {
  predictions?: IopPrediction[];
}

export default function IopChart({ predictions }: IopChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!predictions || predictions.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground flex items-center">
            <BarChart3 className="text-chart-2 mr-3" />
            24-Hour IOP Forecast
          </h2>
        </div>
        
        <div className="h-64 flex items-center justify-center text-center text-muted-foreground">
          <div>
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Generate forecast to view IOP predictions</p>
          </div>
        </div>
      </Card>
    );
  }

  const maxIop = Math.max(...predictions.map(p => p.predicted_iop));
  const minIop = Math.min(...predictions.map(p => p.predicted_iop));
  const range = maxIop - minIop + 1;

  const getBarColor = (iop: number) => {
    if (iop >= 21) return "bg-destructive";
    if (iop >= 18) return "bg-chart-3";
    if (iop >= 15) return "bg-chart-2";
    return "bg-chart-1";
  };

  const exportChart = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Hour,IOP (mmHg),Risk Level\n" +
      predictions.map(p => `${p.hour}:00,${p.predicted_iop},${p.risk_level}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "iop_forecast.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center">
          <BarChart3 className="text-chart-2 mr-3" />
          24-Hour IOP Forecast
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={exportChart}
          data-testid="button-export-chart"
        >
          <Download className="w-4 h-4 mr-1" />
          Export Chart
        </Button>
      </div>
      
      <div className="relative">
        <div className="h-64 flex items-end justify-between space-x-1 border-b border-border pb-4">
          {predictions.filter((_, i) => i % 3 === 0).map((prediction, index) => {
            const actualIndex = index * 3;
            const height = ((prediction.predicted_iop - minIop) / range) * 80;
            const isHovered = hoveredIndex === actualIndex;
            
            return (
              <div
                key={actualIndex}
                className="flex-1 flex flex-col items-center group relative cursor-pointer chart-bar"
                onMouseEnter={() => setHoveredIndex(actualIndex)}
                onMouseLeave={() => setHoveredIndex(null)}
                data-testid={`chart-bar-${actualIndex}`}
              >
                <div
                  className={`${getBarColor(prediction.predicted_iop)} rounded-t-md transition-all duration-300 relative w-full`}
                  style={{
                    height: `${height}%`,
                    minHeight: "8px",
                    transform: isHovered ? "scaleY(1.05)" : "scaleY(1)",
                    filter: isHovered ? "brightness(1.1)" : "brightness(1)"
                  }}
                >
                  {isHovered && (
                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap z-10">
                      <div className="font-semibold">{prediction.hour}:00</div>
                      <div>{prediction.predicted_iop} mmHg</div>
                      <div className="capitalize">{prediction.risk_level} risk</div>
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1 transition-opacity duration-200 group-hover:opacity-100 opacity-70">
                  {prediction.hour}:00
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Threshold lines */}
        <div className="absolute left-0 top-0 w-full h-64 pointer-events-none">
          <div className="absolute w-full border-t-2 border-destructive border-dashed opacity-60" style={{ top: "25%" }}>
            <span className="bg-destructive text-destructive-foreground px-2 py-1 text-xs rounded-md ml-2">
              High Risk (21+ mmHg)
            </span>
          </div>
          <div className="absolute w-full border-t-2 border-chart-3 border-dashed opacity-60" style={{ top: "50%" }}>
            <span className="bg-chart-3 text-white px-2 py-1 text-xs rounded-md ml-2">
              Elevated (18-21 mmHg)
            </span>
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>12 AM</span>
        </div>
        
        <div className="flex justify-between text-sm text-muted-foreground mt-3 font-medium">
          <span data-testid="text-min-iop">Minimum: {minIop.toFixed(1)} mmHg</span>
          <span data-testid="text-max-iop">Maximum: {maxIop.toFixed(1)} mmHg</span>
        </div>
      </div>
    </Card>
  );
}
