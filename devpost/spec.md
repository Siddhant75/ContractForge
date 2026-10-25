---
doc: spec
status: approved
---

# ContractForge — Technical Spec

A zero-backend, client-side developer studio that transforms raw API payloads and cURL commands into production-ready TypeScript types, Zod schemas, and AI Agent Function Calling specs (OpenAI Strict & Anthropic), paired with an interactive in-browser mock and chaos fuzzer.  
*Implements: `prd.md` and `scope.md`.*

---

## How This Works, In Plain Language
ContractForge runs 100% inside the user's browser as a single-page web application. It requires zero backend servers, zero database connections, and zero paid API keys.

The architecture consists of 4 decoupled, pure client-side engines:
1. **The Ingestion Engine (cURL Lexer & Resilient JSON Parser):** Ingests raw input. If it begins with `curl`, it tokenizes shell arguments to extract the HTTP method, headers, query parameters, and payload body. If it is JSON, it attempts strict `JSON.parse()`; if syntax errors occur (such as trailing commas or comments), a sanitization pass repairs the syntax before falling back.
2. **The AST Type & Semantic Schema Inferrer:** Recursively traverses the parsed data and builds a clean Abstract Syntax Tree (AST). It resolves mixed-type arrays into unions, computes key existence across array items to mark optional fields, and applies regex pattern heuristics to identify ISO timestamps, UUIDs, email addresses, and URLs.
3. **The Multi-Target Code Generators:** Pure deterministic formatting functions that translate the AST into 4 independent output formats:
   - TypeScript interface definitions.
   - Zod validation schemas.
   - OpenAI Structured Outputs function specifications with `strict: true`.
   - Anthropic Claude tool schemas.
4. **The Interactive Sandbox & Chaos Fuzzer:** Generates a synthetic valid sample payload and 3 mutated edge-case payloads (missing fields, wrong types, boundary violations). It dynamically passes each payload through the compiled Zod validator (`.safeParse()`) in the browser thread and returns a simulated HTTP test log with latency, status codes, and path-specific validation diagnostics.

---

## The Core Journey Through the System
*Trace of `prd.md > The Core Journey`:*

1. **Preset Selection:** User clicks "Stripe Payment Intent" preset in `TopNav` $\rightarrow$ dispatches preset state $\rightarrow$ updates `inputRaw` string in root state.
2. **Parsing:** `useMemo` triggers `parseInput(inputRaw)` $\rightarrow$ runs `curlLexer` or `jsonParser` $\rightarrow$ outputs parsed JSON object model.
3. **AST Construction:** `inferSchema(parsedObject)` recursively builds an `AstNode` tree, assigning primitive types, optionality, and semantic heuristics.
4. **Code Generation:** `generateAllContracts(ast)` executes:
   - `generateTypeScript(ast)`
   - `generateZod(ast)`
   - `generateOpenAiStrict(ast)`
   - `generateAnthropic(ast)`
5. **Display:** Active tab in `ContractViewer` updates instantaneously with syntax-highlighted code.
6. **Chaos Verification:** User clicks "Run Chaos Mock" in `ChaosRunnerDrawer` $\rightarrow$ `generateChaosPayloads(ast)` produces 1 happy path and 3 fuzzed samples $\rightarrow$ runs client-side Zod validation $\rightarrow$ populates results table with status badges (`200 OK` vs `422 Error`).
7. **Clipboard Export:** User clicks copy $\rightarrow$ invokes browser `navigator.clipboard.writeText()` $\rightarrow$ triggers 2-second animated visual checkmark.

---

## Stack
All dependencies are 100% free and open-source:

