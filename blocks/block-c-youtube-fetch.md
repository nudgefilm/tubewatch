# Block C — YouTube Data Fetch

## Overview

The YouTube Data Fetch block is responsible for collecting channel and video data from the YouTube Data API.

This block provides the raw data used by the Feature Engine to generate analytical features.

The YouTube Fetch layer acts as the **data ingestion layer** of the TubeWatch analysis pipeline.

---

## Purpose

The purpose of this block is to retrieve the necessary YouTube channel and video information required for analysis.

Responsibilities include:

- retrieving channel information
- retrieving video performance data
- collecting engagement metrics
- preparing structured raw data for the Feature Engine

The data collected in this stage serves as the foundation for all subsequent analysis.

---

## Pipeline Position

The YouTube Data Fetch block is the **first stage of the analysis pipeline**.

Pipeline structure:

YouTube Data Fetch  
↓  
Feature Engine  
↓  
Gemini AI Analysis  
↓  
Result Storage  
↓  
UI Visualization

This stage collects all necessary data before analysis begins.

---

## Core Functions

The YouTube Fetch block consists of two primary functions.

### fetchChannelData

Purpose:

Retrieve general information about a YouTube channel.

Typical data collected:

- channel title
- channel description
- subscriber count
- total video count
- channel metadata

Output:

Structured channel data used in analysis.

---

### fetchChannelVideos

Purpose:

Retrieve recent video data from the channel.

Typical data collected:

- video titles
- view counts
- like counts
- comment counts
- publish dates
- video metadata

Output:

Structured video dataset used for feature generation.

---

## Input

Input required for this block:

YouTube Channel ID

Example:

UCxxxxxxxxxxxxxxxx

This ID uniquely identifies a YouTube channel.

---

## Output

The YouTube Fetch block produces raw structured data used by the Feature Engine.

Output structure includes:

Channel Data

- channel title
- subscriber count
- channel statistics

Video Data

- video performance metrics
- engagement metrics
- publishing information

These datasets are passed to the Feature Engine for further processing.

---

## Data Collection Scope

TubeWatch focuses on collecting data relevant for channel analysis.

Typical scope includes:

- recent channel statistics
- recent video performance
- engagement metrics
- publishing frequency

The data scope may expand in future versions.

---

## Design Principles

### Reliable Data Collection

The system must ensure reliable retrieval of YouTube data.

Failures in data collection should be handled gracefully.

---

### Minimal Processing

This block should only retrieve data.

It should not perform feature generation or analysis.

---

### Structured Output

Data should be returned in a structured format suitable for the Feature Engine.

---

### Block Independence

The YouTube Fetch block must remain independent from:

- Feature Engine logic
- AI analysis logic
- database storage logic

Its responsibility is only **data retrieval**.

---

## Integration

The YouTube Fetch block is executed by the worker at the beginning of the analysis pipeline.

Worker flow:

1. retrieve YouTube channel data  
2. retrieve video data  
3. pass raw data to Feature Engine  

---

## Error Handling

Possible errors include:

- YouTube API request failures
- invalid channel ID
- rate limits

If data retrieval fails, the worker should stop the pipeline and mark the analysis job as failed.

---

## Future Expansion

Future improvements to this block may include:

- extended video data collection
- playlist-level analysis
- content category detection
- topic classification

These enhancements will improve the depth of analysis in later versions.

---

## Summary

The YouTube Data Fetch block collects the raw channel and video data required for TubeWatch analysis.

It serves as the entry point of the analysis pipeline and provides the foundational data used by all subsequent modules.

