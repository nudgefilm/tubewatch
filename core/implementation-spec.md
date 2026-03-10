# TubeWatch Implementation Specification

## Overview

This document defines the implementation structure and coding standards used in the TubeWatch project.

The purpose of this document is to ensure consistent implementation across all modules and to support AI-assisted development using Cursor.

TubeWatch follows a Block Development Architecture, where each functional block is implemented independently and later integrated through a defined analysis pipeline.

---

## Project Structure

The TubeWatch repository follows a structured project layout.

tubewatch/

docs/
.cursor/

src/
  app/
  components/
  features/
  lib/
  types/

Each layer has a specific responsibility to maintain modularity and scalability.

---

## Application Layer

TubeWatch uses Next.js 14 App Router as the main application framework.

Responsibilities of the application layer:

- page routing
- server-side logic
- API endpoints
- UI rendering

Example application routes:

/channels  
/analysis  
/analysis/[channelId]

---

## Backend API Layer

Backend logic is implemented through Next.js API routes.

Example endpoints:

/api/analysis/request  
/api/analysis/[channelId]  
/api/worker/analyze

API routes are responsible for:

- receiving analysis requests
- managing analysis jobs
- returning analysis results
- triggering worker processes

---

## Worker Execution

Analysis processing is executed through a worker endpoint.

Worker endpoint:

/api/worker/analyze

Worker responsibilities:

1. fetch YouTube channel data
2. generate analysis features
3. execute AI analysis
4. store results in the database

Workers operate asynchronously and process jobs from the analysis queue.

---

## Feature Engine Implementation

The Feature Engine transforms raw YouTube data into structured analysis features.

Primary functions:

normalizeVideoMetrics  
buildChannelFeatures  
featureScoring

Responsibilities:

- normalize video metrics
- calculate engagement ratios
- generate channel-level features
- compute feature scores

Feature Engine modules must remain independent from AI analysis and database logic.

---

## AI Analysis Implementation

AI-based strategic analysis is implemented using Gemini.

Primary function:

analyzeChannelWithGemini

Responsibilities:

- interpret channel features
- identify channel strengths
- detect growth opportunities
- generate strategy suggestions

AI modules must not directly interact with the database.

---

## Data Fetch Implementation

YouTube data collection is handled through dedicated fetch modules.

Primary functions:

fetchChannelData  
fetchChannelVideos

Responsibilities:

- retrieve channel information
- retrieve video statistics
- retrieve engagement data
- prepare raw data for feature generation

---

## Storage Implementation

Analysis results are stored using a dedicated storage layer.

Primary function:

saveAnalysisResult

Responsibilities:

- store feature scores
- store AI analysis results
- store metadata for each analysis job

Primary database table:

analysis_results

---

## Database Layer

TubeWatch uses Supabase PostgreSQL as the main database.

Important tables:

users  
user_channels  
analysis_jobs  
analysis_queue  
analysis_results  
product_events  
system_limits

Database interactions include:

- inserting analysis jobs
- managing analysis queue
- storing analysis results
- retrieving results for UI display

---

## UI Layer Implementation

The UI layer displays analysis results to users.

Primary pages:

/analysis  
/analysis/[channelId]

Responsibilities:

- display channel analysis summary
- show feature scores
- display AI insights
- visualize performance indicators

The UI layer should not contain analysis logic.

---

## Block Development Architecture

TubeWatch development is organized into functional blocks.

Each block has clearly defined responsibilities.

Block structure:

Block A — Feature Engine  
Block B — Gemini AI Engine  
Block C — YouTube Data Fetch  
Block D — Storage Layer  
Block E — Worker  
Block F — UI Layer

Each block must remain independent and communicate only through defined interfaces.

---

## Analysis Pipeline

All analysis processes must follow the defined pipeline.

YouTube Fetch  
↓  
Feature Engine  
↓  
Gemini AI Analysis  
↓  
Result Storage  
↓  
UI Display

This pipeline ensures predictable and modular system behavior.

---

## Code Design Principles

Single Responsibility

Each module should perform one clearly defined task.

Example:

Feature Engine → feature generation  
AI Engine → strategy analysis  
Storage Layer → database persistence

---

Block Isolation

Blocks must remain isolated from unrelated modules.

Example:

Feature Engine should not access the database directly.

---

Clear Interfaces

Each module must define clear inputs and outputs.

Feature Engine Input:

channel data  
video data  

Feature Engine Output:

channel features  
feature scores

---

## TypeScript Standards

TubeWatch is implemented using TypeScript.

Requirements:

- strict type safety
- explicit function return types
- avoid use of any
- define clear interfaces for data structures

---

## Error Handling

All modules should implement basic error handling.

Examples:

- YouTube API errors
- AI analysis errors
- database write failures

Errors should be logged and handled gracefully.

---

## Implementation Goals

The implementation design focuses on:

- modular development
- stable analysis pipeline
- scalable SaaS architecture
- compatibility with AI-assisted development tools

