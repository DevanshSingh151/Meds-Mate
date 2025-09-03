import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPatientDataSchema, type IopForecastResponse, type RealTimeRiskResponse } from "@shared/schema";
import { spawn } from "child_process";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Real-time risk calculation endpoint
  app.post("/api/calculate-risk", async (req, res) => {
    try {
      const validatedData = insertPatientDataSchema.parse(req.body);
      
      // Calculate risk using medical algorithms
      const riskData = calculateRealTimeRisk(validatedData);
      
      res.json(riskData);
    } catch (error) {
      console.error("Risk calculation error:", error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Invalid data provided" 
      });
    }
  });

  // IOP prediction endpoint
  app.post("/api/predict-iop", async (req, res) => {
    try {
      const validatedData = insertPatientDataSchema.parse(req.body);
      
      // Store patient data
      const savedPatientData = await storage.createPatientData(validatedData);
      
      // Call Python ML model
      const predictions = await callPythonModel(validatedData);
      
      // Store predictions
      const predictionData = predictions.predictions.map(pred => ({
        patientDataId: savedPatientData.id,
        hour: pred.hour,
        predictedIop: pred.predicted_iop,
        riskLevel: pred.risk_level
      }));
      
      await storage.createIopPredictions(predictionData);
      
      res.json(predictions);
    } catch (error) {
      console.error("IOP prediction error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate predictions" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Medical risk calculation algorithm
function calculateRealTimeRisk(data: any): RealTimeRiskResponse {
  let riskScore = 0;
  
  // Age factor (higher age = higher risk)
  riskScore += Math.max(0, (data.age - 40) * 0.5);
  
  // Sleep quality (poor sleep = higher risk)
  riskScore += (10 - data.sleepQuality) * 2;
  
  // Stress level (high stress = higher risk)
  riskScore += data.stressLevel * 1.5;
  
  // Physical activity (low activity = higher risk)
  riskScore += (10 - data.physicalActivity) * 1.2;
  
  // Blood pressure (high BP = higher risk)
  if (data.systolicBP > 140 || data.diastolicBP > 90) riskScore += 8;
  else if (data.systolicBP > 130 || data.diastolicBP > 80) riskScore += 4;
  
  // Diabetes factor
  if (data.diabetesStatus === 'type1' || data.diabetesStatus === 'type2') riskScore += 12;
  else if (data.diabetesStatus === 'prediabetes') riskScore += 6;
  
  // Family history
  if (data.familyHistory === 'multiple') riskScore += 15;
  else if (data.familyHistory === 'parent' || data.familyHistory === 'sibling') riskScore += 8;
  
  // Time since last drop
  if (data.lastDropHours > 24) riskScore += (data.lastDropHours - 24) * 0.8;
  
  // Convert to percentage (cap at 100%)
  const riskPercentage = Math.min(100, Math.max(0, riskScore));
  
  // Calculate average predicted IOP based on risk
  const baseIOP = 14;
  const riskMultiplier = 1 + (riskPercentage / 100) * 0.6;
  const averagePredictedIop = parseFloat((baseIOP * riskMultiplier).toFixed(1));
  
  // Determine risk level
  let riskLevel: string;
  let message: string;
  
  if (riskPercentage < 20) {
    riskLevel = 'low';
    message = 'Current treatment appears to be working effectively. Continue current regimen.';
  } else if (riskPercentage < 40) {
    riskLevel = 'moderate';
    message = 'Elevated risk detected. Consider adjusting treatment schedule or medication.';
  } else if (riskPercentage < 70) {
    riskLevel = 'high';
    message = 'High risk of elevated IOP. Recommend immediate consultation with ophthalmologist.';
  } else {
    riskLevel = 'critical';
    message = 'Critical risk level. Emergency ophthalmology consultation required.';
  }
  
  return {
    risk_percentage: parseFloat(riskPercentage.toFixed(1)),
    risk_level: riskLevel,
    average_predicted_iop: averagePredictedIop,
    message
  };
}

// Call Python ML model
async function callPythonModel(data: any): Promise<IopForecastResponse> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'server', 'ml', 'iop_model.py');
    const python = spawn('python3', [pythonScript], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script error:', stderr);
        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse Python output: ${error}`));
      }
    });
    
    // Send input data to Python script
    python.stdin.write(JSON.stringify(data));
    python.stdin.end();
  });
}
