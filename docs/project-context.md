# TubeWatch Project Context

## Project Overview

TubeWatch is a YouTube channel analytics SaaS designed to help creators understand and improve their channel growth using data-driven insights.

The platform analyzes channel data, extracts meaningful features, applies AI analysis, and generates strategic recommendations for channel growth.

TubeWatch focuses on **strategy-oriented analysis**, not just raw analytics.

---

## Core Objective

Provide YouTube creators with:

- channel performance diagnosis
- growth insights
- strategic action plans
- data-driven decision support

The goal is to transform raw YouTube data into **actionable growth strategies**.

---

## Core Concept

TubeWatch processes YouTube channel data through a multi-stage analysis pipeline.

Raw Data → Feature Extraction → AI Analysis → Insight Generation → Strategy Recommendation

---

## System Architecture

TubeWatch uses a modern serverless SaaS architecture.

Main stack:

- Next.js 14 (App Router)
- Supabase (Database + Auth)
- Gemini AI (analysis engine)
- YouTube Data API
- Vercel (deployment)

---

## Analysis Pipeline

The TubeWatch analysis pipeline works as follows.

YouTube API  
↓  
Data Fetch Layer  
↓  
Feature Engine  
↓  
Gemini AI Analysis  
↓  
Result Storage (analysis_results)  
↓  
UI Visualization

---

## Block Development Architecture

TubeWatch is developed using **Block Development Architecture**.

Each block is developed independently and later integrated.

Blocks:

### Block A — Feature Engine
Responsible for transforming raw YouTube data into structured analysis features.

Functions:

- normalizeVideoMetrics
- buildChannelFeatures
- featureScoring

---

### Block B — Gemini AI Engine
Responsible for AI-based strategic analysis.

Functions:

- analyzeChannelWithGemini

---

### Block C — YouTube Data Fetch
Responsible for collecting channel and video data from YouTube API.

Functions:

- fetchChannelData
- fetchChannelVideos

---

### Block D — Storage Layer
Responsible for saving analysis results.

Functions:

- saveAnalysisResult

Database target:

analysis_results table

---

### Block E — Worker
Responsible for executing the full analysis pipeline.

Worker Flow:

fetch data → build features → run AI analysis → store result

Worker Endpoint:

/api/worker/analyze

---

### Block F — UI Layer

Responsible for displaying analysis results.

Pages:

/analysis  
/analysis/[channelId]

---

## Data Flow Overview

Complete flow of TubeWatch analysis.

User requests analysis  
↓  
Create analysis job  
↓  
Worker fetches YouTube data  
↓  
Feature Engine builds analysis features  
↓  
Gemini generates strategy insights  
↓  
Results stored in database  
↓  
UI displays analysis result

---

## Key Design Principles

### Block Isolation

Each block must remain independent.

Blocks must not directly depend on future blocks.

---

### Clear Responsibility

Each module has a single responsibility.

Example:

Feature Engine → feature generation only  
Gemini Engine → AI analysis only  
Storage Layer → database write only

---

### Predictable Data Flow

All analysis must follow the pipeline structure.

Fetch → Feature → AI → Storage → UI

---

### Cursor AI Development Rules

When generating code:

- follow block architecture
- avoid modifying unrelated modules
- generate complete files
- maintain TypeScript safety

---

## Current Development Phase

TubeWatch is currently in **Alpha development phase**.

Goals of Alpha:

- complete analysis pipeline
- verify data flow
- validate AI analysis output
- confirm database storage
- basic UI visualization

---

## Future Expansion

Future modules planned for TubeWatch include:

- Action Plan Engine
- SEO Lab
- Benchmark Radar
- Next Trend Discovery
- Content DNA Analysis
- Growth Timing Analysis

These modules will be built after Alpha stabilization.

---

## Summary

TubeWatch transforms YouTube data into strategic insights using a structured AI-powered pipeline.

Architecture focuses on:

- modular block development
- clear data pipeline
- AI-assisted strategy generation
- scalable SaaS design

