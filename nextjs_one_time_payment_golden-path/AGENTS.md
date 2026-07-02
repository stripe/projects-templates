# AGENTS

This repo is a generated Next.js one-time payment starter. Your job is to turn it into a specific product without breaking the working Stripe, auth, database, and deployment wiring that already exists.

## Start here

1. Read `prompts/starter-to-product.md`.
2. Inspect `lib/app-config.ts`, `app/page.tsx`, `app/checkout/page.tsx`, `app/dashboard/page.tsx`, `app/api/health/route.ts`, and `scripts/setup-stripe.mjs`.
3. If the product direction is not already clear, start with discovery questions before making large changes.
4. Get a confirmed product name from the user before naming the product yourself, unless the user explicitly asks you to invent one.
5. Restate the product brief and the current implementation phase before coding.
6. Before implementing, explicitly ask the user for approval to proceed.

## Non-negotiables

- Keep durable Stripe resources such as products, prices, webhooks, and entitlements set up through explicit setup scripts or dashboard-managed configuration.
- Do not add one-off runtime Stripe API calls to create or mutate durable catalog resources.
- Runtime Stripe API calls are still fine for ephemeral actions such as Checkout Sessions, PaymentIntents, refunds, and customer-specific purchase flows.
- Preserve the existing route structure unless the user explicitly asks for a larger rewrite.
- Preserve any working Clerk, database, and hosting integration already present in the repo.
- Preserve the Twilio email integration: a post-purchase welcome email sent from both the Stripe webhook and the success page via the shared `sendWelcomeEmailForPurchaseOnce` helper in `lib/twilio-email.ts`, deduped by an atomic database guard so it only sends once. Keep sends best-effort so they never block checkout. Customize the copy rather than removing the wiring.
- Keep `/api/health` useful as a verification endpoint.
- Remove starter/template readiness content from the product landing page. Do not keep or reintroduce auth, billing, storage, or hosting status panels as end-user product UI.

## What to customize first

- Product name, positioning, and app framing in `lib/app-config.ts`.
- Landing page storytelling and information architecture in `app/page.tsx`.
- Checkout page copy, feature framing, and offer presentation in `app/checkout/page.tsx`.
- Signed-in dashboard framing in `app/dashboard/page.tsx`.

## Default phases

1. Landing page first:
   - lock the product style, tone, and feel
   - remove all starter/template messaging and status content
   - keep only product-relevant CTAs such as sign in or checkout where appropriate
2. Dashboard, login/auth, and checkout surfaces:
   - carry the established visual system into signed-in and conversion flows
3. Actual business functionality:
   - implement or deepen the real product behavior after the style and framing are established

## Frontend direction

- Start with design thinking before coding:
  - clarify the product purpose and who it serves
  - choose a strong tone or aesthetic direction
  - identify the one thing the product should feel memorable for
- If the user is starting from scratch, help them make decisions instead of guessing for them.
- Ask one question at a time during discovery. Do not dump a long questionnaire on the user.
- Ask follow-up questions when needed to refine the brief.
- Good discovery topics include:
  - product name
  - what the product does and who it serves
  - the main workflow or core value
  - desired look and feel
  - color preferences, with a few suggested palette directions
  - design style preferences, with a few suggested visual directions
  - references, constraints, must-haves, and must-avoids
- Use this visual-quality reference when making frontend choices: [Frontend Design Skill](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md).

## Working style

1. Discovery: inspect the current starter and identify what can be reused.
2. Product interview: if the brief is incomplete, ask one concise, high-value question at a time and wait for the answer before asking the next.
3. Plan: summarize the product direction, assumptions, and the current phase to ship using a clear handoff like `Here is what I'm thinking`.
4. Approval: ask `Are you ready for me to start implementing this?` and wait for confirmation.
5. Implement in phases: landing page first, then dashboard/login/checkout, then business functionality.
6. Implement: make cohesive changes instead of scattered cosmetic tweaks.
7. Verify: confirm the app still builds and core flows still work.

## Verification

- Check `app/api/health/route.ts` and verify the generated health output still makes sense.
- Verify landing, checkout, success, and cancel routes after major copy or layout changes.
- If auth is included, verify the sign-in and dashboard flow still works.
- If the database is included, preserve the existing purchase-unlock sync path.
