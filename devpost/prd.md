---
doc: prd
status: approved
---

# ContractForge — Product Requirements

A zero-backend, client-side developer studio that transforms raw API payloads and cURL commands into production-ready TypeScript types, Zod schemas, and AI Agent Function Calling specs (OpenAI Strict & Anthropic), paired with an interactive in-browser mock and chaos fuzzer.  
*Source: `scope.md > The Unique Kernel` and `scope.md > The POC Boundary`.*

---

## The Core Journey
*Source: `scope.md > The Core Loop` and `scope.md > What "Working" Looks Like`.*

The complete user path from arrival to verified contract generation:

1. **Arrival & Zero-Typing Onboarding:** Maya (or a Devpost judge) opens the web application. She immediately sees an obsidian dark-mode studio with a top bar displaying 4 one-click demo presets (*Stripe Payment*, *Weather Agent Tool*, *GitHub Issue API*, *E-Commerce Order*).
2. **Instant Preset Exploration:** Clicking any preset instantaneously populates the input editor and triggers reactive generation in $<20\text{ms}$. Code tabs on the right immediately illuminate with valid TypeScript, Zod, and AI tool calling definitions.
3. **Custom Input Ingestion:** Maya pastes an arbitrary raw JSON payload or terminal cURL command into the input editor. The system automatically detects the format, strips command flags, extracts headers/body, and runs AST type inference.
4. **Contract Review & Target Selection:** Maya navigates between 4 output tabs:
   - **TypeScript:** Clean interface definitions with accurate types, optional fields (`?`), and union types.
   - **Zod:** Runtime validation schemas with detected semantic constraints (`z.string().datetime()`, `z.string().uuid()`, `z.string().email()`, `z.string().url()`).
   - **OpenAI Tool Spec (Structured Outputs):** Strict JSON schema format conforming to OpenAI function calling specifications (`strict: true`, all properties listed in `required`).
   - **Anthropic Claude Tool Spec:** Claude-compatible tool schema format (`name`, `description`, `input_schema`).
5. **Interactive Chaos & Mock Verification:** Maya opens the **Interactive Sandbox & Chaos Runner** panel and clicks **"Run Chaos Mock"**. The client-side runner:
   - Synthesizes a valid "Happy Path" payload matching the schema.
   - Synthesizes 3 "Chaos Fuzz" edge-case payloads (e.g., missing required fields, nulls injected into non-nullable fields, out-of-range numbers, malformed dates).
   - Validates each payload through the compiled Zod schema directly in the browser.
   - Renders a real-time test execution log with simulated latency, HTTP status codes (`200 OK` vs. `422 Unprocessable Entity`), and clear green/red status badges.
6. **1-Click Export:** Maya clicks "Copy Code" to copy any generated contract or downloads the full bundle for immediate use in her project.

---

## Screens and Layout
ContractForge is structured as a high-density, focused single-page studio:

1. **Top Navigation Bar:**
   - Left: Logo, name badge (`ContractForge`), and version tag.
   - Center: Quick-start preset pills (*Stripe*, *Weather Tool*, *GitHub API*, *E-Commerce*).
   - Right: "Format Input" button, "Clear" button, and GitHub repository link.
2. **Left Panel — Input Studio (50% desktop width):**
   - Header with input mode badge (Auto-Detect cURL / JSON) and character/byte count.
   - High-contrast code editor with line numbers, auto-indentation, and syntax highlighting.
   - Inline non-blocking error badge if JSON or cURL is malformed, with an "Auto-Fix JSON" action.
3. **Right Panel — Contract Generation Studio (50% desktop width):**
   - Tab header: `TypeScript`, `Zod Schema`, `OpenAI (Strict)`, `Anthropic Tool`.
   - Action bar: 1-Click "Copy Code" button (with animated checkmark) and "Download File" button.
   - High-contrast read-only code display with syntax highlighting.
4. **Bottom Drawer / Modal — Interactive Sandbox & Chaos Runner:**
   - Toggle button at the bottom of the screen: *"Open Interactive Mock Runner"*.
   - Control bar with "Generate Happy Path" and "Run Chaos Fuzzer" buttons.
   - Live test results table displaying: Test Name, Simulated Status, Execution Latency, Payload Preview, and Validation Status (Passed / Failed with inline Zod error messages).

---

