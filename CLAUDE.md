# ULTRA — Fitness Coaching App

## Stack technique
- **Frontend** : React 18 + Vite + React Router v6 + Tailwind CSS
- **Backend** : Express.js port 5001, base de données in-memory (`db = {}`)
- **State** : Zustand avec persist middleware (clé : `ultra-storage`)
- **Auth** : JWT via header `Authorization: Bearer`
- **3D** : Three.js via @react-three/fiber + @react-three/drei
- **Carte** : Leaflet + react-leaflet (tuiles CartoDB light_nolabels)

## Déploiement
- **Frontend** : Vercel → https://test-de-l-app-ultra.vercel.app
- **Backend** : Railway → https://test-de-l-app-ultra-production.up.railway.app
- **Variable d'env** : `VITE_API_URL` (switche dev/prod automatiquement)
- **GitHub** → push sur `main` → Vercel redéploie automatiquement

## CSS Variables (thème)
```
--bg-base, --bg-card, --bg-hover
--accent, --accent-subtle
--gold
--border, --border-soft
--text-primary, --text-secondary, --text-muted, --text-faint
--sidebar-bg, --sidebar-border
```

## Rôles utilisateurs
- `client` — athlète
- `coach` — coach sportif
- `nutritionist` — nutritionniste
- `health_pro` — professionnel de santé (kiné, ostéo, médecin du sport...)
- `admin`

## Routes principales
| Path | Composant |
|------|-----------|
| `/dashboard` | Dashboard (coach + client) |
| `/coach/programs` | CoachPrograms |
| `/coach/programs/new` | CoachProgramBuilder |
| `/clients` | Clients |
| `/analytics` | Analytics |
| `/revenue` | Revenue |
| `/calendar` | CalendarPage |
| `/progress` | Progress |
| `/muscles` | MuscleExplorer (3D) |
| `/discover` | Discover (carte Leaflet) |
| `/health` | HealthIntegrations |
| `/community` | Community |
| `/pro/dashboard` | HealthProDashboard |
| `/pro/patients` | HealthProPatients |
| `/health-access` | ClientHealthAccess |
| `/coach/sante` | CoachHealthRecords |
| `/nutri/dashboard` | NutriDashboard |

## Architecture mobile
- **< 768px** → bottom tab nav (4 liens + bouton "Plus")
- **>= 768px** → sidebar desktop collapsible (60px / 216px)
- `useIsMobile()` hook dans Sidebar.jsx ET App.jsx
- `<main>` a `minWidth:0, maxWidth:'100%', overflowX:'hidden'` pour éviter overflow

## Fichiers clés
- `frontend/src/components/Sidebar.jsx` — nav desktop + mobile bottom nav
- `frontend/src/App.jsx` — routing, Layout, isMobile
- `frontend/src/styles/global.css` — media queries @max-width:767px
- `frontend/src/data/muscles.js` — données anatomiques (ANATOMY, EXERCISE_DB, MUSCLES)
- `frontend/src/components/Body3D.jsx` — modèle 3D Three.js (lazy-loaded)
- `frontend/src/pages/MuscleExplorer.jsx` — Atlas Musculaire 3D universitaire
- `frontend/src/store/index.js` — Zustand store

## Ce qui a déjà été fait (historique complet)
1. **Mobile responsiveness** — bottom nav, grilles adaptatives sur toutes les pages
2. **Atlas Musculaire 3D** — Three.js rotatif 360°, fiches anatomiques niveau université (latin, origine, insertion, innervation)
3. **Espace Professionnel de Santé** — rôle `health_pro`, dossiers partagés coach ↔ kiné/médecin
4. **Discover** — carte Leaflet géolocalisée, filtres, experts à proximité
5. **CalendarPage** — redesign premium mobile-first avec dots colorés
6. **Labels nav mobile** — "Mon profil" → "Profil", "Mes programmes" → "Prog"
7. **Map minimaliste** — tuiles CartoDB light_nolabels (sans texte)
8. **Bug fix critique** — `<main>` sans min-width:0 causait overflow 3D Canvas

## Prochaines étapes prévues
- Migration Postgres sur Railway (actuellement in-memory = données perdues au redémarrage)
- Cloudinary pour les images (actuellement base64 en RAM)
- Amélioration modèle 3D (vrai .glb anatomique)

## Règles de développement
- Toujours tester le build (`npm run build`) avant de pousser
- Lazy-loader les chunks lourds (Three.js, modèles 3D) avec `lazy()` + `Suspense`
- Utiliser `minmax(0, 1fr)` dans les grilles CSS (pas `1fr` seul) pour éviter overflow
- Ne jamais mettre de `<style>` à l'intérieur d'un bloc JSX conditionnel
