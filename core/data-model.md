# TubeWatch Data Model

## Overview

This document defines the database structure used in TubeWatch.

TubeWatch stores user information, registered YouTube channels, analysis jobs, and analysis results.

The database is implemented using Supabase PostgreSQL.

The design supports asynchronous analysis execution and structured storage of AI-generated insights.

---

## Core Tables

TubeWatch uses the following primary tables.

users  
user_channels  
analysis_jobs  
analysis_queue  
analysis_results  
product_events  
system_limits

Each table has a specific responsibility in the analysis pipeline.

---

## users

Stores registered user accounts.

This table is synchronized with Supabase authentication.

Important fields:

id  
email  
created_at  

Purpose:

- identify platform users
- associate users with registered channels
- associate users with analysis jobs

---

## user_channels

Stores YouTube channels registered by users.

Important fields:

id  
user_id  
youtube_channel_id  
channel_title  
thumbnail_url  
subscriber_count  
created_at  

Purpose:

- store user channel registrations
- link channels to analysis jobs
- store basic channel metadata

---

## analysis_jobs

Stores analysis job records.

Each analysis request generates a job entry.

Important fields:

id  
user_id  
user_channel_id  
status  
created_at  
completed_at  

Possible status values:

queued  
running  
completed  
failed  

Purpose:

- track analysis progress
- monitor worker execution
- record job history

---

## analysis_queue

Stores pending analysis tasks.

This table is used by the worker to retrieve jobs.

Important fields:

id  
job_id  
status  
created_at  

Possible status values:

queued  
processing  
completed  

Purpose:

- manage worker processing queue
- support asynchronous analysis execution

---

## analysis_results

Stores the final results of channel analysis.

Important fields:

id  
user_id  
user_channel_id  
feature_scores  
ai_insights  
created_at  

Stored data includes:

- feature analysis scores
- AI-generated strategy insights
- metadata for analysis runs

Purpose:

- store structured analysis outputs
- provide data for UI display

---

## product_events

Stores product interaction events.

Examples:

analysis_requested  
analysis_completed  

Purpose:

- track product usage
- support analytics and monitoring

---

## system_limits

Stores system configuration and usage limits.

Examples:

analysis cooldown  
maximum channels per user  

Purpose:

- enforce usage policies
- control system resources

---

## Relationships

Important relationships between tables.

users → user_channels  
user_channels → analysis_jobs  
analysis_jobs → analysis_queue  
analysis_jobs → analysis_results  

These relationships allow the system to trace analysis history from user to final results.

---

## Analysis Data Flow

Typical data flow through the database.

User requests analysis  
↓  
analysis_jobs entry created  
↓  
analysis_queue entry created  
↓  
worker processes job  
↓  
analysis_results stored  
↓  
UI reads analysis results

---

## Data Storage Principles

TubeWatch follows several database design principles.

### Structured Results

AI analysis output must be stored in structured formats that can be displayed in the UI.

---

### Traceable Analysis

Each analysis must be traceable through job records.

---

### User Isolation

Each user can only access their own channels and analysis results.

---

### Scalable Storage

The schema must support future expansion such as:

- additional analysis modules
- benchmark data
- historical analysis tracking

