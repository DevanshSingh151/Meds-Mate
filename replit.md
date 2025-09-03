# IOP Forecast - Glaucoma Management System

## Overview

This is a comprehensive medical application for Intraocular Pressure (IOP) forecasting and glaucoma management. The system combines machine learning predictions with real-time risk assessment to help healthcare professionals optimize treatment timing for glaucoma patients. It features a modern React frontend with a Node.js/Express backend that integrates Python-based ML models for 24-hour IOP predictions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite for development and building
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS styling
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints for health checks, risk calculation, and IOP predictions
- **Validation**: Zod schemas for request/response validation shared between client and server
- **Storage**: In-memory storage implementation with interface for easy database migration

### Data Storage Solutions
- **Database**: Configured for PostgreSQL with Drizzle ORM
- **Schema**: Well-defined tables for users, patient data, and IOP predictions
- **Migrations**: Drizzle migrations stored in `/migrations` directory
- **Current Implementation**: Memory-based storage for development with database interface ready

### Machine Learning Integration
- **ML Framework**: Python-based model using scikit-learn Random Forest
- **Model Features**: Circadian rhythm patterns, patient demographics, lifestyle factors
- **Prediction Scope**: 24-hour IOP forecasting with risk level classification
- **Integration**: Child process spawning to execute Python ML scripts from Node.js

### Authentication and Authorization
- **Current State**: Basic user schema defined but authentication not yet implemented
- **Prepared Schema**: User table with username/password fields ready for auth implementation
- **Session Management**: Connect-pg-simple package included for PostgreSQL session storage

## External Dependencies

### Third-party Services
- **Neon Database**: Serverless PostgreSQL database (@neondatabase/serverless)
- **Development**: Replit-specific plugins for runtime error handling and cartographer integration

### Core Libraries
- **UI Components**: Extensive Radix UI component library for accessible UI primitives
- **Styling**: Tailwind CSS with custom design system and CSS variables
- **Data Fetching**: TanStack React Query for efficient server state management
- **Validation**: Zod for runtime type checking and schema validation
- **Date Handling**: date-fns for date manipulation and formatting
- **Charts**: Custom chart components for IOP data visualization

### Development Tools
- **Build System**: Vite with React plugin and TypeScript support
- **Database Tools**: Drizzle Kit for schema management and migrations
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Asset Management**: Support for attached assets and custom path aliases

### Machine Learning Dependencies
- **Python Libraries**: NumPy, Pandas, and scikit-learn for ML model implementation
- **Model Requirements**: Defined in server/ml/requirements.txt for consistent environment setup