# 🎬 2-Minute Demo Video Script: ContractForge

> **Follows:** `hackathon-product-strategy/SKILL.md > Gate 3: The 2-Minute Demo Video Script Standard`
> **Target Duration:** Exactly 1 minute 50 seconds – 2 minutes 00 seconds.
> **Recording Setup:** Screen recording of `http://localhost:5173` (1280x720 or 1920x1080), clean desktop, no PowerPoint slides.

---

### [0:00 – 0:20] Phase 1: The Agony (The Real-World Pain Point)

* **Visual:** Open a code editor or terminal. Show a failed OpenAI API call error (`400 Bad Request: 'additionalProperties' must be false`, or `'name' is missing in required`).
* **Spoken Script:**
  > *"If you've ever built autonomous AI agents with OpenAI Structured Outputs or Claude Tools, you know this pain: one missing required field, an unhandled optional property, or an omitted `additionalProperties: false`, and your agent loop crashes with an API 400 error.
  > Meanwhile, converting real-world API responses or messy cURL commands into bulletproof schemas takes hours of boilerplate typing."*

---

### [0:20 – 0:50] Phase 2: The Magic (Instant Ingestion & Generation)

* **Visual:** Switch smoothly to the running ContractForge studio (`http://localhost:5173`). Click the **"cURL Command"** preset pill at the top. The input illuminates instantly with the multi-line Stripe cURL command.
* **Spoken Script:**
  > *"Enter ContractForge: the universal API and Agent Schema Studio.
  > With zero configuration, ContractForge ingests raw JSON or messy multi-line cURLs straight from Chrome DevTools or your terminal.
  > Notice how our lexer tokenizes shell arguments, strips authentication headers, and normalizes line continuations in under fifteen milliseconds. If a GET request has no body, it even converts URL query parameters directly into the root schema."*

---

### [0:50 – 1:20] Phase 3: The Agent Superpower (Strict Schemas & 4 Targets)

* **Visual:** Click through the code tabs on the right: **TypeScript** $\to$ **Zod Schema** $\to$ **OpenAI (Strict)** $\to$ **Anthropic Tool**. Zoom in slightly or highlight the OpenAI JSON.
* **Spoken Script:**
  > *"On the right, ContractForge immediately synthesizes four production-ready contracts.
  > First, idiomatic TypeScript interfaces. Second, runtime Zod schemas with detected regex semantics for ISO timestamps, UUIDs, emails, and URLs.
  > And most importantly, frontier AI Agent tools. Look at our OpenAI Strict Mode output: it strictly enforces `strict: true`, stamps `additionalProperties: false` recursively across every object level, and maps optional fields into nullable unions so OpenAI will never reject your payload."*

---

### [1:20 – 1:45] Phase 4: The Twist (The In-Browser Chaos Mock Runner)

* **Visual:** Click the green **"Run Chaos Mock"** button. The bottom drawer slides up. Simulated latency runs briefly, then illuminates with green **200 OK** and red **422 REJECTED** badges. Click the first rejected card to expand the diagnostic issue: `id: Required`.
* **Spoken Script:**
  > *"Now for the killer feature: how do you know this contract actually works?
  > Without running a mock server or writing test code, click 'Run Chaos Mock'.
  > ContractForge compiles the Zod schema live directly in browser memory. It synthesizes a valid Happy Path payload returning 200 OK, plus three deterministic chaos mutations: omitted required keys, corrupt primitives, and boundary violations.
  > Here, our fuzzer deleted the required ID, and the in-memory runner instantly caught and intercepted it with a 422 error and exact field diagnostics."*

---

### [1:45 – 2:00] Phase 5: The Wrap & Open-Source Impact

* **Visual:** Click **"Copy Code"** to show the animated checkmark confirmation. Show the footer indicating 100% active engine status and GitHub link.
* **Spoken Script:**
  > *"ContractForge is 100% free and open source, runs completely client-side with zero backend servers, zero latency, and zero hosting costs.
  > It transforms hours of fragile schema drafting into thirty seconds of verified confidence.
  > Check out our repository on GitHub to try it live or run our Playwright test suite. Thank you!"*
