# Block A Task — Feature Engine Implementation

## Task Overview

Implement Block A of the TubeWatch project.

Block A is the Feature Engine.

The Feature Engine is responsible for transforming raw YouTube channel and video data into structured analytical features that can be used by the Gemini AI analysis module.

This block must remain independent from:

- YouTube data fetch logic
- Gemini AI logic
- database storage logic
- UI logic

---

## Block Scope

Implement the following functions:

- normalizeVideoMetrics
- buildChannelFeatures
- featureScoring

These functions should work together as the Feature Engine block.

---

## Responsibilities

### normalizeVideoMetrics

Purpose:

Normalize raw video statistics into a consistent format.

Typical responsibilities:

- normalize view counts
- normalize like counts
- normalize comment counts
- standardize metric values for downstream processing

---

### buildChannelFeatures

Purpose:

Generate channel-level analytical features from normalized video data.

Typical responsibilities:

- calculate engagement ratios
- derive performance indicators
- summarize recent content performance
- build structured channel feature objects

---

### featureScoring

Purpose:

Convert generated channel features into structured feature scores.

Typical responsibilities:

- compute relative feature scores
- standardize score values
- prepare AI-friendly score outputs

---

## Input Expectations

Block A should accept structured raw data from the YouTube Fetch block.

Typical input includes:

- channel statistics
- video statistics
- video publish dates
- engagement metrics

This block must not fetch data directly from the YouTube API.

---

## Output Expectations

Block A should return structured feature outputs for Block B.

Typical outputs include:

- normalized video metrics
- engagement ratios
- performance indicators
- feature scores

These outputs must be designed for use by the Gemini AI analysis module.

---

## Required Files

Create or update the files needed to implement the Feature Engine.

Recommended file structure:

src/features/feature-engine/normalizeVideoMetrics.ts  
src/features/feature-engine/buildChannelFeatures.ts  
src/features/feature-engine/featureScoring.ts  
src/features/feature-engine/types.ts  
src/features/feature-engine/index.ts  

If the project uses a different but equivalent folder structure, keep the implementation consistent with the existing architecture.

---

## Implementation Rules

Follow these rules strictly:

- use TypeScript
- use strict typing
- avoid any
- keep functions modular
- use named exports
- keep each file focused on a single responsibility
- do not include AI logic
- do not include database logic
- do not include UI logic
- do not modify unrelated modules

---

## Integration Notes

This block will be used by the Worker block.

Expected pipeline usage:

fetchChannelData  
↓  
fetchChannelVideos  
↓  
normalizeVideoMetrics  
↓  
buildChannelFeatures  
↓  
featureScoring  
↓  
analyzeChannelWithGemini

The output of Block A should be easy for Block B to consume.

---

## Output Format Requirements

When implementing this task, return the result in the following order:

1. implementation scope  
2. created file list  
3. modified file list  
4. full code for each file  
5. integration notes  
6. validation checklist  

---

## Validation Checklist

Before completing the task, verify the following:

- all Feature Engine files are created
- TypeScript types are explicit
- imports and exports are correct
- the block is independent from other layers
- no unrelated files are modified
- the functions can be used by the Worker block
- the output is structured and AI-friendly

---

## Completion Goal

Block A is complete when the Feature Engine can reliably transform raw YouTube data into structured feature outputs ready for AI analysis.

