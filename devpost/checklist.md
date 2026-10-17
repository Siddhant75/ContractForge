---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. End-to-End Studio Bootstrap & Core Contract Pipeline (JSON Ingestion, TypeScript & Zod Generation)**
  Becomes usable: A running web studio at `http://localhost:5173` with Obsidian theme where pasting JSON or clicking the default Stripe preset immediately renders valid TypeScript interfaces and Zod schemas with 1-click copy.
  Why now: Proves the whole path end to end on the first slice — project scaffold, reactive split-pane UI, AST inference, and code generation — so every later slice has somewhere to land.
  PRD ref: `prd.md > The Core Journey` (steps 1-3), `prd.md > Screens and Layout`
  Spec ref: `spec.md > Engine & Core Modules > 2. AST & Semantic Schema Inferrer`, `spec.md > UI Components > 6. App.tsx`, `8. InputStudio.tsx`, `9. ContractStudio.tsx`
  Build: Scaffold project with Vite, React 19, TypeScript, and Tailwind CSS; implement `src/types/ast.ts`, `src/engine/schemaInferrer.ts`, `src/engine/generators/typescript.ts`, `src/engine/generators/zod.ts`, and core studio UI in `src/App.tsx`, `src/components/InputStudio.tsx`, and `src/components/ContractStudio.tsx`. Add unit tests in `tests/schemaInferrer.test.ts`.
  Verify (mechanical): Run `npm run test` and `npm run build` to confirm zero errors; start dev server and verify `http://localhost:5173` renders and transforms sample JSON into TypeScript and Zod.
  Learner check: Open `http://localhost:5173`, paste JSON or use default preset, and verify syntax-highlighted TypeScript and Zod contracts appear instantly with 1-click copy.
  Commit: `feat(studio): scaffold project and implement core json-to-contract studio`

- [ ] **2. The Unique Kernel: In-Browser Mock & Chaos Fuzzer Sandbox**
  Becomes usable: Interactive Chaos Runner drawer integrated into the running studio. Synthesizes happy-path and 3 mutated edge-case payloads, validates live against the compiled Zod schema via `.safeParse()`, and renders simulated HTTP status badges (`200 OK` vs `422 Error`) with field-level diagnostic paths.
  Why now: The unique kernel comes early, not last. Verifies the core hackathon differentiator immediately once basic contracts render.
  PRD ref: `prd.md > 4. Interactive In-Browser Mock & Chaos Runner`, `scope.md > The Unique Kernel`
  Spec ref: `spec.md > Engine & Core Modules > 4. Chaos Fuzzer`, `spec.md > UI Components > 10. ChaosRunnerDrawer.tsx`
  Build: Implement `src/engine/chaosFuzzer.ts` (happy-path generator, missing field mutator, type corruption mutator, boundary mutator) and `src/components/ChaosRunnerDrawer.tsx`, wired to `src/App.tsx`. Add test suite in `tests/chaosFuzzer.test.ts`.
  Verify (mechanical): Run `npm run test` to verify deterministic payload mutations; verify in-browser runner accurately logs Status 200 for valid payloads and Status 422 with Zod diagnostic paths for edge-case errors.
  Learner check: Open the Chaos Runner drawer in the browser, click "Run Chaos Mock", and observe simulated latency and live green/red diagnostic badges.
  Commit: `feat(chaos): implement in-browser mock and chaos fuzzer sandbox`

- [ ] **3. AI Agent Structured Output Generators (OpenAI Strict & Anthropic Claude Tools) & Presets**
  Becomes usable: Multi-tab code studio expands to 4 targets: OpenAI Strict Mode (`strict: true`, recursive `additionalProperties: false`, required property enforcement) and Anthropic Claude tool specs, plus full 4-preset catalog.
  Why now: Bridges Web APIs to AI Agent Tool Calling and provides the 4 zero-typing presets needed for the judge demo walk-through.
  PRD ref: `prd.md > 3. Multi-Target Code Generation`, `prd.md > 5. Instant 1-Click Presets`
  Spec ref: `spec.md > Engine & Core Modules > 3. Multi-Target Code Generators`, `5. Demo Presets Catalog`, `spec.md > UI Components > 7. TopNav.tsx`
  Build: Implement `src/engine/generators/openAiStrict.ts` (with recursive `additionalProperties: false` invariant), `src/engine/generators/anthropic.ts`, `src/presets/samples.ts` (Stripe, Weather Tool, GitHub API, E-Commerce), and `src/components/TopNav.tsx`. Add tests in `tests/generators.test.ts`.
  Verify (mechanical): Run `npm run test` to verify OpenAI strict schema conformance; verify clicking top nav preset pills in browser switches inputs and renders valid tool specs.
  Learner check: Toggle between OpenAI and Anthropic tabs in browser, verify strict JSON formatting, and copy tool definitions for agent workflows.
  Commit: `feat(generators): implement openai strict and anthropic tool generators with presets`

- [ ] **4. Resilient Ingestion: Multi-Line cURL Lexer & Malformed JSON Auto-Sanitizer**
  Becomes usable: Ingestion studio supports complex bash/cmd cURL commands (flags, headers, queries, bodies) and auto-recovers malformed JSON (trailing commas, quotes) with inline UI alerts and auto-fix action.
  Why now: Hardens the input layer against real-world developer inputs and edge cases, ensuring judges cannot break the app with messy copy-pastes.
  PRD ref: `prd.md > 1. Input Ingestion & cURL Lexer`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Engine & Core Modules > 1. Ingestion Engine`
  Build: Implement `src/engine/curlLexer.ts` (tokenizes shell args, extracts method, headers, query, body, handles GET queries as root schemas) and `src/engine/jsonParser.ts` (recovers trailing commas/comments). Integrate into `InputStudio.tsx` with auto-fix alert. Add tests in `tests/curlLexer.test.ts` and `tests/jsonParser.test.ts`.
  Verify (mechanical): Run `npm run test` to verify cURL parsing and JSON recovery suites; test pasting Chrome DevTools cURL in browser and verify seamless contract generation.
  Learner check: Paste a real multi-line cURL command or malformed JSON in the browser; verify auto-detection and clean contract generation without errors.
  Commit: `feat(engine): implement curl lexer and resilient json parser with auto-fix`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — Slice 2 completed (Unique Kernel live and interactive in the browser!)
- [ ] Final kick-the-tires exploration and feedback completed — Slice 4 completed (Full studio with resilient cURL and all presets)

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [to be recorded upon completion]
Route and stops: [to be recorded upon completion]
Edit outcome: [to be recorded upon completion]
Reflection: [to be recorded upon completion]
Activity mode: [to be recorded upon completion]

## Revisions
