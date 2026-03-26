import { useState, useEffect } from 'react';

export interface PlayerStat {
  name: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fgPct: string;  // ex: "50%" ou "—"
  fg3Pct: string; // ex: "33%" ou "—"
  teamTricode: string;
}

function parsePct(raw: string): string {
  // raw = "12-24" ou "0-0"
  const parts = raw?.split('-');
  if (!parts || parts.length < 2) return '—';
  const made = parseInt(parts[0], 10);
  const att = parseInt(parts[1], 10);
  if (isNaN(made) || isNaN(att) || att === 0) return '—';
  return `${Math.round((made / att) * 100)}%`;
}

function parseBoxScore(json: any): { away: PlayerStat[]; home: PlayerStat[] } {
  const players: any[] = json?.boxscore?.players ?? [];
  const teams: PlayerStat[][] = [];

  for (const teamData of players) {
    const tricode = (teamData?.team?.abbreviation ?? '').toUpperCase();
    const stats0 = teamData?.statistics?.[0];
    if (!stats0) { teams.push([]); continue; }

    const names: string[] = (stats0.names ?? stats0.labels ?? stats0.keys ?? [])
      .map((k: string) => k.toUpperCase());

    const idx = (label: string) => names.indexOf(label);
    const ptsIdx = idx('PTS');
    const rebIdx = idx('REB');
    const astIdx = idx('AST');
    const stlIdx = idx('STL');
    const blkIdx = idx('BLK');
    const fgIdx  = idx('FG');
    const fg3Idx = idx('3PT');

    const getInt = (stats: string[], i: number) =>
      i >= 0 ? parseInt(stats[i] ?? '0', 10) || 0 : 0;

    const athletes: PlayerStat[] = (stats0.athletes ?? [])
      .filter((a: any) => !a.didNotPlay && a.stats?.length)
      .map((a: any): PlayerStat => ({
        name: a.athlete?.displayName ?? '',
        pts:    getInt(a.stats, ptsIdx),
        reb:    getInt(a.stats, rebIdx),
        ast:    getInt(a.stats, astIdx),
        stl:    getInt(a.stats, stlIdx),
        blk:    getInt(a.stats, blkIdx),
        fgPct:  fgIdx  >= 0 ? parsePct(a.stats[fgIdx])  : '—',
        fg3Pct: fg3Idx >= 0 ? parsePct(a.stats[fg3Idx]) : '—',
        teamTricode: tricode,
      }))
      .filter((a: PlayerStat) => a.name)
      .sort((a: PlayerStat, b: PlayerStat) => b.pts - a.pts);

    teams.push(athletes);
  }

  return { away: teams[0] ?? [], home: teams[1] ?? [] };
}

export function useGameStats(gameId: string | null) {
  const [home, setHome] = useState<PlayerStat[]>([]);
  const [away, setAway] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameId) {
      setHome([]);
      setAway([]);
      return;
    }
    setLoading(true);
    setHome([]);
    setAway([]);

    async function load() {
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${gameId}`,
          { signal: controller.signal },
        ).finally(() => clearTimeout(tid));

        if (res.ok) {
          const json = await res.json();
          const { home: h, away: a } = parseBoxScore(json);
          setHome(h);
          setAway(a);
        }
      } catch {}
      setLoading(false);
    }

    load();
  }, [gameId]);

  return { home, away, loading };
}
