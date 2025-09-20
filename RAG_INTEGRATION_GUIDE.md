## Villy RAG Chat – Integration Guide

This guide documents how the Villy (Law Entry) app implements Retrieval-Augmented Generation (RAG), how it connects to its deployed PostgreSQL database, and how you can integrate it with the main Civilify chatbot application.

### Contents
- Overview
- Data model and embeddings
- Retrieval pipeline (vector + trigram + FTS + fast-path)
- Prompting and generation
- API endpoints and client usage
- Database connectivity and migrations
- Environment configuration
- Integration with Civilify (two options)
- Tuning, observability, and troubleshooting

---

## Overview

Villy indexes legal knowledge base (KB) entries into dense vectors using OpenAI embeddings and stores them in PostgreSQL with pgvector. The chat endpoint retrieves relevant entries via a hybrid strategy (vector KNN + trigram lexical + optional full-text search + regex fast-path), merges and scores candidates, builds concise type-aware context snippets, and asks a chat model to answer strictly from the provided context.

Key files:
- `server/src/routes/chat.js` – Chat endpoint and retrieval logic
- `server/src/embedding-builder.js` – Field flattener for embeddings/context
- `server/src/routes/kb.js` – Entry create/update (embedding write)
- `server/src/setup-db.js` – Startup migrations
- SQL: `server/sql/001_init.sql`, `012_trgm_lexical.sql`, `013_fulltext.sql`
- Client: `src/components/kb/ChatModal.tsx`, `src/services/chatApi.ts`

---

## Data model and embeddings

Table: `kb_entries` (created in `server/sql/001_init.sql`), with `embedding vector(1536)` for `text-embedding-3-small`.

When creating/updating entries (`server/src/routes/kb.js`):
1. `buildEmbeddingText` (in `server/src/embedding-builder.js`) flattens fields:
   - Core: `title`, `canonical_citation`, `summary`, `text`, `tags`, `jurisdiction`, `law_family`, dates, `source_urls`
   - Type-specific: `elements`, `penalties`, `defenses`, `rule_no`, `section_no`, `triggers`, `time_limits`, `required_forms`, `circular_no`, `issuance_no`, `instrument_no`, `applicability`, `supersedes`, `steps_brief`, `forms_required`, `failure_states`, `violation_code`, `license_action`, `fine_schedule`, `apprehension_flow`, `incident`, `phases` (steps with conditions/evidence/deadlines/legal_bases/failure_state), `forms`, `handoff`, `rights_callouts`, `rights_scope`, `advice_points`, `topics`, `jurisprudence`
   - Relations: `legal_bases`, `related_sections` (flattened)
2. OpenAI embeds the blob; the 1536-float vector is stored in `kb_entries.embedding`.

Reindex existing rows: `cd server && npm run reindex` (uses the same builder).

---

## Retrieval pipeline

Endpoint: `POST /api/chat` (`server/src/routes/chat.js`, JWT-protected)

1) Normalize the question
- Lowercase; collapse punctuation/whitespace; legal synonyms:
  - `sec`→`section`, `roc`/`r.c`→`rules of court`, `bail`→`bail rule 114`, `warrantless arrest`→`rule 113 section 5`
- Dynamic knobs per query:
  - If identifiers like `rule X section Y` or `art Z` exist → `topK≤8`, `simThreshold≥0.24`
  - If very short (≤3 tokens) → `topK≥16`, `simThreshold≤0.18`

2) Candidate retrieval (hybrid)
- Vector KNN (pgvector):
  - `select *, 1 - (embedding <=> $q::vector) as similarity ... order by embedding <=> $q::vector limit topK`
- Trigram lexical (pg_trgm) fallback (if best sim < threshold):
  - `greatest(similarity(title,q), similarity(canonical_citation,q), similarity(text,q)) as lexsim`
  - `%` operators with explicit `::text` casts
- Full-text search (optional, resilient):
  - `fts @@ plainto_tsquery('english', q)`, `ts_rank_cd(fts, ...)` (guarded: if column/ext missing, continue without)
- Regex fast-path:
  - Extract `Rule X`, `Section Y`, `Art Z` and fetch direct SQL matches (`rule_no`, `section_no`, `canonical_citation`, `title`)

3) Scoring and merging
- If vector strong: `0.65*vector + 0.25*lex + 0.10*fts`
- Else: `0.35*vector + 0.45*lex + 0.20*fts`
- Add `+0.1` boost if regex fast-path matched
- Sort by `finalScore`, take topK
- Optional reranker (`CHAT_USE_RERANKER=true`): ask `gpt-4o-mini` to score topK (0–100) based on a concise snippet; re-order and return top 6–8

4) Context building (type-aware)
- `sliceContext` assembles concise blocks per entry:
  - Rules of Court: `rule_no`, `section_no`, `triggers`, `time_limits`, `required_forms`, snippet/summary
  - Statute/ordinance: `elements`, `penalties`, `defenses`, snippet/summary
  - Rights advisory: `rights_scope`, `advice_points`, `legal_bases`
  - SOP/incident: `steps_brief` or top checklist steps
- Snippets:
  - Prefer `ts_headline` (FTS) when available; else keyword windowing (short excerpts)

5) Prompting and generation
- System rules: answer ONLY from context, quote short phrases, avoid inference, prefer exact rule/section/art matches
- Require short parenthetical citation per paragraph, e.g., `(Rule 114 Sec. 20)`
- Temperature 0.0
- Return `{ answer, sources }` with ranking details

