import { Player } from '../data/players';

export interface HypeBreakdown {
  closenessScore: number;
  overtimeScore: number;
  intensityScore: number;
  playerScores: { player: Player; score: number; isPresent: boolean }[];
  total: number;
  verdict: string;
  verdictEmoji: string;
  summary: string;
}

function closenessScore(diff: number): number {
  if (diff <= 3) return 10;
  if (diff <= 6) return 9;
  if (diff <= 10) return 7;
  if (diff <= 15) return 5;
  if (diff <= 20) return 3;
  return 1;
}

function overtimeScore(diff: number): number {
  return diff <= 4 ? 10 : 0;
}

function intensityScore(totalPoints: number): number {
  if (totalPoints >= 270) return 9;
  if (totalPoints >= 250) return 7;
  if (totalPoints >= 230) return 5;
  return 4;
}

function isPlayerInGame(player: Player, homeTeamAbbr: string, awayTeamAbbr: string): boolean {
  return player.team === homeTeamAbbr || player.team === awayTeamAbbr;
}

function simulatePlayerScore(player: Player, diff: number): number {
  const isTight = diff <= 10;
  if (player.isStar) {
    return isTight
      ? Math.floor(Math.random() * 3) + 8 // 8-10
      : Math.floor(Math.random() * 3) + 6; // 6-8
  } else {
    return isTight
      ? Math.floor(Math.random() * 3) + 6 // 6-8
      : Math.floor(Math.random() * 3) + 4; // 4-6
  }
}

export function computeHype(
  homeScore: number,
  awayScore: number,
  homeTeamAbbr: string,
  awayTeamAbbr: string,
  favoritePlayers: Player[]
): HypeBreakdown {
  const diff = Math.abs(homeScore - awayScore);
  const totalPoints = homeScore + awayScore;

  const closeness = closenessScore(diff);
  const overtime = overtimeScore(diff);
  const intensity = intensityScore(totalPoints);

  const playerScores = favoritePlayers.map((player) => {
    const isPresent = isPlayerInGame(player, homeTeamAbbr, awayTeamAbbr);
    const score = isPresent ? simulatePlayerScore(player, diff) : 0;
    return { player, score, isPresent };
  });

  let total: number;

  const presentScores = playerScores.filter((ps) => ps.isPresent);

  if (presentScores.length > 0) {
    // Average only the players who actually play in this game
    const avgPlayerScore = presentScores.reduce((sum, ps) => sum + ps.score, 0) / presentScores.length;
    total = closeness * 0.35 + overtime * 0.2 + intensity * 0.2 + avgPlayerScore * 0.25;
  } else {
    // No favorite in this game → weights without player component
    total = closeness * 0.45 + overtime * 0.25 + intensity * 0.3;
  }

  total = Math.min(10, Math.max(0, Math.round(total * 10) / 10));

  let verdict: string;
  let verdictEmoji: string;

  if (total >= 8) {
    verdict = 'À VOIR ABSOLUMENT';
    verdictEmoji = '🔥';
  } else if (total >= 6) {
    verdict = 'VAUT LE DÉTOUR';
    verdictEmoji = '👍';
  } else if (total >= 4) {
    verdict = 'PEUT-ÊTRE';
    verdictEmoji = '🤔';
  } else {
    verdict = 'PASSE TON TOUR';
    verdictEmoji = '💤';
  }

  const summary = buildSummary(diff, totalPoints, playerScores);

  return {
    closenessScore: closeness,
    overtimeScore: overtime,
    intensityScore: intensity,
    playerScores,
    total,
    verdict,
    verdictEmoji,
    summary,
  };
}

function buildSummary(
  diff: number,
  totalPoints: number,
  playerScores: { player: Player; score: number; isPresent: boolean }[]
): string {
  const parts: string[] = [];

  if (diff <= 3) {
    parts.push('Un duel haletant jusqu\'au dernier souffle — chaque possession comptait.');
  } else if (diff <= 6) {
    parts.push('Un match accroché, décidé dans les dernières minutes.');
  } else if (diff <= 10) {
    parts.push('Une rencontre serrée avec de nombreux rebondissements.');
  } else if (diff <= 20) {
    parts.push('Un écart qui s\'est creusé progressivement, quelques séquences intéressantes.');
  } else {
    parts.push('Une domination nette — peu de suspense au tableau de bord.');
  }

  if (totalPoints >= 270) {
    parts.push('Les deux équipes ont affiché une attaque de feu ce soir.');
  } else if (totalPoints >= 250) {
    parts.push('Bonne activité offensive des deux côtés.');
  }

  const presentPlayers = playerScores.filter((ps) => ps.isPresent && ps.score >= 7);
  if (presentPlayers.length > 0) {
    const names = presentPlayers.map((ps) => ps.player.name).join(' et ');
    parts.push(`${names} a/ont été dans un grand soir.`);
  }

  return parts.join(' ');
}