| Technology | Version / Spec | Purpose & Documentation Link | Rationale & Accepted Tradeoff |
| :--- | :--- | :--- | :--- |
| **React** | `^19.0.0` | UI component layer ([React Docs](https://react.dev)) | Modern reactive component model; client-only hydration. |
| **Vite** | `^6.0.0` | Build tool & dev server ([Vite Docs](https://vite.dev)) | Instant HMR ($<50\text{ms}$) and optimal static bundle output. |
| **TypeScript** | `^5.7.0` | Language & type safety ([TS Docs](https://www.typescriptlang.org)) | Strict compilation prevents runtime type bugs. |
| **Tailwind CSS** | `^3.4.0` | Utility-first styling ([Tailwind Docs](https://tailwindcss.com)) | Zero runtime CSS overhead, rapid Obsidian theme implementation. |
| **Lucide React** | `^0.468.0` | Developer icons ([Lucide Docs](https://lucide.dev)) | Crisp SVG developer icons with tree-shaking. |
| **Zod** | `^3.24.0` | Runtime validation engine ([Zod Docs](https://zod.dev)) | Compiles schemas and performs live `.safeParse()` inside the mock runner. |
| **Vitest** | `^2.1.0` | Automated unit test suite ([Vitest Docs](https://vitest.dev)) | Blazing fast in-memory testing for AST, lexer, and generators. |

---

## Where It Runs and How Someone Tries It
- **Runtime Environment:** Any modern web browser (Chrome, Firefox, Safari, Edge). Zero server processes required.
- **Local Dev Command:**
  ```bash
  npm install
  npm run dev
  ```
  Opens at: `http://localhost:5173`.
- **Automated Test Command:**
  ```bash
  npm run test
  ```
- **Static Production Build (for Vercel / GitHub Pages deployment):**
  ```bash
  npm run build
  ```
  Outputs standalone HTML/JS/CSS to `dist/`.
- **Hackathon Submission & Evaluation Note:**
  Submission requires both a short demo video and a public GitHub repository; deployment is optional and does not replace the video.
  - **Demo Video URL:** `https://youtu.be/MMFmMYwQRF0?si=4ygKVbPPyLM4rPo_`
  - **Public Repository URL:** `https://github.com/Siddhant75/ContractForge`
  To record the demo, follow `prd.md > What "Working" Looks Like`:
  1. Open `http://localhost:5173`.
  2. Click the "Stripe Payment Intent" or "Weather Agent Tool" preset pill.
  3. Cycle through TypeScript, Zod, OpenAI Strict, and Anthropic code tabs.
  4. Click "Run Chaos Mock" in the Interactive Sandbox drawer to demonstrate passing happy-path (200 OK) and intercepted chaos edge cases (422 Error).
  5. Click "Copy Code" to demonstrate visual clipboard confirmation.

---

## Look and Feel
*Implements: `prd.md > Look and Feel`.*
- **Base Theme:** Obsidian dark mode (`bg-[#090a0f]`, surface `bg-[#11131c]`, border `border-[#23283b]`).
- **Typography:** UI in `Inter` / system-ui; code and editors in `JetBrains Mono`, `Fira Code`, or monospace.
- **Accents:** Emerald (`text-emerald-400`, `bg-emerald-500/10`) for 200 OK / passing validations; Indigo (`text-indigo-400`, `bg-indigo-600`) for primary buttons and active tabs; Rose (`text-rose-400`, `bg-rose-500/10`) for 422 errors and syntax issues; Sky (`text-sky-400`) for AST type highlights.

---

## Components

### Engine & Core Modules

#### 1. Ingestion Engine (`src/engine/curlLexer.ts` & `src/engine/jsonParser.ts`)
- *Implements: `prd.md > 1. Input Ingestion & cURL Lexer`.*
- Tokenizes bash/cmd cURL commands, normalizes line breaks, and extracts HTTP method, headers, query parameters, and payload body.
- Performs resilient JSON parsing with automatic sanitization (removes trailing commas and unquoted single quotes).

#### 2. AST & Semantic Schema Inferrer (`src/engine/schemaInferrer.ts`)
- *Implements: `prd.md > 2. AST Type & Semantic Schema Inference`.*
- Recursively constructs the `AstNode` tree, enforces a safety recursion limit of 20, resolves array object key unions, detects optionality, and matches semantic regexes (ISO-8601, UUID, email, URL).
- Safely handles empty arrays (`[]`) by falling back to `unknown` element types.

#### 3. Multi-Target Code Generators (`src/engine/generators/*`)
- *Implements: `prd.md > 3. Multi-Target Code Generation`.*
- `typescript.ts`: Formats PascalCase interfaces, optional fields (`?`), and union types.
- `zod.ts`: Formats runtime validation schemas with semantic validators (`.datetime()`, `.uuid()`, `.email()`, `.url()`).
- `openAiStrict.ts`: Formats OpenAI Structured Outputs with `strict: true`. **Invariant:** Recursively enforces `additionalProperties: false` on every object and places all properties in `required` (optional properties mapped to `anyOf: [{...}, {type: "null"}]`).
- `anthropic.ts`: Formats Claude tool schemas (`name`, `description`, `input_schema`).

#### 4. Chaos Fuzzer & In-Browser Runner (`src/engine/chaosFuzzer.ts`)
- *Implements: `prd.md > 4. Interactive In-Browser Mock & Chaos Runner`.*
- Generates 1 compliant happy-path payload and 3 deterministic edge-case payloads (missing required fields, type corruption, boundary violation).
- Evaluates each payload against the live compiled Zod schema via `.safeParse()` and returns simulated HTTP test logs.

#### 5. Demo Presets Catalog (`src/presets/samples.ts`)
- *Implements: `prd.md > 5. Instant 1-Click Presets`.*
- Exports raw data and cURL presets for Stripe Payment Intent, Weather Agent Tool, GitHub Issue API, and E-Commerce Order.

### UI Components

#### 6. `src/App.tsx` (Root Orchestrator)
- *Coordinates states from: `prd.md > States and Boundaries`.*
- Manages global state (`rawInput`, `inputMode`, `activeTab`, `isRunnerOpen`, `activePresetId`).
- Coordinates reactive execution across parser, AST inferrer, and UI panels.

#### 7. `src/components/TopNav.tsx`
- *Implements: `prd.md > 5. Instant 1-Click Presets`.*
- Renders branding badge, preset pills, "Format JSON", and "Clear" actions.

#### 8. `src/components/InputStudio.tsx`
- *Implements: `prd.md > 1. Input Ingestion & cURL Lexer`.*
- Code editor textarea with line numbers, mode badges, character count, and non-blocking auto-fix alerts.

#### 9. `src/components/ContractStudio.tsx`
- *Implements: `prd.md > 3. Multi-Target Code Generation`.*
- Tabbed code viewer (TypeScript, Zod, OpenAI, Anthropic), copy button with animated confirmation, and file export.

#### 10. `src/components/ChaosRunnerDrawer.tsx`
- *Implements: `prd.md > 4. Interactive In-Browser Mock & Chaos Runner`.*
- Slide-up drawer containing test runner controls, latency simulations, and live green/red Zod validation diagnostics.

---

## External Services and Dependencies
ContractForge operates with zero remote server dependencies. However, it targets and compiles contracts for two major external AI agent specifications:

1. **OpenAI Structured Outputs Specification (`strict: true`):**
   - Documentation: [OpenAI Structured Outputs Guide](https://platform.openai.com/docs/guides/structured-outputs)
   - Schema Standard: JSON Schema dialect adhering to strict mode constraints (`additionalProperties: false`, all keys in `required`, optional keys as nullable unions).
   - Keys / Cost / Rate Limits: None required (pure client-side generation; $0 cost).

2. **Anthropic Claude Tool Use Specification:**
   - Documentation: [Anthropic Tool Use Documentation](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
   - Schema Standard: Tool definition object containing `name`, `description`, and `input_schema`.
   - Keys / Cost / Rate Limits: None required (pure client-side generation; $0 cost).

---

## Data Model & AST Types (`src/types/ast.ts`)

```typescript
export type PrimitiveType = 'string' | 'number' | 'boolean' | 'null' | 'unknown';
export type SemanticFormat = 'date-time' | 'uuid' | 'email' | 'url' | 'none';

export interface AstProperty {
  name: string;
  type: AstNode;
  optional: boolean;
  description?: string;
}

export type AstNode =
  | { kind: 'primitive'; primitive: PrimitiveType; format: SemanticFormat; sampleValue: unknown }
  | { kind: 'object'; name: string; properties: AstProperty[] }
  | { kind: 'array'; elementType: AstNode }
  | { kind: 'union'; types: AstNode[] };

export interface ParsedCurl {
  method: string;
  url: string;
  queryParams: Record<string, string>;
  headers: Record<string, string>;
  body: unknown | null;
}

export interface FuzzTestCase {
  id: string;
  name: string;
  description: string;
  type: 'happy_path' | 'missing_field' | 'type_corruption' | 'boundary_violation';
  payload: unknown;
  simulatedStatus: 200 | 422;
  simulatedLatencyMs: number;
  passed: boolean;
  errors?: string[];
}
```

---

## File Structure

```
contractforge/
├── .agents/                    # Devpost Learn Skills
├── devpost/                    # Hackathon Artifacts (scope.md, prd.md, spec.md)
│   ├── learner-profile.md
│   ├── scope.md
│   ├── scope.html
│   ├── prd.md
│   ├── prd.html
│   ├── spec.md
│   └── spec.html
├── src/
│   ├── engine/
│   │   ├── curlLexer.ts        # cURL command tokenizer & parser
│   │   ├── jsonParser.ts       # Resilient JSON parser & auto-sanitizer
│   │   ├── schemaInferrer.ts   # AST inference & semantic pattern matcher
│   │   ├── chaosFuzzer.ts      # Synthetic mock & edge-case generator
│   │   └── generators/
│   │       ├── typescript.ts   # TypeScript interface generator
│   │       ├── zod.ts          # Zod validator generator
│   │       ├── openAiStrict.ts # OpenAI Strict Mode Structured Outputs generator
│   │       └── anthropic.ts    # Anthropic Claude tool schema generator
│   ├── presets/
│   │   └── samples.ts          # Stripe, Weather, GitHub, E-Commerce sample data
│   ├── components/
│   │   ├── TopNav.tsx          # Navigation, branding & preset pills
│   │   ├── InputStudio.tsx     # Left-side editor with line numbers & auto-fix
│   │   ├── ContractStudio.tsx  # Right-side tabbed code viewer & copy actions
│   │   └── ChaosRunnerDrawer.tsx # In-browser mock tester & validation logs
│   ├── types/
│   │   └── ast.ts              # Core AST interfaces & test types
│   ├── App.tsx                 # Root studio layout & state coordinator
│   ├── main.tsx                # React entrypoint
│   └── index.css               # Tailwind & custom typography rules
├── tests/
│   ├── curlLexer.test.ts       # Unit tests for cURL parsing
│   ├── jsonParser.test.ts      # Unit tests for resilient JSON parsing
│   ├── schemaInferrer.test.ts  # AST inference & regex pattern tests
│   └── generators.test.ts      # Verifies generated TypeScript, Zod, and OpenAI schemas
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── index.html
```

---

## Important Failure Modes & Mitigations
1. **Malformed or Truncated JSON Input:**
   - *Failure:* `JSON.parse` throws `SyntaxError`.
   - *Mitigation:* `jsonParser.ts` catches syntax errors, strips trailing commas and unquoted single quotes, and attempts recovery. If unrecoverable, raises a gentle inline UI notification and preserves the last valid contract.
2. **Complex Multi-Line cURL Commands:**
   - *Failure:* Bash line continuations (`\`), Windows cmd escaping (`^`), or piped commands corrupt the payload.
   - *Mitigation:* `curlLexer.ts` normalizes all line continuations into a single token stream and strips flags like `-s`, `-v`, and `--compressed` cleanly.
3. **Deeply Nested Payloads ($>15$ levels):**
   - *Failure:* Call stack overflow during recursion.
   - *Mitigation:* `schemaInferrer.ts` enforces a safety depth limit of 20 levels, gracefully terminating deep objects with `Record<string, unknown>`.

---

## What Was Simplified and Why
- **In-Memory Client Mocking instead of Remote Serverless Endpoints:** Eliminates cold-start latency, hosting maintenance, and server downtime risks for judges while providing instant, deterministic verification.
- **Curated High-Value Semantic Formats (DateTime, UUID, Email, URL) instead of a bloaty Regex Suite:** Captures 95% of common API patterns without risking regular expression denial of service (ReDoS).

---

## Decisions and Open Issues
- **Decision:** Target OpenAI Structured Outputs with `strict: true` compliance (listing all properties in `required` and typing optional fields as nullable unions).
- **Decision:** Use standard Vitest for automated testing to ensure 100% test coverage for all parsing and generation functions.
- **Open Questions:** None. All technical components, data structures, and algorithms are fully specified.
