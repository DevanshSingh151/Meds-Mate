import { useState, useRef } from "react";
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
  const chartRef = useRef<HTMLDivElement>(null);

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

  const getRiskInfo = (iop: number, riskLevel: string) => {
    if (iop >= 21) return { text: "Critical Risk", color: "text-red-600", bgColor: "bg-red-50", icon: "🚨" };
    if (iop >= 18) return { text: "High Risk", color: "text-orange-600", bgColor: "bg-orange-50", icon: "⚠️" };
    if (iop >= 15) return { text: "Moderate Risk", color: "text-yellow-600", bgColor: "bg-yellow-50", icon: "⚡" };
    return { text: "Low Risk", color: "text-green-600", bgColor: "bg-green-50", icon: "✅" };
  };

  // Create smooth line trace points
  const createTracePoints = () => {
    if (!predictions || predictions.length === 0) return [];
    
    return predictions.map((prediction, index) => {
      const x = (index / (predictions.length - 1)) * 100;
      const y = ((maxIop - prediction.predicted_iop) / range) * 80;
      return { x, y, prediction };
    });
  };

  const tracePoints = createTracePoints();

  const exportChart = async () => {
    if (!chartRef.current) return;
    
    try {
      // Import html2canvas dynamically
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const link = document.createElement("a");
      link.download = "iop_forecast_chart.png";
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting chart:', error);
      // Fallback to CSV export
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
    }
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
          className="hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:shadow-md"
          data-testid="button-export-chart"
        >
          <Download className="w-4 h-4 mr-1" />
          Export as Image
        </Button>
      </div>
      
      <div className="relative" ref={chartRef}>
        <div className="h-64 relative border border-border rounded-lg bg-gradient-to-b from-gray-50 to-white p-4">
          {/* Grid lines */}
          <div className="absolute inset-4 pointer-events-none">
            {[0, 20, 40, 60, 80].map((percent) => (
              <div
                key={percent}
                className="absolute w-full border-t border-gray-200 border-dashed opacity-50"
                style={{ top: `${percent}%` }}
              />
            ))}
            {[0, 25, 50, 75, 100].map((percent) => (
              <div
                key={percent}
                className="absolute h-full border-l border-gray-200 border-dashed opacity-50"
                style={{ left: `${percent}%` }}
              />
            ))}
          </div>

          {/* Trace Line */}
          {tracePoints.length > 0 && (
            <svg className="absolute inset-4 w-full h-full pointer-events-none" style={{ width: 'calc(100% - 2rem)', height: 'calc(100% - 2rem)' }}>
              <defs>
                <linearGradient id="traceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(213, 93%, 50%)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(213, 93%, 50%)" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              
              {/* Area under curve */}
              <path
                d={`M 0,100 ${tracePoints.map((point) => `L ${point.x},${point.y}`).join(' ')} L 100,100 Z`}
                fill="url(#traceGradient)"
              />
              
              {/* Main trace line */}
              <path
                d={`M ${tracePoints.map((point) => `${point.x},${point.y}`).join(' L ')}`}
                stroke="hsl(213, 93%, 50%)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
              />
              
              {/* Data points */}
              {tracePoints.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="white"
                  stroke="hsl(213, 93%, 50%)"
                  strokeWidth="2"
                  filter="drop-shadow(0 1px 2px rgba(0,0,0,0.2))"
                />
              ))}
            </svg>
          )}

          {/* Interactive overlay points */}
          <div className="absolute inset-4 flex items-end justify-between">
            {predictions.map((prediction, index) => {
              const height = ((prediction.predicted_iop - minIop) / range) * 80;
              const isHovered = hoveredIndex === index;
              const riskInfo = getRiskInfo(prediction.predicted_iop, prediction.risk_level);
              
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center group relative cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  data-testid={`chart-point-${index}`}
                  style={{ height: '100%' }}
                >
                  {/* Invisible hover area */}
                  <div className="absolute inset-0 w-full" />
                  
                  {/* Interactive point */}
                  <div
                    className={`absolute w-3 h-3 rounded-full border-2 border-white transition-all duration-200 ${
                      prediction.predicted_iop >= 21 ? 'bg-red-500' :
                      prediction.predicted_iop >= 18 ? 'bg-orange-500' :
                      prediction.predicted_iop >= 15 ? 'bg-yellow-500' : 'bg-green-500'
                    } ${isHovered ? 'scale-150 z-20' : 'scale-100 z-10'}`}
                    style={{
                      bottom: `${height}%`,
                      transform: `translateX(-50%) ${isHovered ? 'scale(1.5)' : 'scale(1)'}`,
                      boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                  
                  {/* Enhanced tooltip */}
                  {isHovered && (
                    <div className={`absolute -top-20 left-1/2 transform -translate-x-1/2 ${riskInfo.bgColor} border-2 border-white px-4 py-3 rounded-xl text-xs whitespace-nowrap z-30 shadow-xl`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{riskInfo.icon}</span>
                        <span className="font-bold text-gray-800">{prediction.hour}:00</span>
                      </div>
                      <div className="text-gray-700 font-semibold">{prediction.predicted_iop} mmHg</div>
                      <div className={`${riskInfo.color} font-bold text-xs`}>{riskInfo.text}</div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                    </div>
                  )}

                  {/* Time labels */}
                  {index % 4 === 0 && (
                    <div className="absolute -bottom-6 text-xs text-muted-foreground font-medium">
                      {prediction.hour}:00
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Risk level indicators */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <div className="flex items-center gap-1 px-3 py-1 bg-green-100 rounded-full text-xs">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-700 font-medium">Low Risk (&lt;15 mmHg)</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 rounded-full text-xs">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-yellow-700 font-medium">Moderate (15-18 mmHg)</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 rounded-full text-xs">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-orange-700 font-medium">High (18-21 mmHg)</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-red-100 rounded-full text-xs">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-red-700 font-medium">Critical (21+ mmHg)</span>
          </div>
        </div>
        
        <div className="flex justify-between text-sm text-muted-foreground mt-3 font-medium">
          <span data-testid="text-min-iop">Minimum: {minIop.toFixed(1)} mmHg</span>
          <span data-testid="text-max-iop">Maximum: {maxIop.toFixed(1)} mmHg</span>
        </div>
      </div>
    </Card>
  );
}
