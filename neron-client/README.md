# Néron · Client UI

Interface locale de l'assistant Néron. Construit avec Next.js 15, React 19, Tailwind v4, TypeScript.

## Structure

```
.
├── app/
│   ├── globals.css        # Tailwind v4 + variables CSS Néron
│   ├── layout.tsx         # Root layout (fonts Sora + JetBrains Mono, metadata)
│   └── page.tsx           # Entrée principale → PhoneShell
├── components/
│   ├── PhoneShell.tsx     # Conteneur téléphone + logique de toggle (client)
│   ├── StatusBar.tsx      # Heure animée + météo (client)
│   ├── FlightCard.tsx     # Card glassmorphisme infos vol (server)
│   ├── AssistantBar.tsx   # Footer prompt + input simulé (server)
│   └── NavBar.tsx         # Navigation 4 boutons avec état actif (client)
├── hooks/
│   └── useTime.ts         # Hook d'horloge temps réel (remplace time.js)
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

## Migration depuis l'ancienne version

### Supprimer les fichiers obsolètes

```bash
# Supprimer le Pages Router (migré vers App Router)
rm -rf pages/

# Supprimer le CSS statique (migré vers Tailwind)
rm public/style.css

# Supprimer les scripts vanilla JS (migrés en composants React)
rm -rf public/js/
```

### Installer et lancer

```bash
npm install
npm run dev
```

## Ce qui a changé

| Avant | Après |
|---|---|
| `next@16.2.2` (inexistant) | `next@^15.2.0` |
| Dual router (app/ + pages/) | App Router uniquement |
| `public/style.css` statique | Tailwind v4 inline |
| `time.js` vanilla | Hook `useTime` React |
| `toggle.js` vanilla | `useState` dans PhoneShell |
| `script.js` injecté via useEffect | Logique en composants |
| `window.toggleSection` non typé | TypeScript strict |
| Leaflet/MapKit chargés inutilement | Placeholder propre |
| Material Icons CDN (inutilisés) | SVG inline accessibles |
| Boutons nav vides | NavBar avec état actif |

## Connecter l'API Néron

Dans `components/AssistantBar.tsx`, la barre d'input est actuellement simulée.
Pour la connecter au backend :

```tsx
// Exemple : remplacer l'input simulé par un vrai form
const handleSend = async (message: string) => {
  const res = await fetch("http://homebox:PORT/api/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  // ...
};
```
