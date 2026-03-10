# Block Development Task Template

## Overview

This document template is used to instruct Cursor to implement a development block in the TubeWatch project.

Each block task should clearly define the scope of work, files to be created, implementation requirements, and validation steps.

Cursor should follow the project documentation and architecture rules when generating code.

---

## Block Name

Specify the block being implemented.

Example:

Block A — Feature Engine

---

## Implementation Scope

Describe what the block is responsible for implementing.

Include:

- module responsibilities
- expected functionality
- system position in the analysis pipeline

---

## Required Files

List all files that should be created or modified.

Example:

src/features/feature-engine/normalizeVideoMetrics.ts  
src/features/feature-engine/buildChannelFeatures.ts  
src/features/feature-engine/featureScoring.ts  

Each file should contain a clearly defined module.

---

## File Responsibilities

Explain the purpose of each file.

Example:

normalizeVideoMetrics.ts  
Responsible for normalizing raw video statistics.

buildChannelFeatures.ts  
Responsible for generating channel-level analytical features.

featureScoring.ts  
Responsible for computing structured feature scores.

---

## Implementation Requirements

Cursor must follow these rules:

- strict TypeScript typing
- modular file structure
- clear function exports
- no database logic inside feature modules
- no UI logic inside backend modules

---

## Expected Exports

List functions that must be exported.

Example:

normalizeVideoMetrics  
buildChannelFeatures  
featureScoring

---

## Integration Requirements

Explain how the block will be used by other modules.

Example:

The Feature Engine will be executed by the Worker during the analysis pipeline.

Worker flow:

fetchChannelData  
↓  
buildChannelFeatures  
↓  
featureScoring  
↓  
analyzeChannelWithGemini

---

## Validation

Before completing the task, verify the following:

- TypeScript compiles without errors
- exported functions work independently
- modules follow project architecture rules
- code is readable and modular

---

## Output Requirements

Cursor should return the following in its response:

1. created file list  
2. modified file list  
3. full code for each file  
4. explanation of module integration

