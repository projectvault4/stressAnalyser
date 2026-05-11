# Render Deployment

This project runs as one Render Web Service. Flask serves both the API and the
built React frontend from `frontend/dist`.

## Render Settings

Create or update the Render Web Service with these settings:

```text
Build Command: pip install -r requirements.txt && npm run build
Start Command: gunicorn api.app:app
Health Check Path: /health
```

If Render is pointed at the parent folder, set:

```text
Root Directory: stress-detector-ml-project
```

If Render is already pointed directly at this project folder, leave Root
Directory blank.

Do not set `VITE_API_BASE_URL` for this Render-only setup. Leaving it unset
makes the React app call same-origin endpoints like `/predict`, which are
served by the same Flask app.

After pushing changes, redeploy on Render without build cache.

## Verify The Deploy

Check the live service:

```bash
curl -s https://stress-detector-api-yhx4.onrender.com/health
```

The response must include:

```json
{"api_version":"2026-05-11-stress-score-v4"}
```

Then submit a prediction and confirm the `factors` keys use the current labels:

```text
Sleep strain, Academic pressure, Mental strain, Social pressure, Lifestyle strain
```

If `/health` does not include `api_version`, or the app shows a stale-backend
warning, Render is still serving older code. Check the Render branch, root
directory, build logs, and whether `VITE_API_BASE_URL` was accidentally set.