## Look and Feel
*Source: `scope.md > Inspiration & Identity`.*
- **Palette:** Deep obsidian/zinc background (`#090a0f`), elevated card surfaces (`#11131c`), crisp subtle borders (`#23283b`).
- **Accent Colors:** Emerald green (`#10b981`) for successful validations and happy path indicators; Indigo/violet (`#6366f1`) for active tabs and primary buttons; Rose red (`#f43f5e`) for validation errors and chaos fuzz failures; Sky blue (`#38bdf8`) for syntax highlights.
- **Typography:** Modern clean sans-serif (`Inter`, system-ui) for labels and controls; Monospace font (`JetBrains Mono`, `Fira Code`, monospace) for inputs and generated code.
- **References:** [Linear](https://linear.app), [Raycast](https://raycast.com), and [VS Code](https://code.visualstudio.com).

---

## Features and Behavior

### 1. Input Ingestion & cURL Lexer
- Ingests raw JSON strings or multi-line cURL commands.
- For cURL: Tokenizes arguments, extracts HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`), extracts URL and query parameters, parses `-H` / `--header` entries, and extracts raw data payload (`-d`, `--data`, `--data-raw`).
- If a cURL command has no `-d` request body (such as a standard `GET` query), the extracted query parameters are automatically converted into the root input schema.
- Resilient JSON parsing: Attempts standard `JSON.parse()`; if syntax fails due to trailing commas or comments, runs an auto-sanitizer to recover the payload without crashing.
*Acceptance Criteria:*
- [ ] Valid JSON parses into an AST object model.
- [ ] cURL commands copied from Chrome DevTools or terminal parse into method, headers, and body.
- [ ] cURL GET requests without body parse query parameters into the schema.
- [ ] Malformed input displays an inline warning without throwing an uncaught exception.

### 2. AST Type & Semantic Schema Inference
- Recursively analyzes the parsed object structure.
- Infers primitive types: `string`, `number`, `boolean`, `null`, `array`, `object`.
- Root-level array payloads automatically generate container array schemas (`Type[]` and `z.array(ItemSchema)`).
- Resolves arrays of objects by computing the union of all observed keys across elements.
- Detects optionality: Any key present in some array elements but absent in others is flagged as optional (`optional: true`).
- Semantic pattern detection: Evaluates strings against regex heuristics:
  - ISO-8601 Timestamps (`YYYY-MM-DDTHH:mm:ssZ`) $\rightarrow$ mapped to `z.string().datetime()`
  - UUIDv4 strings $\rightarrow$ mapped to `z.string().uuid()`
  - Email addresses $\rightarrow$ mapped to `z.string().email()`
  - Web URLs $\rightarrow$ mapped to `z.string().url()`
*Acceptance Criteria:*
- [ ] Nested objects produce properly indented child interfaces / schemas.
- [ ] Mixed-type arrays generate union types (`string | number`).
- [ ] Semantic strings generate specialized Zod validators.
- [ ] Root-level arrays generate array schemas.

### 3. Multi-Target Code Generation
Generates syntactically valid code for 4 distinct targets:
- **TypeScript:** Generates idiomatic interfaces with PascalCase naming and JSDoc annotations.
- **Zod:** Generates `z.object({...})` schemas matching the exact TypeScript interface, including nested sub-schemas.
- **OpenAI Structured Outputs Tool Spec:** Generates a complete function calling tool definition conforming to OpenAI's strict mode:
  ```json
  {
    "type": "function",
    "function": {
      "name": "execute_api_call",
      "description": "Auto-generated tool contract for API payload",
      "strict": true,
      "parameters": {
        "type": "object",
        "properties": { ... },
        "required": [ ... ],
        "additionalProperties": false
      }
    }
  }
  ```
  *(In strict mode, all properties are listed in `required`; optional properties are represented as nullable unions `anyOf: [{type: "string"}, {type: "null"}]`).*
- **Anthropic Claude Tool Spec:** Generates an Anthropic-compliant tool definition with `name`, `description`, and `input_schema`.
*Acceptance Criteria:*
- [ ] Switching between tabs updates the code view instantaneously.
- [ ] OpenAI tool output is valid JSON and strictly includes all properties in `required`.
- [ ] 1-click copy copies the exact highlighted code to clipboard with visual confirmation.

### 4. Interactive In-Browser Mock & Chaos Runner
- Runs completely in-memory on the client thread (0 network calls, 0 latency, 0 external servers).
- **Happy Path Generator:** Creates a synthetic payload matching all types, nested objects, and regex constraints.
- **Chaos / Edge-Case Fuzzer:** Generates 3 deterministic edge-case mutations:
  1. *Missing Required Field:* Omits a mandatory key to verify schema enforcement.
  2. *Type Corruption:* Injects an invalid type (e.g., string into a number field or null into a non-nullable field).
  3. *Boundary Violation:* Injects an invalid email or malformed ISO date string.
- **Real-Time Validation Engine:** Passes synthetic payloads through the live Zod schema and captures `.safeParse()` outcomes.
- Displays an interactive results log showing:
  - Simulated endpoint: `/api/v1/mock-test`
  - Simulated latency: `12ms - 45ms`
  - HTTP Status: `200 OK` (for happy path) vs. `422 Unprocessable Entity` (for chaos payloads)
  - Validation diagnostics: Exact path of failed fields and Zod error messages.
*Acceptance Criteria:*
- [ ] Clicking "Run Chaos Mock" executes without page reload or backend calls.
- [ ] Happy path test returns green badge (Status 200).
- [ ] Chaos edge cases return red badges (Status 422) with detailed schema error paths.

### 5. Instant 1-Click Presets
Pre-loaded into top navigation:
1. **Stripe Payment Intent:** Demonstrates complex nested objects, integer amounts, currencies, and status enums.
2. **Weather Agent Tool:** Demonstrates LLM tool-calling spec with latitude, longitude, and optional units.
3. **GitHub Issue API:** Demonstrates cURL parsing with headers, repository slugs, title, and markdown body.
4. **E-Commerce Order:** Demonstrates arrays of items, UUIDs, customer details, and ISO-8601 dates.
*Acceptance Criteria:*
- [ ] Clicking any preset pill immediately updates input and all 4 output targets.

---

## States and Boundaries
- **First Use (Empty State):** Input editor shows a friendly placeholder with prompt: *"Paste cURL command, raw JSON, or click a preset above to begin"*. Output tabs display clean skeleton previews.
- **Normal Reactive State:** Valid input immediately computes AST and refreshes all targets in real time.
- **Malformed Input State:** If JSON syntax is invalid, a rose-colored inline banner appears: *"Invalid JSON syntax detected — Click 'Auto-Fix' or check line X"*. The previous valid contract remains visible so the user doesn't lose context.
- **Mock Execution State:** Running tests displays a brief simulated progress animation before resolving to green/red results.
- **Session Persistence:** State is held in component memory; refreshing resets to default Stripe preset for clean re-testing.

---

## Product Decisions
- **Zero-Backend SPA Architecture:** All parsing, AST inference, and mock execution run client-side to ensure 100% uptime, zero cold starts, zero hosting costs, and complete privacy for sensitive API payloads.
- **OpenAI Strict Mode Compliance:** Decided to target OpenAI's `strict: true` Structured Outputs standard because it is the state of the art in preventing AI agent tool hallucinations.
- **Fuzzer over Remote Mocking:** Decided against hosting remote mock endpoints on free serverless containers (which sleep and fail); client-side Zod validation with synthetic chaos payloads provides a faster, more reliable demonstration for hackathon judges.

---

## What We're Building (The POC Scope)
1. Single-page reactive developer studio with high-density split-pane layout.
2. cURL lexer & resilient JSON parser module.
3. AST type & semantic pattern inference engine.
4. Multi-target code generators (TypeScript, Zod, OpenAI Strict, Anthropic).
5. In-browser mock & chaos runner with Zod validation.
6. 4 pre-loaded 1-click presets.
7. Comprehensive automated test suite validating parsing, inference heuristics, code generators, and chaos fuzzer.

---

## Deferred From the POC
- Custom regex constraint editor UI.
- Direct export to GitHub Gist.
- Dark/Light mode toggle (POC is locked to high-contrast dark mode).

---

## Non-Goals
- **No Cloud Database / User Auth:** Eliminates setup friction and database connection risks.
- **No Remote TCP Mock Server:** Avoids server cold starts and deployment costs.
- **No Git/PR Summarizer:** Strictly out of scope to preserve product cohesion.

---

## Open Questions
- None. Requirements, UI layout, states, and acceptance criteria are fully specified.
