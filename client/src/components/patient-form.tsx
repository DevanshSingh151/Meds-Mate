import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertPatientDataSchema, type IopForecastResponse, type RealTimeRiskResponse } from "@shared/schema";
import { UserRound, Calendar, Bed, Brain, Activity, Droplets, Heart, Dna, Pill, Clock } from "lucide-react";

interface PatientFormProps {
  onPredictionsUpdate: (predictions: IopForecastResponse) => void;
  onError: (error: string) => void;
  onLoadingChange: (loading: boolean) => void;
  loading: boolean;
}

export default function PatientForm({ 
  onPredictionsUpdate, 
  onError, 
  onLoadingChange,
  loading 
}: PatientFormProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    age: 50,
    gender: "male",
    sleepQuality: 7,
    stressLevel: 4,
    physicalActivity: 5,
    diabetesStatus: "none",
    bloodSugar: 100,
    systolicBP: 120,
    diastolicBP: 80,
    familyHistory: "none",
    currentMedications: "none",
    lastDropHours: 24,
  });

  // Update risk assessment whenever form data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateRealTimeRisk();
    }, 300); // Debounce updates

    return () => clearTimeout(timeoutId);
  }, [formData]);

  const calculateRealTimeRisk = async () => {
    try {
      const response = await apiRequest("POST", "/api/calculate-risk", formData);
      const riskData: RealTimeRiskResponse = await response.json();
      
      // Update risk assessment component via custom event
      window.dispatchEvent(new CustomEvent('riskUpdate', { detail: riskData }));
    } catch (error) {
      console.error("Risk calculation failed:", error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSliderChange = (field: string, values: number[]) => {
    setFormData(prev => ({ ...prev, [field]: values[0] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onLoadingChange(true);
    onError("");

    try {
      const validatedData = insertPatientDataSchema.parse(formData);
      const response = await apiRequest("POST", "/api/predict-iop", validatedData);
      const predictions: IopForecastResponse = await response.json();
      
      onPredictionsUpdate(predictions);
      toast({
        title: "Forecast Generated",
        description: "IOP predictions have been successfully calculated.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate predictions";
      onError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      onLoadingChange(false);
    }
  };

  return (
    <Card className="p-6 sticky top-8">
      <div className="flex items-center mb-6">
        <UserRound className="text-primary text-2xl mr-3" />
        <h2 className="text-2xl font-bold text-foreground">Patient Information</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6" data-testid="patient-form">
        {/* Demographics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            Demographics
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center mb-2">
                <Calendar className="w-4 h-4 mr-1" />
                Age
              </Label>
              <Input
                type="number"
                min="18"
                max="100"
                value={formData.age}
                onChange={(e) => handleInputChange("age", parseInt(e.target.value))}
                data-testid="input-age"
              />
            </div>
            <div>
              <Label className="flex items-center mb-2">
                Gender
              </Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger data-testid="select-gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Lifestyle Factors */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            Lifestyle Factors
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label className="flex items-center mb-2">
                <Bed className="w-4 h-4 mr-1" />
                Sleep Quality (1-10)
                <span className="text-primary font-semibold ml-2" data-testid="text-sleep-value">
                  {formData.sleepQuality}
                </span>
              </Label>
              <Slider
                value={[formData.sleepQuality]}
                onValueChange={(values) => handleSliderChange("sleepQuality", values)}
                min={1}
                max={10}
                step={1}
                className="w-full"
                data-testid="slider-sleep-quality"
              />
            </div>
            
            <div>
              <Label className="flex items-center mb-2">
                <Brain className="w-4 h-4 mr-1" />
                Stress Level (1-10)
                <span className="text-primary font-semibold ml-2" data-testid="text-stress-value">
                  {formData.stressLevel}
                </span>
              </Label>
              <Slider
                value={[formData.stressLevel]}
                onValueChange={(values) => handleSliderChange("stressLevel", values)}
                min={1}
                max={10}
                step={1}
                className="w-full"
                data-testid="slider-stress-level"
              />
            </div>
            
            <div>
              <Label className="flex items-center mb-2">
                <Activity className="w-4 h-4 mr-1" />
                Physical Activity (1-10)
                <span className="text-primary font-semibold ml-2" data-testid="text-activity-value">
                  {formData.physicalActivity}
                </span>
              </Label>
              <Slider
                value={[formData.physicalActivity]}
                onValueChange={(values) => handleSliderChange("physicalActivity", values)}
                min={1}
                max={10}
                step={1}
                className="w-full"
                data-testid="slider-physical-activity"
              />
            </div>
          </div>
        </div>

        {/* Health Conditions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            Health Conditions
          </h3>
          
          <div>
            <Label className="flex items-center mb-2">
              <Droplets className="w-4 h-4 mr-1" />
              Diabetes Status
            </Label>
            <Select 
              value={formData.diabetesStatus} 
              onValueChange={(value) => handleInputChange("diabetesStatus", value)}
            >
              <SelectTrigger data-testid="select-diabetes">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Diabetes</SelectItem>
                <SelectItem value="type1">Type 1 Diabetes</SelectItem>
                <SelectItem value="type2">Type 2 Diabetes</SelectItem>
                <SelectItem value="prediabetes">Pre-diabetes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {formData.diabetesStatus !== "none" && (
            <div>
              <Label className="flex items-center mb-2">
                Blood Sugar Level (mg/dL)
              </Label>
              <Input
                type="number"
                min="70"
                max="400"
                value={formData.bloodSugar}
                onChange={(e) => handleInputChange("bloodSugar", parseInt(e.target.value))}
                placeholder="Enter current level"
                data-testid="input-blood-sugar"
              />
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center mb-2">
                <Heart className="w-4 h-4 mr-1" />
                Systolic BP
              </Label>
              <Input
                type="number"
                min="80"
                max="200"
                value={formData.systolicBP}
                onChange={(e) => handleInputChange("systolicBP", parseInt(e.target.value))}
                data-testid="input-systolic-bp"
              />
            </div>
            <div>
              <Label className="flex items-center mb-2">
                <Heart className="w-4 h-4 mr-1" />
                Diastolic BP
              </Label>
              <Input
                type="number"
                min="40"
                max="120"
                value={formData.diastolicBP}
                onChange={(e) => handleInputChange("diastolicBP", parseInt(e.target.value))}
                data-testid="input-diastolic-bp"
              />
            </div>
          </div>
          
          <div>
            <Label className="flex items-center mb-2">
              <Dna className="w-4 h-4 mr-1" />
              Family History of Glaucoma
            </Label>
            <Select 
              value={formData.familyHistory} 
              onValueChange={(value) => handleInputChange("familyHistory", value)}
            >
              <SelectTrigger data-testid="select-family-history">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="sibling">Sibling</SelectItem>
                <SelectItem value="multiple">Multiple Relatives</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Treatment Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            Current Treatment
          </h3>
          
          <div>
            <Label className="flex items-center mb-2">
              <Pill className="w-4 h-4 mr-1" />
              Current Medications
            </Label>
            <Select 
              value={formData.currentMedications} 
              onValueChange={(value) => handleInputChange("currentMedications", value)}
            >
              <SelectTrigger data-testid="select-medications">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="timolol">Timolol</SelectItem>
                <SelectItem value="latanoprost">Latanoprost</SelectItem>
                <SelectItem value="brimonidine">Brimonidine</SelectItem>
                <SelectItem value="dorzolamide">Dorzolamide</SelectItem>
                <SelectItem value="combination">Combination Therapy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="flex items-center mb-2">
              <Clock className="w-4 h-4 mr-1" />
              Hours Since Last Eye Drop
            </Label>
            <Input
              type="number"
              min="0"
              max="48"
              value={formData.lastDropHours}
              onChange={(e) => handleInputChange("lastDropHours", parseInt(e.target.value))}
              data-testid="input-last-drop-hours"
            />
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full bg-primary hover:bg-primary hover:brightness-110 hover:contrast-110 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="button-generate-forecast"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <span className="mr-2">📊</span>
              Generate IOP Forecast
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
