# Qadam ENT repository guidance

## Product source of truth

- Read `docs/qadam-ent-logic-spec.md` before changing a user flow, business rule, calculation, persistence, offline behavior, or data model.
- If the current prototype conflicts with the specification, follow the specification unless the user explicitly changes a requirement.
- Do not invent fixed ҰБТ/ЕНТ limits, scores, dates, league sizes, or notification rules. Read them from configuration or mock configuration.

## Product direction

- Build a complete mobile-first learning product for students aged 15–18, not a collection of disconnected showcase screens.
- Optimize the first session for value within 2–3 minutes: language → subject → five-question guest diagnostic → preliminary result → save or continue → personal plan.
- Give each screen one clear job and one obvious primary action. Reveal secondary details only when the user asks for them.
- Prefer short, natural Russian and Kazakh copy. Avoid marketing filler, technical language, and unexplained metrics.
- When there is not enough data, show an honest `insufficient-data` state. Never present a five-question diagnostic as an accurate ҰБТ/ЕНТ forecast.

## Visual standard

- Primary design width is 390 px. Also verify tablet and desktop layouts; production pages must adapt instead of remaining inside a decorative phone mockup.
- Use the bundled Inter variable font with the system sans-serif fallback. Do not add display, handwritten, futuristic, or decorative fonts.
- Use a restrained neutral canvas, one primary blue accent, and semantic success/warning/error colors. Do not use several competing accent colors on one screen.
- Keep a calm hierarchy with consistent spacing, alignment, and typography. Use 16 px mobile side padding as the default.
- Avoid generic AI-generated aesthetics: gratuitous blue-purple gradients, glowing blobs, glassmorphism, excessive shadows, oversized pills, a card around every paragraph, decorative charts, emoji icons, and filler illustrations.
- Use Lucide icons only when they clarify an action. Do not mix icon families.
- Prefer content hierarchy and whitespace over borders and containers. If an element does not help the student decide or act, remove it.
- Keep touch targets at least 44×44 px, body text readable, focus states visible, contrast at WCAG AA, and motion subtle with reduced-motion support.

## Architecture

- Keep the agreed stack: Vue 3, `<script setup lang="ts">`, Vite, TypeScript, Tailwind CSS, Pinia, Vue Router, and Vue I18n.
- Vue components render UI and emit user intent. They must not own business calculations, direct `localStorage` access, or API-specific rules.
- Put cross-screen state and orchestration in Pinia stores.
- Put deterministic calculations in pure services such as `quizEngine.ts`, `dailyPlanEngine.ts`, `reviewScheduler.ts`, `forecastEngine.ts`, `analyticsEngine.ts`, `streakEngine.ts`, and `leagueEngine.ts`.
- Access persistence only through `PersistenceService`. Access session data through repository interfaces so mock/local repositories can later be replaced by API repositories.
- Keep correct trial-test answers unavailable to the client until completion in the future production API.
- Reuse design tokens and shared components. Do not duplicate long Tailwind class combinations across many views when a stable component or variant is clearer.

## Implementation workflow

1. Inspect the relevant route, view, components, data flow, and product rules before editing.
2. State the user job and the smallest coherent end-to-end flow being implemented.
3. Implement real interactions and state transitions, not static screenshots.
4. Cover relevant loading, empty, insufficient-data, offline, error, disabled, and resume states.
5. Keep unrelated files and behavior unchanged.
6. Run `npm run type-check`, `npm test`, and `npm run build` after meaningful changes.
7. Visually inspect affected screens at 390 px and at least one wider viewport when browser tooling is available.

Do not leave TODOs, dead buttons, fake success paths, or “coming soon” placeholders in a flow presented as complete.

## Qadam product agent

- For a focused product-design plus implementation task, use the project custom agent named `qadam_product`.
- Keep one owner for overlapping UI and logic changes. Use additional agents only when the user explicitly asks for parallel work and the subtasks do not edit the same files.
