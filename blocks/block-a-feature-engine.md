# Block A — Feature Engine

## Overview

The Feature Engine is responsible for transforming raw YouTube channel and video data into structured analytical features.

These features are used by the AI analysis module to generate strategic insights about the channel.

The Feature Engine acts as the **data preparation layer** of the TubeWatch analysis pipeline.

---

## Purpose

Raw YouTube data is often inconsistent and difficult to analyze directly.

The Feature Engine performs the following tasks:

- normalize raw video metrics
- calculate engagement ratios
- generate channel-level performance indicators
- compute feature scores

The output of the Feature Engine becomes the input for the AI analysis stage.

---

## Pipeline Position

The Feature Engine operates in the following pipeline stage:

YouTube Data Fetch  
↓  
Feature Engine  
↓  
AI Analysis

The Feature Engine receives raw data from the data fetch layer and produces structured feature data.

---

## Core Functions

The Feature Engine consists of three primary functions.

### normalizeVideoMetrics

Purpose:

Normalize raw video statistics collected from YouTube.

Responsibilities:

- normalize view counts
- normalize like counts
- normalize comment counts
- standardize metric formats

Output:

Normalized video metrics used for feature generation.

---

### buildChannelFeatures

Purpose:

Generate channel-level analytical features based on normalized video data.

Responsibilities:

- compute engagement ratios
- calculate performance indicators
- generate content performance metrics

Examples of generated features:

- average engagement rate
- average views per video
- engagement consistency
- recent video performance indicators

Output:

Structured channel feature dataset.

---

### featureScoring

Purpose:

Convert analytical features into structured feature scores.

Responsibilities:

- evaluate feature performance
- compute relative performance scores
- standardize scoring scale

Feature scores allow the AI module to interpret channel performance more effectively.

Output:

Feature score dataset used by the AI analysis module.

---

## Input Data

The Feature Engine receives data collected from the YouTube API.

Typical input includes:

- channel statistics
- video view counts
- video like counts
- video comment counts
- video publish dates

Input data is expected to be provided in a structured format by the data fetch layer.

---

## Output Data

The Feature Engine produces structured channel features.

Example outputs include:

- normalized metrics
- engagement ratios
- performance indicators
- feature scores

These outputs are passed to the AI analysis module.

---

## Design Principles

### Data Normalization

All raw metrics should be normalized before feature generation.

---

### Deterministic Processing

Feature generation should produce consistent outputs given the same input data.

---

### AI-Friendly Structure

Generated features should be structured in a way that is easy for AI models to interpret.

---

### Block Independence

The Feature Engine must remain independent from:

- AI analysis logic
- database storage logic
- UI logic

It should only perform feature generation.

---

## Responsibilities

The Feature Engine is responsible for:

- transforming raw data into analytical features
- preparing structured data for AI analysis
- ensuring consistent feature generation

It is **not responsible for AI interpretation or data storage**.

---

## Integration

The Feature Engine is used by the worker during the analysis pipeline.

Worker flow:

1. fetch channel data
2. normalize video metrics
3. build channel features
4. compute feature scores
5. pass features to AI analysis

---

## Summary

The Feature Engine prepares the analytical foundation for TubeWatch.

By transforming raw YouTube data into structured features, it enables reliable and interpretable AI-based channel analysis.

