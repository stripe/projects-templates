Turn this generated app into a real product for Next.js SaaS Starter.

Start by reading `AGENTS.md`, then follow this workflow:

1. Starter audit
   - Inspect `lib/app-config.ts`, `app/page.tsx`, `app/checkout/page.tsx`, `app/dashboard/page.tsx`, `app/api/health/route.ts`, and `scripts/setup-stripe.mjs`.
   - Figure out which integrations are already included and what must stay intact.
   - Do not mistake the generic starter copy or layout for a real product brief.

2. Discovery-first conversation
   - If the user has not already given a clear product brief, do not jump straight into implementation.
   - Start with a grounded message like: `Looks like we're starting from square one. Tell me about the product you want to build.`
   - If the product does not already have a confirmed name, ask for the name first. Do not invent the product name unless the user explicitly asks you to.
   - Ask one question at a time, not a batch of 4-6 questions.
   - After each answer, ask the next highest-value follow-up question. Follow-up questions are encouraged when they clarify the brief.
   - Cover these areas over time:
     - product name
     - what the product is and who it is for
     - the main workflow or core value proposition
     - the desired look and feel
     - preferred colors, with a few concrete palette suggestions
     - the design direction, with a few concrete style suggestions
     - any references, constraints, must-haves, or must-avoids
   - For palette suggestions, offer options like:
     - minimal monochrome with one signal color
     - warm neutral editorial tones
     - deep dark mode with electric accents
     - bright modern SaaS colors with a confident primary
   - For design direction suggestions, offer options like:
     - polished B2B dashboard
     - premium editorial product
     - playful consumer app
     - developer-tool interface
     - bold futuristic launch page
   - If the user is unsure, offer 2-4 concrete directions to choose from instead of inventing one silently.
   - Do not choose a product narrative on your own while the brief is still ambiguous.

3. Synthesis before coding
   - Once the user answers, summarize the brief back clearly:
     - confirmed product name
     - product concept
     - audience
     - tone and visual direction
     - color direction
     - first implementation slice
   - Call out assumptions explicitly and get aligned before large edits.
   - Before moving from ideation into implementation, explicitly hand control back to the user with wording like:
     - `Here is what I'm thinking`
     - `Are you ready for me to start implementing this?`
     - `I'll start with the landing page first, then move into the dashboard/login and checkout surfaces, and then the business functionality.`
   - Do not start implementation until the user confirms or asks you to proceed.

4. Phased implementation
   - Work in this default order unless the user explicitly asks for a different sequence:
     - Phase 1: landing page
     - Phase 2: dashboard, login/auth, and checkout surfaces
     - Phase 3: actual business functionality
   - The landing page should establish the style and feel first. Treat it as the visual anchor for later pages.
   - Get rid of all starter/template content on the landing page when productization begins.
   - Never keep or reintroduce the auth / billing / storage / hosting readiness or status UI as part of the end product landing page.
   - It is fine to keep or add real product CTAs such as sign in, sign up, or checkout when they fit the product flow.
   - Replace the starter positioning, landing page, checkout copy, and dashboard framing with a cohesive product direction.
   - Keep the existing Stripe, auth, database, and deployment wiring intact unless the user explicitly asks for architectural changes.
   - Preserve the working core flows and treat them as the product foundation while you transform the experience around them.
   - Use typography, color, spacing, composition, motion, and background detail as one coherent system.
   - Avoid generic AI-starter aesthetics: default-looking fonts, timid palettes, predictable layouts, and cookie-cutter SaaS copy.
   - Use this frontend design reference as guidance for visual quality and avoiding generic AI styling: [Frontend Design Skill](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md).
   - Note that the build environment may not allow fetching Google Fonts, so local/system fonts are safer unless you have confirmed font loading works.
   - Match the implementation to the chosen aesthetic. Bold directions can be expressive; restrained directions should feel precise and intentional.

5. Verification
   - Verify `/api/health` still reflects the app correctly.
   - Verify the main user flow still works for the integrations that are present.
   - Summarize what changed and any follow-up decisions the user should make next.
