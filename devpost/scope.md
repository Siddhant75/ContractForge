---
doc: scope
status: draft
---

# ContractForge — The Universal API & Agent Schema Studio

A zero-backend, client-side developer studio that transforms raw API payloads and cURL commands into production-ready TypeScript types, Zod schemas, and AI Agent Function Calling specs, paired with an interactive in-browser mock and chaos fuzzer.

## The Unique Kernel
ContractForge bridges standard Web APIs and AI Agent Tool-Calling in a single reactive developer studio. Its standout differentiator is the **Interactive In-Browser Mock & Chaos Runner**, which automatically generates both valid payloads and boundary edge cases (nulls, missing keys, unicode strings, out-of-range integers) and validates them live against the generated Zod contract directly in the browser with zero server latency.

## Who It's For
Maya, a full-stack AI engineer building agentic workflows and integrating diverse SaaS APIs.

**What she does today instead:** She pastes cURL commands into Postman or browser DevTools, manually hand-crafts TypeScript interfaces and Zod schemas line-by-line, guesses the nested JSON schema parameters required by OpenAI and Anthropic tool specs, and discovers schema mismatches at runtime through failed API calls or AI agent tool-execution errors.

## The Core Loop
1. **Input:** The user pastes a cURL request, raw JSON response, or selects one of 4 instant 1-click presets (*Stripe Payment*, *Weather Agent Tool*, *GitHub Issue API*, *E-Commerce Order*).
2. **Inference & Customization:** The client-side AST engine infers types, detects semantic patterns (ISO timestamps, UUIDs, emails, URLs), and detects optionality.
3. **Multi-Target Generation:** Instant reactive rendering of 4 production outputs:
   - TypeScript Interfaces
   - Zod Validation Schemas
   - OpenAI Structured Outputs (`strict: true`) Function Calling JSON
   - Anthropic Claude Tool Definition
4. **Interactive Sandbox & Chaos Verification:** The user triggers the in-browser mock runner to execute real-time payload validations (happy path vs. chaos fuzzing) with instant green/red status reports.
5. **Export:** 1-click copy or file download for immediate use in their codebase.

**Why they come back:** ContractForge becomes their zero-friction daily scratchpad whenever integrating a new third-party webhook, inspecting an API response, or equipping an AI agent with a bulletproof tool schema.

## Inspiration & Identity
- **Aesthetic:** Modern dark-mode developer studio inspired by [Linear](https://linear.app), [Raycast](https://raycast.com), and [VS Code](https://code.visualstudio.com).
- **Palette:** Zinc/slate tones, emerald indicators for passing validations, rose badges for edge-case errors, and clean monospace typography.
- **Tone:** Fast, professional, authoritative, and focused.

## Why This Matters to the Learner
- Aiming to win 1st Place in the Devpost "Build With AI: Basics" hackathon by exhibiting a flawless plan-first AI engineering process.
- Strictly using 100% free, open-source resources, ensuring zero server infrastructure costs and 100% uptime for hackathon judges.

## What "Working" Looks Like
In under 10 seconds with zero typing required, a judge:
1. Opens the deployed web application.
2. Clicks the "Stripe Payment Intent" or "Weather Agent Tool" preset.
3. Observes instantaneous generation across TypeScript, Zod, OpenAI, and Anthropic targets with syntax-highlighted code blocks.
4. Clicks "Run Chaos Mock" in the Interactive Sandbox.
5. Sees real-time simulated client-side test execution showing how edge-case payloads pass or fail contract validation.
6. Clicks "Copy Code" to copy any generated output.

## The POC Boundary
- **Included (In):**
  - Robust cURL parser (method, headers, query, body extraction).
  - Resilient JSON parser with automatic error detection and cleanup.
  - AST type inference with semantic string heuristics (ISO 8601 dates, UUIDs, emails, URLs).
  - Multi-target code generation: TypeScript, Zod, OpenAI Tool spec (Standard & Strict), Anthropic Claude tool spec.
  - Interactive In-Browser Mock & Chaos Runner (happy-path generator and boundary/fuzz generator validated against Zod).
  - 4 high-fidelity 1-click presets for zero-typing evaluation.
  - 100% client-side execution (zero external backend, zero API key requirements).
  - Automated test suite (unit and edge-case tests) via Vitest.

## Later
- OpenAPI 3.1 YAML and Swagger import/export.
- Python Pydantic (v2) model export.
- GraphQL schema generation.
- Persistent local workspace saving via IndexedDB.

## Explicitly Cut
- **Remote Cloud Mock Server:** Running a remote mock server introduces cold-start latency, hosting maintenance, and server downtime risks for judges. Replaced by a high-fidelity client-side in-memory mock and validation runner.
- **User Authentication & Cloud Database:** Adds unnecessary bloat and setup friction, violating the 1-afternoon PoC constraint.
- **Git / PR Summarizer:** Unrelated to API contract and tool generation; cut to maintain single-purpose product excellence.
