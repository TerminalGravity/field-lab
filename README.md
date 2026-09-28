# Field Lab · Token Economics

A free, self-paced site with three interactive 3D STEM experiments at `/` and the original Learn → Measure → Experiment token-economics course at `/course/`. No checkout or account.

## Field Lab

Three original Three.js teaching simulations—pendulum rhythm, wave interference, and projectile motion—share a reusable lesson contract: a model, parameter controls, live measurements, explanatory text and equation, a target challenge, a hint, and model limitations. Orbit the apparatus, change one variable, compare the result, then solve the challenge. Completion is saved in browser storage. The physics functions are separately unit-tested. The wave midpoint readout is **peak amplitude relative to one source**, not displacement at one instant; its 180° cancellation target remains at zero for the whole cycle.

The linked X post by Ryan Sael showed examples and promised an open-source method/repository; that repository was not available when this was built. This is an original implementation of the teaching pattern, not the creator's source or a reproduction of the video assets.

## Run

```bash
pnpm install
pnpm dev
```

For a production build: `pnpm build && pnpm preview --host 127.0.0.1 --port 4178`.

## Learn

Four weeks covering tokens, prefix caching, model routing, and agent costs. Includes six-model cost studio, ten-call cache simulator, routing exercise, 15-turn agent lab with CSV export, quizzes, official source links, and local progress.

These are **simulations**, not actual API calls. Short-context USD rate-card values are cited in the course; illustrative effort multipliers and token assumptions are not performance guarantees.

## Measure

Import a JSON object or array of API usage records from GPT-6 or Claude. The app separates fresh input, cache write, cache read, and output tokens, applies its linked short-context rate card, and exports `cost-report.json`. An OpenAI record can contain `usage.input_tokens` plus `usage.input_tokens_details.cached_tokens` and `cache_write_tokens`; a Claude record can contain `usage.input_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`, and `output_tokens`. Import 1–500 records, maximum 1 MB. For nonzero Claude cache writes, include `usage.cache_creation.ephemeral_5m_input_tokens` and `ephemeral_1h_input_tokens` so the different write rates are priced correctly; ambiguous TTLs are rejected. Unsupported model IDs are rejected rather than silently priced.

No trace leaves the browser. Do not import prompts, keys, tool outputs, or sensitive text. The imported normalized usage records, report name/note, and course progress persist in that browser's localStorage until cleared. Export the report before clearing browser storage; there is no account, sync, or server-side backup. Estimates are not reconciled provider invoices.

## Experiment with a local model

Run a local OpenAI-compatible chat-completions server bound to loopback, then from this repository:

```bash
node scripts/local-benchmark.mjs \
  --model YOUR_LOCAL_MODEL \
  --prompt-file labs/task.txt \
  --out result.json
```

The default endpoint is `http://127.0.0.1:11434/v1/chat/completions`; override it with `--url http://127.0.0.1:PORT/v1/chat/completions`. Only HTTP loopback addresses are allowed. The script sends one prompt to that local endpoint, requires reported token counts, and writes a result JSON (including the answer) with restricted file permissions. Inspect the answer locally. Import `result.json` in Experiment; the web app retains only model, usage, latency, and measurement time, not the answer.

Set hardware cost, useful-life hours, watts, and electricity price to estimate local run cost. Mark whether both the cloud and local outputs passed the **same** quality check. Compare identical workloads: a multi-turn cloud trace is not equivalent to a single local call. Local estimates exclude maintenance, idle power, networking, and labor. No local model weights or runtime are installed by this repository; no live local inference is claimed unless you run one.

## Verification

`pnpm test && pnpm build` covers course/platform calculations, local-runner contract, and the STEM physics/challenge models. With the development server on port 4178, `node tests/browser.mjs && node tests/platform-browser.mjs && node tests/stem-browser.mjs` exercises both routes and all three lessons in Chromium. Tests use a loopback fixture server for local API compatibility, not actual model inference.

## Hosting

The GitHub Pages workflow in `.github/workflows/deploy.yml` runs unit tests, builds both pages, and publishes `dist` on each push to `main`. The previous Cloudflare Quick Tunnel link was a disposable preview; it cannot be relied on for uptime. No backend or API key is needed for these static lessons; browser-local progress does not sync across devices.
