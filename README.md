# NBA Hype Meter 🏀

Sais-tu si le match d'hier vaut le coup en replay — **sans spoiler le score**.

## Lancement

```bash
# Installer les dépendances
npm install

# Démarrer l'app
npx expo start
```

Scanne le QR code avec **Expo Go** (iOS/Android) ou lance sur simulateur :

```bash
npx expo start --ios       # Simulateur iOS
npx expo start --android   # Émulateur Android
```

## Fonctionnalités

- **Score de hype /10** calculé à partir de l'écart, des prolongations, de l'intensité offensive
- **Zéro spoiler** — les scores ne sont jamais affichés
- **Joueurs favoris** — ajoute tes stars et vois leur impact sur le score de hype
- **Badges** 🔥 Match serré / ⏱️ OT possible / ⭐ Ton joueur est là
- **Données NBA live** via l'API officielle `cdn.nba.com`, avec fallback offline

## Stack

- React Native + Expo SDK 55
- Expo Router (file-based navigation)
- React Native Reanimated (animations)
- AsyncStorage (persistence joueurs favoris)
- TypeScript
