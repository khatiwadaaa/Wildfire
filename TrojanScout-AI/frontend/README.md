# TrojanScout AI

A responsive basketball scouting and recruiting frontend built with React, Vite, TypeScript, Tailwind CSS, React Router, Recharts, Lucide React, and Axios. The MVP ships with synthetic demonstration data and a centralized API adapter designed for a FastAPI backend.

## Requirements
- Node.js 18.18+ (Node 20+ recommended)
- npm

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open the Vite URL printed in your terminal (normally http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview
```

## Environment

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_USE_MOCK_API=true
```

- `VITE_USE_MOCK_API=true`: player directory, profile, comparison and video analysis use synthetic demo data.
- `VITE_USE_MOCK_API=false`: the API adapter calls the FastAPI service at `VITE_API_BASE_URL`.

The mock switch is centralized in `src/lib/api.ts`. UI pages call the same adapter in either mode; keep production recommendation/scoring logic in the backend.

## Included MVP functionality

- Dashboard with roster and recruiting overview, pipeline chart, activity sample, and replacement-match table.
- Player directory with name/school search, position/category filters, stat sorting, add-player modal, CSV import affordance, and detailed player profile pages.
- Video analysis with MP4 upload/drop, HTML5 playback, paused-frame click selection, normalized coordinate capture, overlay layer, tracking status, metrics panel, and export affordance. Mock results are explicitly marked as synthetic. The video overlay uses a fixed 16:9 normalized SVG viewBox with `preserveAspectRatio="xMidYMid meet"`; the click handler calculates the actual contained video rectangle to account for letterboxing. Production frames should use normalized video coordinates.
- Recruit comparison with one graduating-athlete reference, up to five recruit candidates, skill-weight controls, radar visualization, backend-owned similarity scores, and evaluation context.
- Roster gap simulator with departure/recruit selection and clearly labeled estimates.
- Scouting report view with data completeness, strengths/weaknesses, role context, and browser print-to-PDF.

## Frontend structure

```text
src/
  components/       # shared UI can be extracted here as the app grows
  data/mockPlayers.ts
  lib/api.ts        # centralized Axios client and mock/live adapters
  pages/            # route-level pages are currently composed in App.tsx
  types/index.ts    # backend-facing TypeScript contracts
  App.tsx
  index.css
  main.tsx
```

The page components are kept together in `App.tsx` for hackathon iteration speed. As the product grows, move each route into `src/pages/` and extract shared components from the same file.

## Proposed FastAPI contracts

All paths below are relative to `VITE_API_BASE_URL`. The frontend types are in `src/types/index.ts`. Adapt serializers in `src/lib/api.ts` if the backend chooses different naming conventions.

### `GET /players`
Returns `Player[]`.

```json
[{"id":"p-101","name":"Jalen Brooks","school":"Northern State","position":"PG","height":"6'2\"","gradYear":2027,"category":"Prospective Recruit","ppg":16.1,"apg":6.2,"rpg":3.8,"fgPct":48.1,"threePct":35.4,"spg":2.0,"bpg":0.1,"topg":2.4,"games":29,"minutes":32.1,"strengths":["Live-dribble passing"],"weaknesses":["Pull-up consistency"],"notes":"Lead guard profile."}]
```

### `POST /players`
Request: a `Player` payload (server assigns `id`). Response: created `Player`.

### `GET /players/{id}`
Response: one `Player`.

### `POST /players/import`
Recommended request: `multipart/form-data` with `file` (CSV). Response should include `created`, `skipped`, and row-level validation errors. The current UI provides the CSV selection affordance; wire this endpoint in `playerApi` when the backend import contract is finalized.

### `POST /videos/analyze`
Recommended request: `multipart/form-data` with `file` (video), `selection` (JSON: `{ "x": 0.52, "y": 0.41, "timestamp": 12.4 }`). Response: `VideoAnalysis` or an asynchronous job object containing `id`, `status`, and `progress`. For longer jobs, return `202` and poll `GET /videos/{id}/results`.

Example tracking response:

```json
{"id":"analysis-1","filename":"game.mp4","status":"Completed","progress":100,"frames":[{"timestamp":12.4,"boxes":[{"x":0.45,"y":0.22,"width":0.08,"height":0.19,"label":"tracked-player","selected":true}]}],"metrics":{"distance":2.8,"topSpeed":16.4,"possessions":18,"minutesTracked":4.2}}
```

Tracking box coordinates should be normalized (0–1) against the original video frame. The UI should draw them over the video content rectangle, not the letterboxed player element. Add a polling/subscription loop and render returned `frames` at the matching playback timestamp when the backend response format is finalized.

### `GET /videos/{id}/results`
Response: latest `VideoAnalysis` including `status`, `progress`, timestamped `frames`, optional metrics, and optional annotated-video export URL. A production export button should only be enabled when a real export URL is returned.

### `POST /comparisons`
Request:

```json
{"reference_id":"p-101","candidate_ids":["p-201","p-202"],"weights":{"scoring":30,"playmaking":30,"defense":20,"rebounds":10,"shooting":10}}
```

Response: `ComparisonResult` with `id`, `referenceId`, `candidateIds`, `similarityByPlayer` (backend-generated scores), and per-player explanation data.

### `GET /comparisons/{id}/report`
Response: `ScoutingReport` including `playerId`, summary, strengths, weaknesses, roleFit, completeness, and timestamped evidence. The report page currently demonstrates a local report template; replace the synthetic report content with this response for live mode.

## Important implementation notes

- The current mock player records and demonstration video metrics are synthetic and must not be represented as real scouting results.
- Frontend radar values are visual normalized stat indicators only. Final candidate similarity is received from `comparisonApi` and must be calculated by the backend.
- The current video adapter returns a clearly labeled mock response for local UI development. It does not perform computer vision or infer player identity.
- Before production, implement authenticated API access, upload limits, polling or WebSocket progress, robust error/loading states, schema validation, real CSV ingestion, and export URL handling.