---

## API endpoints and client usage

Server (Express):
- `POST /api/chat` – chat with RAG
- `POST /api/kb/entries` / `PUT /api/kb/entries/:entryId` – upsert KB entries (handles embedding)
- `POST /api/kb/search` – semantic search
- `GET /health` – health probe

Client (React):
- `src/services/chatApi.ts`:
  - Base: `API_BASE = (REACT_APP_API_BASE || process.env... || window.location.origin) + '/api'`
  - Sends JWT: `Authorization: Bearer <token>`
- `src/components/kb/ChatModal.tsx`:
  - Captures question, calls `askChat`, displays answer + sources
  - Stores local chat history in `localStorage`

---

## Database connectivity and migrations

Connectivity:
- `server/src/db.js` uses `pg.Pool({ connectionString: DATABASE_URL, ssl: PGSSL ? { rejectUnauthorized:false } : undefined })`
- Set `DATABASE_URL` (Render external connection string), `PGSSL=true` in production

Migrations (`server/src/setup-db.js`):
- Runs idempotent SQL files at startup, including:
  - `001_init.sql` – pgvector extension, base schema, IVFF index
  - `012_trgm_lexical.sql` – `pg_trgm` + GIN trigram indexes
  - `013_fulltext.sql` – generated `fts` column + best-effort GIN index (skips if memory/permission issues)

Notes for managed DBs:
- If `create extension` is restricted, scripts continue (log NOTICE) and the app works with vector + trigram; enable FTS later for better snippets
- If `maintenance_work_mem` is low, the FTS index creation is wrapped; app continues without index

---

## Environment configuration

Server `.env` (see `server/env.example`):
- Core: `DATABASE_URL`, `PGSSL`, `JWT_SECRET`, `PORT`
- OpenAI: `OPENAI_API_KEY`, `OPENAI_EMBEDDING_MODEL` (default `text-embedding-3-small`), `OPENAI_CHAT_MODEL` (default `gpt-4o`)
- RAG tuning:
  - `CHAT_TOP_K=12`
  - `CHAT_SIM_THRESHOLD=0.20`
  - `CHAT_USE_RERANKER=false`
  - `CHAT_RERANK_MODEL=gpt-4o-mini`
  - `CHAT_USE_FTS=true` (default)

Frontend `.env`:
- `REACT_APP_API_BASE=https://<villy-backend>`

---

## Integration with Civilify (main chatbot app)

### Option A – Use Villy as RAG service (recommended quick win)

1) Auth between apps
- Simplest: create a service account in Villy; Civilify acquires a JWT via `/api/auth/login` (or add a shared HMAC header check in Villy)

2) Civilify calls Villy chat
- POST `https://<villy-backend>/api/chat`
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Body: `{ "question": "What is Rule 114 Section 20?" }`
- Response: `{ answer, sources }`

3) Display in Civilify UI
- Render `answer`; list `sources` with `title` + `canonical_citation`
- Link `entry_id` back to Villy viewer (`/entry/:entry_id`) or store the text locally

4) KB updates
- If Civilify needs to add/edit entries, call Villy’s `/api/kb/entries` to keep embeddings consistent; or replicate `buildEmbeddingText` and embed in Civilify (ensure vector dims match model)

### Option B – Embed RAG in Civilify backend (Spring Boot)

1) Database reuse
- Point Civilify to the same Postgres (shared `kb_entries`)
- Ensure `pgvector` and `pg_trgm` are enabled; add FTS (optional) per environment limits

2) Retrieval replication
- KNN: order by `embedding <=> $vector`, compute `similarity = 1 - distance`
- Trigram: use `%` and `similarity()` on `title`, `canonical_citation`, `text`
- FTS: `ts_rank_cd(fts, plainto_tsquery('english', q))` + `ts_headline(...)` for snippets
- Composite scoring (same weights) and regex fast-path

3) Prompt and answer
- Same guardrails (quote, no inference, cite parentheticals), temperature 0.0
- Optional reranker with a cheaper chat model

4) Embeddings and updates
- Either continue using Villy endpoints for KB writes, or implement the same embed pipeline in Civilify

---

## Tuning, observability, troubleshooting

Tuning:
- Adjust `CHAT_TOP_K` and `CHAT_SIM_THRESHOLD` (or add per-query tuning as in Villy)
- If DB supports, set `ivfflat.probes` to improve recall (e.g., 8–10)

Observability:
- Villy logs `[chat] retrieval { q, bestSim, usedLexical, topKReturned, top1: { entry_id, vectorSim, lexsim, ftsRank, finalScore } }`

Troubleshooting:
- 500 errors on FTS: ensure `fts` exists or set `CHAT_USE_FTS=false` temporarily
- 42883 on `similarity()`: enable `pg_trgm` and ensure explicit `::text` casts
- Missing vectors: run `npm run reindex`

---

## Appendix: curl example

Request:
```
curl -X POST https://<villy-backend>/api/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"question":"Rule 114 Section 20 burden of proof"}'
```

Response (truncated):
```
{
  "answer": "... (Rule 114 Sec. 20)",
  "sources": [
    {
      "entry_id": "ROC-Rule114-Sec20",
      "title": "...",
      "canonical_citation": "Rule 114, Section 20",
      "type": "rule_of_court",
      "similarity": 0.78,
      "lexsim": 0.61,
      "fts_rank": 0.42,
      "finalScore": 0.72
    }
  ]
}
```


