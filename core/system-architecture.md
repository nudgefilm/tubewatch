# TubeWatch System Architecture

## Architecture Overview

TubeWatch uses a modular SaaS architecture designed for data analysis and AI-driven insight generation.

The system processes YouTube channel data through a structured pipeline and presents analysis results to users.

Core architecture layers:

- Data Fetch Layer
- Feature Engine
- AI Analysis Engine
- Storage Layer
- Worker Execution Layer
- UI Layer

---

## Technology Stack

### Frontend

Framework:
- Next.js 14 (App Router)

Purpose:
- UI rendering
- page routing
- dashboard interface
- analysis visualization

---

### Backend

Primary backend services:

- Supabase (PostgreSQL database)
- Serverless API routes (Next.js)
- Worker execution endpoints

Responsibilities:

- user authentication
- database storage
- API endpoints
- analysis job management

---

### AI Engine

AI provider:

- Gemini AI

Purpose:

- analyze structured channel features
- generate strategy insights
- summarize channel performance

AI is used only for **analysis interpretation**, not raw data processing.

---

### Data Source

Primary external data source:

YouTube Data API

Collected data includes:

- channel statistics
- video statistics
- video metadata
- engagement metrics

---

## System Modules

### Data Fetch Layer

Responsible for collecting channel and video data.

Functions:

- fetchChannelData
- fetchChannelVideos

Input:
YouTube channel ID

Output:
raw channel and video data

---

### Feature Engine

Responsible for transforming raw YouTube data into structured analytical features.

Functions:

- normalizeVideoMetrics
- buildChannelFeatures
- featureScoring

Output:
structured feature dataset used for AI analysis

---

### AI Analysis Engine

Responsible for interpreting features and generating strategic insights.

Function:

- analyzeChannelWithGemini

Input:
channel features

Output:
analysis insights and strategy suggestions

---

### Storage Layer

Responsible for saving analysis results to the database.

Function:

- saveAnalysisResult

Primary table:

analysis_results

Stored data includes:

- feature scores
- AI insights
- analysis metadata

---

### Worker Execution Layer

Responsible for executing the full analysis pipeline.

Worker endpoint:

/api/worker/analyze

Worker responsibilities:

1. fetch YouTube data
2. generate channel features
3. run AI analysis
4. store results

---

### UI Layer

Responsible for displaying analysis results.

Main pages:

- `/analysis`
- `/analysis/[channelId]`

The UI reads data from the database and presents analysis results to users.

---

## Analysis Pipeline

TubeWatch analysis follows a fixed pipeline.

YouTube Data API  
↓  
Data Fetch Layer  
↓  
Feature Engine  
↓  
Gemini AI Analysis  
↓  
Result Storage  
↓  
UI Visualization

---

## Database Architecture

Primary database:

Supabase PostgreSQL

Important tables:

- users
- user_channels
- analysis_jobs
- analysis_queue
- analysis_results

Database stores both analysis inputs and results.

---

## Job Execution Model

Analysis execution follows a job-based model.

Process:

User requests analysis  
↓  
analysis job created  
↓  
job added to analysis queue  
↓  
worker processes job  
↓  
analysis result stored

This architecture allows asynchronous analysis execution.

---

## API Layer

Next.js API routes handle backend logic.

Example endpoints:

- `/api/analysis/request`
- `/api/analysis/[channelId]`
- `/api/worker/analyze`

API routes coordinate the interaction between frontend, database, and worker.

---

## Design Principles

### Modular Architecture

Each system component has a clear responsibility.

Example:

Feature Engine → feature generation  
AI Engine → insight generation  
Storage → persistence

---

### Pipeline Consistency

All analysis processes must follow the defined pipeline.

Fetch → Feature → AI → Storage → UI

---

### Block Development

TubeWatch development uses block-based architecture.

Blocks are implemented independently:

- Block A — Feature Engine
- Block B — Gemini AI Engine
- Block C — YouTube Fetch
- Block D — Storage
- Block E — Worker
- Block F — UI

---

## Deployment

Deployment platform:

- Vercel

Environment components:

- Next.js application
- Supabase backend
- Gemini API integration

The architecture supports serverless scaling.

---

## System Goals

Primary goals of the architecture:

- modular development
- stable analysis pipeline
- scalable SaaS structure
- AI-driven insight generation

