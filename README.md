# NBA Hype Meter 🏀

Une app mobile pour savoir si un match NBA vaut le coup en replay — **sans spoiler le score** — avec un système de paris virtuels et le TTFL intégré.

## Fonctionnalités

### 🏀 Hype Meter
- **Score de hype /10** calculé à partir de l'écart, des prolongations et de l'intensité offensive
- **Zéro spoiler** — les scores ne sont jamais affichés
- **Joueurs favoris** — ajoute tes stars et vois leur impact sur le match
- **Badges** 🔥 Match serré / ⏱️ OT possible / ⭐ Ton joueur est là
- **Swipe gauche/droite** pour naviguer entre les jours
- **Résultat détaillé** avec stats compètes des joueurs favoris (sans spoiler avant de cliquer)

### 🎰 Paris virtuels
- Paris en **Coins 💰** — solde virtuel, aucun argent réel
- **3 marchés** : Vainqueur / Handicap / Totaux (Over-Under)
- **Combinés** jusqu'à 5 sélections
- **Cotes réelles** via ESPN (gratuit) et The Odds API / Unibet (optionnel, clé requise)
- **Résolution automatique** des paris quand un match se termine
- **Historique** avec statistiques (taux de réussite, bilan)
- Paris bloqués pour les matchs passés

### ⭐ TTFL (TrashTalk Fantasy League)
- **Formule officielle TTFL** : PTS+REB+AST+STL+BLK + tirs réussis − tirs manqués − TOV + bonus DD/TD
- **Cooldown 30 jours** par joueur
- **Deadline automatique** basée sur l'heure du premier match du soir
- **Stats en direct** rafraîchies toutes les 2 minutes
- **Calendrier mensuel** avec score par jour
- **Ligues privées** : génère un code à 6 caractères à partager avec tes amis
- Données via BallDontLie API (clé requise)

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

## Configuration API (optionnel)

L'app fonctionne sans clé API. Pour activer les données en temps réel, renseigne tes clés dans `config/apiKeys.ts` :

```ts
const API_KEYS = {
  theOddsApi: '',   // https://the-odds-api.com  (500 req/mois gratuit)
  ballDontLie: '',  // https://balldontlie.io     (clé requise, 60 req/min)
};
```

| Clé | Usage | Sans clé |
|-----|-------|----------|
| `theOddsApi` | Cotes Unibet/Betclic en temps réel | Cotes ESPN ou générées |
| `ballDontLie` | Stats TTFL officielles | TTFL indisponible |

## Stack

- **React Native** + Expo SDK 55
- **Expo Router** (navigation par fichiers, 3 tabs)
- **React Native Reanimated v4** (animations, swipe)
- **React Native Gesture Handler v2** (gestes)
- **AsyncStorage** (persistence locale)
- **TypeScript**
- ESPN API (gratuit, sans clé)
- The Odds API / Unibet (optionnel)
- BallDontLie API (TTFL)
