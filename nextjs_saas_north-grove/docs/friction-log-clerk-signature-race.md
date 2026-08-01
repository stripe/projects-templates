# Friction log: Clerk auth_signature_invalid on every request

## Symptom
Fresh signed-in session, every request to a Clerk-protected route on Vercel
returns 500 with `auth_signature_invalid`. Not transient. Reloading doesn't
help.

## Dead ends
- Assumed a Clerk SDK bug first, since the affected project was several
  majors behind (6.39.3). Read the 7.x changelog and found a 7.2.8 patch note
  about constant-time signature comparison that looked like a direct match.
  Upgraded to 7.5.11 (7.6.4 was blocked by a registry min-release-age policy).
  Deployed. Still crashed, identical error. Ruled out.
- Suspected the diagnostic logging itself might be masking the real timing.
  Confirmed matching `secretKeyPrefix`/`encryptionKeyPrefix` values in both
  the middleware and page-render logs, meaning the *live* `process.env` reads
  matched. This was a red herring: it shows what `process.env` held after
  `lib/clerk-config.ts` ran in that module graph, not what Clerk's own frozen
  constant had already captured, possibly earlier, in the same bundle.

## Root cause
Read `@clerk/nextjs/src/server/constants.ts` directly from source.
`SECRET_KEY`/`ENCRYPTION_KEY` are module-level `const`s read from
`process.env` once, at import time. `lib/clerk-config.ts` sets those env vars
as a runtime side effect, not before Clerk's module ever loads. Two separate
serverless bundles (middleware, page-render) means two independent chances
for import order to disagree on which value gets frozen.

## Fix and verification
Set the two keys as real Vercel project env vars by hand on the affected
project, redeployed, then built an automated Playwright reproduction
(sign-up, test-mode OTP `424242`, load the protected route) to verify without
needing a human to babysit a browser. Confirmed fixed: 500 on every run
before the fix, 200 with correct content on every run after, zero
`auth_signature_invalid` in the logs post-fix. Upstreamed the same fix into
this template's deploy script so every project generated from it gets it
automatically instead of hitting this on first deploy.
