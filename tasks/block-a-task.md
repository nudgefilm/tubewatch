# TubeWatch Cursor Task Template

## Role

You are working on the TubeWatch project.

TubeWatch is a YouTube analytics SaaS built with:

- Next.js 14
- TypeScript
- Supabase
- Gemini AI
- Vercel

You must follow the project documentation in the `docs/` folder and the rules in `.cursor/rules/`.

---

## Task Type

This is a block-based implementation task.

You must work only within the requested block.

Do not modify unrelated modules.

Do not restructure the project unless explicitly instructed.

---

## Reference Documents

Always use the following documents as context when implementing code.

### Project Context

- docs/project-context.md

### Core Documents

- docs/core/tubewatch-core-spec.md
- docs/core/product-spec.md
- docs/core/system-architecture.md
- docs/core/implementation-spec.md
- docs/core/data-model.md
- docs/core/analysis-pipeline.md
- docs/core/roadmap.md

### Block Documents

- relevant file in docs/blocks/

### Task Documents

- relevant file in docs/tasks/

### Rules

- .cursor/rules/project-architecture.mdc
- .cursor/rules/block-development.mdc
- .cursor/rules/coding-conventions.mdc
- .cursor/rules/typescript-quality.mdc
- .cursor/rules/file-generation.mdc

---

## General Instructions

Follow these instructions for every implementation task.

1. Read the relevant block document first.
2. Read the related task document.
3. Follow project architecture rules.
4. Keep the implementation inside the requested block.
5. Use strict TypeScript typing.
6. Avoid use of `any`.
7. Export clearly named functions.
8. Keep responsibilities separated by module.
9. Do not mix UI logic, AI logic, storage logic, and data fetch logic.
10. Return complete file contents, not partial fragments.

---

## Output Format

When completing a task, respond in the following order:

1. implementation scope
2. created file list
3. modified file list
4. full code for each file
5. integration notes
6. validation checklist

---

## File Generation Rules

When generating files, follow this order:

1. utility files
2. type files
3. block entry files

Always provide full file contents.

Do not provide patch-style partial edits unless explicitly requested.

---

## Validation Rules

Before finishing, verify the following:

- TypeScript structure is valid
- imports are correct
- exports are correct
- block boundaries are respected
- no unrelated files are modified
- the code matches the requested task scope

---

## Example Task Input

Implement Block A — Feature Engine.

Scope:

- normalizeVideoMetrics
- buildChannelFeatures
- featureScoring

Requirements:

- create all required files
- use strict TypeScript types
- do not include AI logic
- do not include database logic
- do not include UI logic

Output:

- created file list
- full file code
- integration notes
- validation checklist

---

## Task Execution Principle

The TubeWatch project follows Block Development Architecture.

This means:

- one block at a time
- clear module boundaries
- predictable file structure
- modular implementation
- easier debugging and validation

You must preserve this development model in every implementation task.

