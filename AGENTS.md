# Qadam ENT repository guidance

## Product source of truth

- Locate and read the relevant sections of `docs/qadam-ent-logic-spec.md` before changing a user flow, business rule, calculation, persistence, offline behavior, or data model. Read the full specification only for genuinely cross-cutting work.
- If the current prototype conflicts with the specification, follow the specification unless the user explicitly changes a requirement.
- Do not invent fixed ҰБТ/ЕНТ limits, scores, dates, league sizes, or notification rules. Read them from configuration or mock configuration.

## Audience and language

- Qadam ENT is built only for Kazakh-speaking students in Kazakhstan.
- Every student-facing string must be in clear, natural Kazakh: navigation, questions, explanations, validation, errors, empty states, notifications, accessibility labels, page titles, metadata, and displayed mock data.
- Use correct Kazakh educational terminology, including «ҰБТ» in the interface. Avoid Russian calques, mixed-language copy, and untranslated technical language.
- Do not add a language selector, locale switching, Russian fallback copy, locale dictionaries, Vue I18n, persisted language state, or bilingual fields such as `nameRu` and `nameKk`. Remove legacy multilingual code when it is encountered in the affected flow.
- Use language-neutral domain fields such as `name`, `text`, and `explanation`. Keep code identifiers and API contracts in clear English.
- Set the document language to Kazakh with `<html lang="kk">`. Internal engineering documentation may remain in Russian or English.

## Product direction

- Build a complete mobile-first learning product for students aged 15–18, not a collection of disconnected showcase screens.
- Optimize the first session for value within 2–3 minutes: subject → five-question guest diagnostic → preliminary result → save or continue → personal plan.
- Give each screen one clear job and one obvious primary action. Reveal secondary details only when the user asks for them.
- Use short, age-appropriate Kazakh copy. Avoid marketing filler, technical language, and unexplained metrics.
- When there is not enough data, show an honest `insufficient-data` state. Never present a five-question diagnostic as an accurate ҰБТ/ЕНТ forecast.

## Visual standard

- Primary design width is 390 px. Also verify tablet and desktop layouts; production pages must adapt instead of remaining inside a decorative phone mockup.
- Use the bundled Inter variable font with the system sans-serif fallback. Do not add display, handwritten, futuristic, or decorative fonts.
- Use a restrained neutral canvas, one primary blue accent, and semantic success/warning/error colors. Do not use several competing accent colors on one screen.
- Define color, typography, spacing, radius, elevation, control-size, and interaction-state tokens as shared sources of truth.
- Align spacing to a consistent 4 px-based token scale and use 16 px mobile side padding by default. Avoid arbitrary one-off values unless a documented layout need requires one.
- Keep a calm hierarchy with consistent spacing, alignment, and typography. Each screen has one semantic page heading and one visually dominant primary action.
- Avoid generic AI-generated aesthetics: gratuitous blue-purple gradients, glowing blobs, glassmorphism, excessive shadows, oversized pills, a card around every paragraph, decorative charts, emoji icons, and filler illustrations.
- Use Lucide icons only when they clarify an action. Do not mix icon families.
- Prefer content hierarchy and whitespace over borders and containers. Do not nest decorative surfaces when headings, grouping, and whitespace communicate the hierarchy. If an element does not help the student decide or act, remove it.
- Keep touch targets at least 44×44 px, body text readable, focus states visible, contrast at WCAG AA, and motion subtle with reduced-motion support.
- Verify affected flows at 390 px and a wider viewport with no clipping, horizontal scrolling, overlapping controls, or truncated Kazakh text.
- Remove unused imports, components, routes, styles, assets, abandoned variants, debug data, duplicate implementations, and obsolete artifacts introduced or exposed by the change.

## Architecture

