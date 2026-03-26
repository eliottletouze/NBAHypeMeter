import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calcTTFLScore, BDLPlayerStats } from './useBDLStats';

const PICKS_KEY     = '@ttfl_picks_v2';
const LEAGUE_KEY    = '@ttfl_leagues_v1';
const PSEUDO_KEY    = '@ttfl_pseudo_v1';
const COOLDOWN_DAYS = 30;

// ── Types exportés (interfaces clean pour future migration backend) ──────────

export interface TTFLStats {
  pts: number; reb: number; ast: number; stl: number; blk: number;
  fgm: number; fga: number; fg3m: number; fg3a: number;
  ftm: number; fta: number; tov: number;
  ttflScore: number;
  isDoubleDouble: boolean;
  isTripleDouble: boolean;
}

export interface TTFLPick {
  date: string;         // "YYYY-MM-DD"
  playerId: string;     // nom normalisé (clé cooldown)
  playerName: string;
  playerTeam: string;
  opponent: string;
  stats: TTFLStats | null;
  lockedAt: number;     // timestamp du lock
}

export interface TTFLLeagueMember {
  id: string;
  pseudo: string;
  isMe: boolean;
  // picks visibles seulement après la deadline du jour
  picks: Record<string, { playerName: string; score: number | null }>;
}

export interface TTFLLeague {
  code: string;     // 6 caractères
  name: string;
  members: TTFLLeagueMember[];
  createdAt: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round(Math.abs(db.getTime() - da.getTime()) / 86_400_000);
}

function genCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function normalizeId(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '_');
}

