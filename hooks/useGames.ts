import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

export interface GameData {
  gameId: string;
  homeTeam: { teamTricode: string; teamName: string; score: number; logo?: string };
  awayTeam: { teamTricode: string; teamName: string; score: number; logo?: string };
  gameStatus: number; // 1 = à venir, 2 = en cours, 3 = terminé
  gameStatusText: string;
  gameTime?: string; // heure locale pour les matchs pas encore joués
}

const FALLBACK_GAMES: GameData[] = [
  { gameId: 'fb1', homeTeam: { teamTricode: 'BOS', teamName: 'Celtics', score: 118 }, awayTeam: { teamTricode: 'NYK', teamName: 'Knicks', score: 115 }, gameStatus: 3, gameStatusText: 'Final' },
  { gameId: 'fb2', homeTeam: { teamTricode: 'LAL', teamName: 'Lakers', score: 127 }, awayTeam: { teamTricode: 'GSW', teamName: 'Warriors', score: 124 }, gameStatus: 3, gameStatusText: 'Final' },
  { gameId: 'fb3', homeTeam: { teamTricode: 'DEN', teamName: 'Nuggets', score: 135 }, awayTeam: { teamTricode: 'OKC', teamName: 'Thunder', score: 129 }, gameStatus: 3, gameStatusText: 'Final' },
  { gameId: 'fb4', homeTeam: { teamTricode: 'MIL', teamName: 'Bucks', score: 105 }, awayTeam: { teamTricode: 'MIA', teamName: 'Heat', score: 98 }, gameStatus: 3, gameStatusText: 'Final' },
  { gameId: 'fb5', homeTeam: { teamTricode: 'PHX', teamName: 'Suns', score: 112 }, awayTeam: { teamTricode: 'DAL', teamName: 'Mavericks', score: 109 }, gameStatus: 3, gameStatusText: 'Final' },
];

export function getDateFromDaysAgo(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

export function formatDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

export function formatDateLabel(d: Date, daysAgo: number): string {
  if (daysAgo === 0) return "Aujourd'hui";
  if (daysAgo === 1) return 'Hier';
  if (daysAgo === -1) return 'Demain';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ESPN uses shorter abbreviations for some teams — map them to NBA tricodes
const ESPN_TO_NBA: Record<string, string> = {
  GS: 'GSW',
  SA: 'SAS',
  NO: 'NOP',
  NY: 'NYK',
  UTAH: 'UTA',
};
function toTricode(abbr: string): string {
  return ESPN_TO_NBA[abbr] ?? abbr;
}

// ESPN public scoreboard API — has native CORS headers, no proxy needed
function buildEspnUrl(dateStr: string): string {
  return `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`;
}

function parseEspnGames(json: any): GameData[] {
  return (json?.events ?? [])
    .map((e: any) => {
      const comp = e.competitions?.[0];
      if (!comp) return null;
      const home = comp.competitors?.find((c: any) => c.homeAway === 'home');
      const away = comp.competitors?.find((c: any) => c.homeAway === 'away');
      if (!home || !away) return null;

      const completed = comp.status?.type?.completed === true;
      const statusName: string = comp.status?.type?.name ?? '';
      const isLive = statusName.includes('IN_PROGRESS') || statusName.includes('HALF');

      let gameStatus = 1;
      if (completed) gameStatus = 3;
      else if (isLive) gameStatus = 2;

      let gameTime: string | undefined;
      if (gameStatus !== 3 && e.date) {
        const d = new Date(e.date);
        gameTime = d.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Paris',
        });
      }

      return {
        gameId: String(e.id),
        homeTeam: {
          teamTricode: toTricode(home.team.abbreviation),
          teamName: home.team.shortDisplayName ?? home.team.name,
          score: completed ? Number(home.score) : 0,
          logo: home.team.logo,
        },
        awayTeam: {
          teamTricode: toTricode(away.team.abbreviation),
          teamName: away.team.shortDisplayName ?? away.team.name,
          score: completed ? Number(away.score) : 0,
          logo: away.team.logo,
        },
        gameStatus,
        gameStatusText: comp.status?.type?.shortDetail ?? (completed ? 'Final' : 'À venir'),
        gameTime,
      };
    })
    .filter(Boolean) as GameData[];
}

// Build a list of URLs to try for a given NBA API URL (direct + proxies for non-web)
function buildNbaUrls(nbaUrl: string): string[] {
  if (Platform.OS !== 'web') return [nbaUrl];
  // On web, NBA CDN blocks proxies — these are kept as last-resort fallbacks
  return [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(nbaUrl)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(nbaUrl)}`,
  ];
}

function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

async function tryFetch(urls: string[], parse: (json: any) => GameData[]): Promise<GameData[]> {
  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(url, 6000);
      if (!res.ok) continue;
      const json = await res.json();
      const games = parse(json);
      if (games.length > 0) return games; // inclut matchs à venir et terminés
    } catch {}
  }
  return [];
}

function parseNbaNetGames(json: any): GameData[] {
  return (json?.games ?? [])
    .filter((g: any) => g.statusNum === 3)
    .map((g: any) => ({
      gameId: g.gameId,
      homeTeam: { teamTricode: g.hTeam.triCode, teamName: g.hTeam.triCode, score: Number(g.hTeam.score) },
      awayTeam: { teamTricode: g.vTeam.triCode, teamName: g.vTeam.triCode, score: Number(g.vTeam.score) },
      gameStatus: 3,
      gameStatusText: 'Final',
    }));
}

function parseCdnGames(json: any): GameData[] {
  return (json?.scoreboard?.games ?? [])
    .filter((g: any) => g.gameStatus === 3)
    .map((g: any) => ({
      gameId: g.gameId,
      homeTeam: { teamTricode: g.homeTeam.teamTricode, teamName: g.homeTeam.teamName, score: Number(g.homeTeam.score) },
      awayTeam: { teamTricode: g.awayTeam.teamTricode, teamName: g.awayTeam.teamName, score: Number(g.awayTeam.score) },
      gameStatus: 3,
      gameStatusText: 'Final',
    }));
}

export function useGames(daysAgo: number) {
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setGames([]);
    setUsingFallback(false);

    async function load() {
      const date = getDateFromDaysAgo(daysAgo);
      const dateStr = formatDateString(date);

      // Sources tried in order. ESPN goes first on web (native CORS, no proxy needed).
      const sources: [string[], (j: any) => GameData[]][] = [
        // ESPN — works on web natively
        [[buildEspnUrl(dateStr)], parseEspnGames],
        // NBA endpoints (direct on native, proxied on web as fallback)
        [buildNbaUrls(`https://data.nba.net/10s/prod/v1/${dateStr}/scoreboard.json`), parseNbaNetGames],
        [buildNbaUrls(`https://cdn.nba.com/static/json/liveData/scoreboard/${dateStr}_scoreboard.json`), parseCdnGames],
        ...(daysAgo === 0 ? [[buildNbaUrls(`https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json`), parseCdnGames]] as [string[], (j: any) => GameData[]][] : []),
      ];

      for (const [urls, parse] of sources) {
        const result = await tryFetch(urls, parse);
        if (cancelled) return;
        if (result.length > 0) {
          setGames(result);
          setLoading(false);
          return;
        }
      }

      if (!cancelled) {
        setGames(FALLBACK_GAMES);
        setUsingFallback(true);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [daysAgo]);

  return { games, loading, usingFallback };
}