- Keep the agreed stack: Vue 3, `<script setup lang="ts">`, Vite, TypeScript, Tailwind CSS, Pinia, and Vue Router. Do not add Vue I18n.
- Keep one project on one understandable stack. Do not introduce React, jQuery, a second state manager, or competing UI/component libraries unless an approved migration or a documented technical requirement makes it necessary.
- Keep predictable top-level boundaries under `src`: `pages`, `components`, `features`, `services/api`, `stores`, `types`, `utils`, and `assets`. Do not create empty directories or duplicate the same responsibility across several locations.
- Put route-level screens in `pages`; broadly reused UI in `components`; domain-specific UI, logic, and tests in `features/<feature>`; HTTP clients and DTO mapping in `services/api`; cross-screen Pinia modules in `stores`; shared stable contracts in `types`; pure general helpers in `utils`; and static resources in `assets`.
- Follow official Vue and TypeScript conventions: PascalCase components, `useX` composables, camelCase functions and variables, explicit domain types, and one clear responsibility per module.
- Keep components small and focused on one UI job. Split a component when it owns unrelated layout, state, or interaction responsibilities; reuse an existing component or variant before creating another implementation.
- Organize application code by feature and domain. Keep feature-specific views, components, store code, services, types, and tests close to the feature; move code to a shared boundary only after multiple real consumers share a stable contract.
- Keep dependency direction explicit: Vue UI → Pinia orchestration → pure domain engines → repository interfaces. Infrastructure implementations must not leak into components.
- UI components must never call `fetch`, Axios, SDK clients, or API endpoints directly. Put requests, response validation, DTO mapping, transport errors, and retries in `services/api` or repository implementations.
- Define typed contracts for props and emits, store boundaries, engine inputs and outputs, repository methods, persistence payloads, API requests, API responses, and DTO mappings.
- Keep TypeScript strict and do not use `any`. Accept `unknown` at external boundaries, validate and narrow it, then convert it to an explicit domain type.
- Use descriptive English code names such as `createOrder`, `getUserProfile`, and `OrderStatus`; do not use vague names such as `func1`, `data2`, `item`, or `handleData` when the domain meaning is known.
- Give each function one clear responsibility, explicit inputs and outputs, and the fewest possible side effects. Prefer pure functions for calculations and isolate unavoidable effects at service, repository, or store boundaries.
- Store repeated domain and UI values in typed sources of truth: statuses and transitions, route names, error codes and messages, configuration keys, and design tokens. Do not scatter magic strings, numbers, or colors through components.
- Prevent circular dependencies and unrelated deep imports across features. Expose a small public feature API only where cross-feature access is required.
- Vue components render UI and emit user intent. They must not own business calculations, direct `localStorage` access, or API-specific rules.
- Put cross-screen state and orchestration in Pinia stores.
- Put deterministic calculations in small named pure functions such as `quizEngine.ts`, `dailyPlanEngine.ts`, `reviewScheduler.ts`, `forecastEngine.ts`, `analyticsEngine.ts`, `streakEngine.ts`, and `leagueEngine.ts`.
- Use composables only for genuinely reusable reactive or lifecycle-dependent behavior, never as wrappers around pure calculations.
- When the same real logic or UI pattern appears two or three times, extract the smallest stable function, composable, component, or variant that expresses the shared responsibility. Do not copy and modify parallel implementations.
- Do not create generic base components, composables, services, factories, or abstractions for hypothetical future reuse.
- Access persistence only through `PersistenceService`. Access session data through repository interfaces so mock/local repositories can later be replaced by API repositories.
- Keep correct trial-test answers unavailable to the client until completion in the future production API.
- Reuse design tokens and shared component variants. Do not duplicate long Tailwind class combinations when an existing stable component or variant expresses the same behavior.
- Unit-test each business engine for normal cases, boundaries, insufficient data, invalid input, and idempotency where applicable. Add focused store or component tests for behavior that crosses module boundaries.

## Engineering quality

- ESLint and Prettier are mandatory and must have committed configuration plus package scripts. Use one consistent style; do not mix manual formatting conventions across files.
- Keep secrets, passwords, tokens, private URLs, and API keys out of source code, fixtures, commits, logs, and client bundles. Read runtime values from environment variables, commit only a safe `.env.example`, and ignore real `.env` files.
- Record important business rules and state transitions in `docs/qadam-ent-logic-spec.md` or the relevant README before or together with their implementation. Code must not become the only description of allowed states and transitions.
- Add dependencies only when they remove more complexity than they create. Reuse the existing stack and browser/platform capabilities first.
- Deliver the smallest useful MVP flow before optional features, speculative abstractions, animations, dashboards, or secondary settings.

## Implementation workflow

1. Inspect the relevant route, view, components, data flow, and product rules before editing.
2. State the user job and the smallest coherent end-to-end MVP flow being implemented.
3. Implement real interactions and state transitions, not static screenshots.
4. Cover relevant loading, empty, insufficient-data, offline, error, disabled, and resume states.
5. Keep unrelated files and behavior unchanged.
6. Run the narrowest relevant tests first, then `npm run lint`, `npm run format:check`, `npm run type-check`, `npm test`, and `npm run build` after meaningful changes. If a required script is missing, establish it in a dedicated setup change instead of silently skipping the check.
7. Visually inspect affected screens at 390 px and at least one wider viewport when browser tooling is available.
8. Before every merge or release, require clean formatting, lint, type-check, tests, production build, and a manual pass through the affected primary user scenarios.
9. Remove unused code, dependencies, styles, assets, debug output, and temporary files before finishing.

Do not leave TODOs, dead buttons, fake success paths, placeholder content, duplicate implementations, unreachable states, or “coming soon” labels in a flow presented as complete.

## Agent context efficiency

- Start with this file and only the specification sections, route, feature, store, service, types, tests, configuration, and shared components involved in the requested flow.
- Use targeted search before opening files. Do not scan unrelated views, generated output, binary assets, or the full repository without a concrete need.
- Reuse findings from the current task. Do not reopen unchanged files or repeat long summaries and code blocks.
- Prefer the smallest coherent end-to-end change and focused validation over speculative refactors.
- Keep progress updates and final reports concise: outcome, decisions, changed files, validation, and genuine blockers only.

## Git discipline

- When commits are part of the requested workflow, make each commit atomic: one coherent product or technical concern, with unrelated formatting, refactoring, cleanup, and feature work kept separate.
- Use Conventional Commits in the form `type(scope): concise imperative summary`, with a meaningful feature or domain scope.
- Prefer `feat`, `fix`, `refactor`, `test`, `docs`, and `chore`. Write a concise imperative English subject without a trailing period.
- Stage only reviewed files, never commit temporary or generated output, and run the relevant checks before committing.

## Qadam product agent

- For a focused product-design plus implementation task, use the project custom agent named `qadam_product`.
- Keep one owner for overlapping UI and logic changes. Use additional agents only when the user explicitly asks for parallel work and the subtasks do not edit the same files.
