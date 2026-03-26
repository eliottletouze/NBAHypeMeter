// ─── Clés API ────────────────────────────────────────────────────────────────
// Renseignez vos clés ci-dessous pour activer les données en temps réel.
// Sans clé, l'application fonctionne avec des données fictives plausibles.
//
//  The Odds API  → https://the-odds-api.com   (plan gratuit : 500 req/mois)
//  BallDontLie   → https://balldontlie.io     (plan gratuit : clé requise, 60 req/min)
// ─────────────────────────────────────────────────────────────────────────────

const API_KEYS = {
  theOddsApi: '',  // ex : "abc123def456..."
  ballDontLie: '', // ex : "xyz789..."
} as const;

export default API_KEYS;
