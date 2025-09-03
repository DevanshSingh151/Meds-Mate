import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const patientData = pgTable("patient_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  sleepQuality: integer("sleep_quality").notNull(),
  stressLevel: integer("stress_level").notNull(),
  physicalActivity: integer("physical_activity").notNull(),
  diabetesStatus: text("diabetes_status").notNull(),
  bloodSugar: integer("blood_sugar"),
  systolicBP: integer("systolic_bp").notNull(),
  diastolicBP: integer("diastolic_bp").notNull(),
  familyHistory: text("family_history").notNull(),
  currentMedications: text("current_medications").notNull(),
  lastDropHours: integer("last_drop_hours").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const iopPredictions = pgTable("iop_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientDataId: varchar("patient_data_id").notNull(),
  hour: integer("hour").notNull(),
  predictedIop: real("predicted_iop").notNull(),
  riskLevel: text("risk_level").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPatientDataSchema = createInsertSchema(patientData).omit({
  id: true,
  createdAt: true,
});

export const insertIopPredictionSchema = createInsertSchema(iopPredictions).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPatientData = z.infer<typeof insertPatientDataSchema>;
export type PatientData = typeof patientData.$inferSelect;
export type InsertIopPrediction = z.infer<typeof insertIopPredictionSchema>;
export type IopPrediction = typeof iopPredictions.$inferSelect;

// API response types
export type IopForecastResponse = {
  predictions: Array<{
    hour: number;
    predicted_iop: number;
    risk_level: string;
  }>;
  optimal_drop_time: string;
  circadian_analysis: {
    peak_iop: number;
    trough_iop: number;
    average_iop: number;
  };
  risk_assessment: {
    level: string;
    message: string;
    risk_percentage: number;
  };
};

export type RealTimeRiskResponse = {
  risk_percentage: number;
  risk_level: string;
  average_predicted_iop: number;
  message: string;
};