function statsFromBDL(raw: BDLPlayerStats): TTFLStats {
  const twoMade    = raw.fgm - raw.fg3m;
  const twoMissed  = (raw.fga - raw.fg3a) - twoMade;
  const threeMissed = raw.fg3a - raw.fg3m;
  const ftMissed   = raw.fta - raw.ftm;
  let score = raw.pts + raw.reb + raw.ast + raw.stl + raw.blk
    + twoMade + raw.fg3m + raw.ftm
    - twoMissed - threeMissed - ftMissed
    - raw.tov;
  const doubles = [raw.pts >= 10, raw.reb >= 10, raw.ast >= 10, raw.stl >= 10, raw.blk >= 10]
    .filter(Boolean).length;
  const isTripleDouble = doubles >= 3;
  const isDoubleDouble = doubles >= 2 && !isTripleDouble;
  if (isTripleDouble) score += 3.0;
  else if (isDoubleDouble) score += 1.5;
  return {
    pts: raw.pts, reb: raw.reb, ast: raw.ast, stl: raw.stl, blk: raw.blk,
    fgm: raw.fgm, fga: raw.fga, fg3m: raw.fg3m, fg3a: raw.fg3a,
    ftm: raw.ftm, fta: raw.fta, tov: raw.tov,
    ttflScore: Math.round(score * 10) / 10,
    isDoubleDouble, isTripleDouble,
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useTTFL() {
  const [picks, setPicks]   = useState<TTFLPick[]>([]);
  const [leagues, setLeagues] = useState<TTFLLeague[]>([]);
  const [pseudo, setPseudo] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function hydrate() {
      try {
        const [rPicks, rLeagues, rPseudo] = await Promise.all([
          AsyncStorage.getItem(PICKS_KEY),
          AsyncStorage.getItem(LEAGUE_KEY),
          AsyncStorage.getItem(PSEUDO_KEY),
        ]);
        if (rPicks)   setPicks(JSON.parse(rPicks));
        if (rLeagues) setLeagues(JSON.parse(rLeagues));
        if (rPseudo)  setPseudo(JSON.parse(rPseudo));
      } catch {}
      setLoaded(true);
    }
    hydrate();
  }, []);

  const persistPicks = useCallback(async (next: TTFLPick[]) => {
    try { await AsyncStorage.setItem(PICKS_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const persistLeagues = useCallback(async (next: TTFLLeague[]) => {
    try { await AsyncStorage.setItem(LEAGUE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  // ── Cooldown ────────────────────────────────────────────────────────────────

  const cooldownDaysLeft = useCallback((playerName: string): number => {
    const pid = normalizeId(playerName);
    const today = todayStr();
    const lastPick = picks
      .filter(p => p.playerId === pid && p.date < today)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!lastPick) return 0;
    const diff = daysBetween(lastPick.date, today);
    return Math.max(0, COOLDOWN_DAYS - diff);
  }, [picks]);

  // ── Today's pick ────────────────────────────────────────────────────────────

  const todayPick = picks.find(p => p.date === todayStr()) ?? null;

  const makePick = useCallback((
    playerName: string,
    playerTeam: string,
    opponent: string,
    lockedAt: number,
  ): { ok: boolean; error?: string } => {
    const today = todayStr();
    if (cooldownDaysLeft(playerName) > 0) {
      return { ok: false, error: `${playerName} est en cooldown` };
    }
    const pick: TTFLPick = {
      date: today,
      playerId: normalizeId(playerName),
      playerName, playerTeam, opponent,
      stats: null,
      lockedAt,
    };
    setPicks(prev => {
      const next = [pick, ...prev.filter(p => p.date !== today)];
      persistPicks(next);
      return next;
    });
    return { ok: true };
  }, [cooldownDaysLeft, persistPicks]);

  const cancelPick = useCallback((isPastDeadline: boolean) => {
    if (isPastDeadline) return;
    setPicks(prev => {
      const next = prev.filter(p => p.date !== todayStr());
      persistPicks(next);
      return next;
    });
  }, [persistPicks]);

  // ── Score update (après le match) ──────────────────────────────────────────

  const updatePickStats = useCallback((date: string, rawStats: BDLPlayerStats) => {
    setPicks(prev => {
      const next = prev.map(p => {
        if (p.date !== date) return p;
        return { ...p, stats: statsFromBDL(rawStats) };
      });
      persistPicks(next);
      return next;
    });
  }, [persistPicks]);

  // ── Saison stats ────────────────────────────────────────────────────────────

  const seasonTotal = picks
    .filter(p => p.stats !== null)
    .reduce((acc, p) => acc + (p.stats?.ttflScore ?? 0), 0);

  const last7Avg = (() => {
    const recent = picks
      .filter(p => p.stats !== null)
      .slice(0, 7);
    if (recent.length === 0) return 0;
    return Math.round((recent.reduce((a, p) => a + (p.stats?.ttflScore ?? 0), 0) / recent.length) * 10) / 10;
  })();

  const streak = (() => {
    let s = 0;
    for (const p of picks) {
      if (!p.stats) continue;
      if (p.stats.ttflScore >= 25) s++;
      else break;
    }
    return s;
  })();

  const hallOfShame = picks
    .filter(p => p.stats !== null)
    .sort((a, b) => (a.stats?.ttflScore ?? 0) - (b.stats?.ttflScore ?? 0))
    .slice(0, 3);

  // ── Pseudo ──────────────────────────────────────────────────────────────────

  const savePseudo = useCallback(async (name: string) => {
    setPseudo(name);
    try { await AsyncStorage.setItem(PSEUDO_KEY, JSON.stringify(name)); } catch {}
  }, []);

  // ── Ligue ───────────────────────────────────────────────────────────────────

  const createLeague = useCallback((name: string): TTFLLeague => {
    const league: TTFLLeague = {
      code: genCode(),
      name,
      members: [{
        id: 'me',
        pseudo: pseudo || 'Moi',
        isMe: true,
        picks: picks.reduce((acc, p) => {
          if (p.stats) acc[p.date] = { playerName: p.playerName, score: p.stats.ttflScore };
          return acc;
        }, {} as Record<string, { playerName: string; score: number | null }>),
      }],
      createdAt: Date.now(),
    };
    const next = [...leagues, league];
    setLeagues(next);
    persistLeagues(next);
    return league;
  }, [leagues, picks, pseudo, persistLeagues]);

  const addMemberToLeague = useCallback((code: string, memberPseudo: string) => {
    setLeagues(prev => {
      const next = prev.map(l => {
        if (l.code !== code) return l;
        if (l.members.some(m => m.pseudo === memberPseudo)) return l;
        return {
          ...l,
          members: [...l.members, {
            id: `member_${Date.now()}`,
            pseudo: memberPseudo,
            isMe: false,
            picks: {},
          }],
        };
      });
      persistLeagues(next);
      return next;
    });
  }, [persistLeagues]);

  const deleteLeague = useCallback((code: string) => {
    setLeagues(prev => {
      const next = prev.filter(l => l.code !== code);
      persistLeagues(next);
      return next;
    });
  }, [persistLeagues]);

  return {
    picks,
    todayPick,
    loaded,
    makePick,
    cancelPick,
    updatePickStats,
    cooldownDaysLeft,
    seasonTotal: Math.round(seasonTotal * 10) / 10,
    last7Avg,
    streak,
    hallOfShame,
    leagues,
    createLeague,
    addMemberToLeague,
    deleteLeague,
    pseudo,
    savePseudo,
  };
}
