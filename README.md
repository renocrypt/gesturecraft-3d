# GestureCraft 3D

Interactive 3D experience with hand-gesture recognition (MediaPipe) and a React Three Fiber scene.

## Local development

- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Preview build: `npm run preview`

## GitHub Pages deployment

This repo deploys via GitHub Actions to GitHub Pages.

- Workflow: `.github/workflows/pages.yml`
- Vite base path for project pages: `vite.config.ts` (uses `/gesturecraft-3d/` in production)

GitHub repo settings:
- Settings → Pages → Source: **GitHub Actions**

Deployed site:
- `https://renocrypt.github.io/gesturecraft-3d/`

## Notes / troubleshooting

- Camera access requires HTTPS (GitHub Pages is HTTPS) and user permission.
- If you see 404s for `/index.css` or `/vite.svg`, it usually means the site is being served under a repo subpath and needs the correct base path (handled by `vite.config.ts` for production builds).
