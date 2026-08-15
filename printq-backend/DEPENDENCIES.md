# New dependencies needed

```bash
npm install razorpay zod @supabase/supabase-js @supabase/ssr pdf-parse adm-zip mammoth bcryptjs jsonwebtoken @upstash/redis @upstash/ratelimit
npm install -D @types/adm-zip @types/bcryptjs @types/jsonwebtoken
```

- `razorpay` — per-shop payment client
- `pdf-parse` — exact PDF page counts
- `adm-zip` — reads .pptx as a zip to count slides
- `mammoth` — extracts .docx text for the word-count page estimate
- `bcryptjs` — staff PIN hashing
- `jsonwebtoken` — staff PIN-session tokens
- `@upstash/redis` + `@upstash/ratelimit` — staff-login rate limiting (replaces the earlier in-memory version)

SMS (`lib/notifications/sms.ts`) uses plain `fetch` against Twilio's REST
API — no SDK dependency needed.

(Supabase/zod packages may already be installed from Phase 0 — check your
existing `package.json` first.)

## Supabase Storage setup

Create a **private** bucket named `documents` if it doesn't already exist
(Supabase dashboard → Storage → New bucket → uncheck "Public"). The upload
route and signed-URL route both assume this exact bucket name.
