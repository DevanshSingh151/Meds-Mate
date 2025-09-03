import { type User, type InsertUser, type PatientData, type InsertPatientData, type IopPrediction, type InsertIopPrediction } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createPatientData(data: InsertPatientData): Promise<PatientData>;
  getPatientData(id: string): Promise<PatientData | undefined>;
  createIopPredictions(predictions: InsertIopPrediction[]): Promise<IopPrediction[]>;
  getIopPredictionsByPatientId(patientDataId: string): Promise<IopPrediction[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private patientData: Map<string, PatientData>;
  private iopPredictions: Map<string, IopPrediction>;

  constructor() {
    this.users = new Map();
    this.patientData = new Map();
    this.iopPredictions = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createPatientData(data: InsertPatientData): Promise<PatientData> {
    const id = randomUUID();
    const patientData: PatientData = { 
      ...data, 
      id, 
      createdAt: new Date() 
    };
    this.patientData.set(id, patientData);
    return patientData;
  }

  async getPatientData(id: string): Promise<PatientData | undefined> {
    return this.patientData.get(id);
  }

  async createIopPredictions(predictions: InsertIopPrediction[]): Promise<IopPrediction[]> {
    const createdPredictions: IopPrediction[] = [];
    
    for (const prediction of predictions) {
      const id = randomUUID();
      const iopPrediction: IopPrediction = {
        ...prediction,
        id,
        createdAt: new Date()
      };
      this.iopPredictions.set(id, iopPrediction);
      createdPredictions.push(iopPrediction);
    }
    
    return createdPredictions;
  }

  async getIopPredictionsByPatientId(patientDataId: string): Promise<IopPrediction[]> {
    return Array.from(this.iopPredictions.values()).filter(
      (prediction) => prediction.patientDataId === patientDataId
    );
  }
}

export const storage = new MemStorage();
