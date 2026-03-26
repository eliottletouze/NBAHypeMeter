import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_KEYS from '../config/apiKeys';

const CACHE_TTL = 10 * 60_000; // 10 min
const BASE = 'https://api.balldontlie.io/v1';

export interface BDLPlayerStats {
  bdlPlayerId: number;
  playerName: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  tov: number;
  min: string;
}

export interface BDLSeasonAvg {
  bdlPlayerId: number;
  pts: number; reb: number; ast: number; stl: number; blk: number;
  fgm: number; fga: number; fg3m: number; fg3a: number; ftm: number; fta: number; tov: number;
}

export function calcTTFLScore(s: Pick<BDLPlayerStats, 'pts'|'reb'|'ast'|'stl'|'blk'|'fgm'|'fga'|'fg3m'|'fg3a'|'ftm'|'fta'|'tov'>): number {
  const twoMade    = s.fgm - s.fg3m;
  const twoMissed  = (s.fga - s.fg3a) - twoMade;
  const threeMissed = s.fg3a - s.fg3m;
  const ftMissed   = s.fta - s.ftm;

  let score = s.pts + s.reb + s.ast + s.stl + s.blk
    + twoMade + s.fg3m + s.ftm
    - twoMissed - threeMissed - ftMissed
    - s.tov;

  const doubles = [s.pts >= 10, s.reb >= 10, s.ast >= 10, s.stl >= 10, s.blk >= 10]
    .filter(Boolean).length;
  if (doubles >= 3) score += 3.0;
  else if (doubles >= 2) score += 1.5;

  return Math.round(score * 10) / 10;
}

function bdlFetch(path: string): Promise<Response> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 8000);
  return fetch(`${BASE}${path}`, {
    signal: controller.signal,
    headers: { Authorization: API_KEYS.ballDontLie },
  }).finally(() => clearTimeout(tid));
}

export function useBDLStats() {
  const [loading, setLoading] = useState(false);

  /**
   * Récupère les stats de box-score d'une date (YYYY-MM-DD).
   * Retourne une liste de stats par joueur.
   */
  const fetchDateStats = useCallback(async (date: string): Promise<BDLPlayerStats[]> => {
    if (!API_KEYS.ballDontLie) return [];
    const cacheKey = `@bdl_date_stats_${date}`;
    try {
      const raw = await AsyncStorage.getItem(cacheKey);
      if (raw) {
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_TTL) return data;
      }
    } catch {}

    setLoading(true);
    try {
      // 1. Récupérer les game IDs du jour
      const gRes = await bdlFetch(`/games?dates[]=${date}&per_page=15`);
      if (!gRes.ok) return [];
      const gJson = await gRes.json();
      const gameIds: number[] = (gJson.data ?? []).map((g: any) => g.id);
      if (gameIds.length === 0) return [];

      // 2. Récupérer les stats pour ces matchs
      const query = gameIds.map(id => `game_ids[]=${id}`).join('&');
      const sRes = await bdlFetch(`/stats?${query}&per_page=150`);
      if (!sRes.ok) return [];
      const sJson = await sRes.json();

      const stats: BDLPlayerStats[] = (sJson.data ?? [])
        .filter((s: any) => s.min && s.min !== '00' && s.min !== '0:00')
        .map((s: any): BDLPlayerStats => ({
          bdlPlayerId: s.player?.id ?? 0,
          playerName: `${s.player?.first_name ?? ''} ${s.player?.last_name ?? ''}`.trim(),
          pts: s.pts ?? 0, reb: s.reb ?? 0, ast: s.ast ?? 0,
          stl: s.stl ?? 0, blk: s.blk ?? 0,
          fgm: s.fgm ?? 0, fga: s.fga ?? 0,
          fg3m: s.fg3m ?? 0, fg3a: s.fg3a ?? 0,
          ftm: s.ftm ?? 0, fta: s.fta ?? 0,
          tov: s.turnover ?? 0,
          min: s.min ?? '0',
        }));

      await AsyncStorage.setItem(cacheKey, JSON.stringify({ data: stats, ts: Date.now() }));
      return stats;
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cherche l'ID BDL d'un joueur par son nom.
   */
  const findPlayerId = useCallback(async (name: string): Promise<number | null> => {
    if (!API_KEYS.ballDontLie) return null;
    const cacheKey = `@bdl_pid_${name.toLowerCase().replace(/\s+/g, '_')}`;
    try {
      const raw = await AsyncStorage.getItem(cacheKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    try {
      const res = await bdlFetch(`/players?search=${encodeURIComponent(name)}&per_page=5`);
      if (!res.ok) return null;
      const json = await res.json();
      const player = json.data?.[0];
      if (!player) return null;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(player.id));
      return player.id as number;
    } catch {
      return null;
    }
  }, []);

  /**
   * Moyennes de saison d'un joueur BDL.
   */
  const fetchSeasonAvg = useCallback(async (bdlPlayerId: number, season: number): Promise<BDLSeasonAvg | null> => {
    if (!API_KEYS.ballDontLie) return null;
    const cacheKey = `@bdl_avg_${bdlPlayerId}_${season}`;
    try {
      const raw = await AsyncStorage.getItem(cacheKey);
      if (raw) {
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_TTL) return data;
      }
    } catch {}
    try {
      const res = await bdlFetch(`/season_averages?season=${season}&player_ids[]=${bdlPlayerId}`);
      if (!res.ok) return null;
      const json = await res.json();
      const a = json.data?.[0];
      if (!a) return null;
      const avg: BDLSeasonAvg = {
        bdlPlayerId, pts: a.pts ?? 0, reb: a.reb ?? 0, ast: a.ast ?? 0,
        stl: a.stl ?? 0, blk: a.blk ?? 0, fgm: a.fgm ?? 0, fga: a.fga ?? 0,
        fg3m: a.fg3m ?? 0, fg3a: a.fg3a ?? 0, ftm: a.ftm ?? 0, fta: a.fta ?? 0,
        tov: a.turnover ?? 0,
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify({ data: avg, ts: Date.now() }));
      return avg;
    } catch {
      return null;
    }
  }, []);

  return { fetchDateStats, findPlayerId, fetchSeasonAvg, loading };
}
