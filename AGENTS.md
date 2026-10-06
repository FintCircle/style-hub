<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- Keep informational pages on dedicated routes and render them through the shared InfoPage shell so navigation and editorial presentation stay consistent.
- Auth is Clerk (hosted portal) with a browser ClerkProvider; server code verifies the bearer session token with @clerk/backend, because the app runs on Cloudflare Workers without a Clerk server SDK.
- Cloudflare bindings (DB, MEDIA, secrets) are read via getCfEnv(request) in src/lib/cf-env.server.ts from the request's runtime.cloudflare.env and Nitro's globalThis.**env**, because Nitro's Worker entry wraps src/server.ts and receives env first; without bindings, server functions return `live: false` and the UI shows sample content.
- D1 profiles are created lazily on first authenticated request (ensureProfile), keyed by Clerk user ID; never trust a profile ID from the browser.
- Files go to R2 only through /api/public/media/upload; D1 stores the object key and metadata, and public URLs are built from the media domain.
- D1 schema lives in migrations/*.sql and is applied by the owner with wrangler.
