# TubeWatch Core Specification

## Service Definition

TubeWatch is a YouTube analytics SaaS platform designed to help creators understand channel performance and identify growth opportunities using data-driven analysis.

The system collects channel data, generates analytical features, applies AI-based strategic analysis, and presents structured insights for creators.

---

## Core Value

TubeWatch converts raw YouTube channel data into strategic insights that help creators improve content performance and channel growth.

Primary value areas:

- Channel diagnostics
- Growth pattern analysis
- Strategic recommendations
- Data-driven decision support

---

## Target Users

Primary users:

- YouTube creators
- Small to mid-size channels
- growth-focused content creators
- creators seeking data-driven strategy

Secondary users:

- creator teams
- small media studios
- content strategists

---

## Core Features

### Channel Analysis

Analyze overall channel performance using collected YouTube data.

Analysis includes:

- channel statistics
- video performance
- engagement patterns
- content trends

---

### Feature Engine

Generate structured analytical features from raw channel and video data.

Examples:

- normalized view metrics
- engagement ratios
- content performance indicators

---

### AI Strategy Analysis

Use Gemini AI to interpret features and generate strategic insights.

Outputs include:

- channel strengths
- growth opportunities
- content strategy suggestions

---

### Analysis Result Visualization

Display structured analysis results to the user through UI dashboards.

Pages:

- `/analysis`
- `/analysis/[channelId]`

---

## Data Sources

Primary data source:

YouTube Data API

Collected data includes:

- channel information
- subscriber count
- video statistics
- video metadata

---

## Analysis Scope

Current analysis scope focuses on:

- recent video performance
- engagement metrics
- channel-level growth indicators

Analysis prioritizes **strategic interpretation rather than raw metrics**.

---

## MVP Scope (Alpha)

Alpha phase includes the following components:

Block A — Feature Engine  
Block B — Gemini Analysis  
Block C — YouTube Data Fetch  
Block D — Result Storage  
Block E — Worker Pipeline  
Block F — Analysis UI

Goal of Alpha:

- validate full analysis pipeline
- verify AI insight generation
- confirm database storage
- display results through UI

---

## Development Model

TubeWatch development follows a **Block Development Architecture**.

Each block is implemented independently and integrated through the analysis pipeline.

This approach improves:

- development stability
- modularity
- debugging clarity

---

## Key System Principles

### Modular Architecture

Each module has a clear responsibility.

Example:

Feature Engine → feature generation  
AI Engine → strategy analysis  
Storage → database persistence

---

### Pipeline-Based Processing

All analysis follows a fixed pipeline:

Data Fetch → Feature Generation → AI Analysis → Storage → UI

---

### AI-Assisted Development

TubeWatch development uses Cursor AI-assisted coding.

Project documentation and rules guide AI-generated code.

---

## Future Expansion

Planned modules after Alpha include:

- Action Plan Engine
- SEO Lab
- Benchmark Radar
- Next Trend Discovery
- Content DNA Analysis
- Growth Timing Analysis

