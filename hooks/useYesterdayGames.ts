import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

const CORS_PROXY = 'https://corsproxy.io/?url=';

export interface GameData {
  gameId: string;
  homeTeam: {
    teamTricode: string;
    teamName: string;
    score: number;
  };
  awayTeam: {
    teamTricode: string;
    teamName: string;
    score: number;
  };
  gameStatus: number; // 3 = final
  gameStatusText: string;
}

// Fallback static data for March 23, 2026
const FALLBACK_GAMES: GameData[] = [
  {
    gameId: 'fallback_1',
    homeTeam: { teamTricode: 'BOS', teamName: 'Celtics', score: 118 },
    awayTeam: { teamTricode: 'NYK', teamName: 'Knicks', score: 115 },
    gameStatus: 3,
    gameStatusText: 'Final',
  },
  {
    gameId: 'fallback_2',
    homeTeam: { teamTricode: 'LAL', teamName: 'Lakers', score: 127 },
    awayTeam: { teamTricode: 'GSW', teamName: 'Warriors', score: 124 },
    gameStatus: 3,
    gameStatusText: 'Final',
  },
  {
    gameId: 'fallback_3',
    homeTeam: { teamTricode: 'DEN', teamName: 'Nuggets', score: 135 },
    awayTeam: { teamTricode: 'OKC', teamName: 'Thunder', score: 129 },
    gameStatus: 3,
    gameStatusText: 'Final',
  },
  {
    gameId: 'fallback_4',
    homeTeam: { teamTricode: 'MIL', teamName: 'Bucks', score: 105 },
    awayTeam: { teamTricode: 'MIA', teamName: 'Heat', score: 98 },
    gameStatus: 3,
    gameStatusText: 'Final',
  },
  {
    gameId: 'fallback_5',
    homeTeam: { teamTricode: 'PHX', teamName: 'Suns', score: 112 },
    awayTeam: { teamTricode: 'DAL', teamName: 'Mavericks', score: 109 },
    gameStatus: 3,
    gameStatusText: 'Final',
  },
];

function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

export function getYesterdayLabel(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function useYesterdayGames() {
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    async function fetchGames() {
      try {
        const dateStr = getYesterdayDateString();
        const nbaUrl = `https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json`;
        const url = Platform.OS === 'web' ? `${CORS_PROXY}${encodeURIComponent(nbaUrl)}` : nbaUrl;

        const response = await fetch(url, {
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = await response.json();
        const allGames: GameData[] = (json?.scoreboard?.games ?? []).map(
          (g: any) => ({
            gameId: g.gameId,
            homeTeam: {
              teamTricode: g.homeTeam.teamTricode,
              teamName: g.homeTeam.teamName,
              score: Number(g.homeTeam.score),
            },
            awayTeam: {
              teamTricode: g.awayTeam.teamTricode,
              teamName: g.awayTeam.teamName,
              score: Number(g.awayTeam.score),
            },
            gameStatus: g.gameStatus,
            gameStatusText: g.gameStatusText,
          })
        );

        const finishedGames = allGames.filter((g) => g.gameStatus === 3);

        if (finishedGames.length > 0) {
          setGames(finishedGames);
        } else {
          // Try yesterday's date explicitly
          const yesterdayNbaUrl = `https://cdn.nba.com/static/json/liveData/scoreboard/${dateStr}_scoreboard.json`;
          const yesterdayUrl = Platform.OS === 'web' ? `${CORS_PROXY}${encodeURIComponent(yesterdayNbaUrl)}` : yesterdayNbaUrl;
          try {
            const res2 = await fetch(yesterdayUrl);
            if (res2.ok) {
              const json2 = await res2.json();
              const games2 = (json2?.scoreboard?.games ?? [])
                .filter((g: any) => g.gameStatus === 3)
                .map((g: any) => ({
                  gameId: g.gameId,
                  homeTeam: {
                    teamTricode: g.homeTeam.teamTricode,
                    teamName: g.homeTeam.teamName,
                    score: Number(g.homeTeam.score),
                  },
                  awayTeam: {
                    teamTricode: g.awayTeam.teamTricode,
                    teamName: g.awayTeam.teamName,
                    score: Number(g.awayTeam.score),
                  },
                  gameStatus: g.gameStatus,
                  gameStatusText: g.gameStatusText,
                }));
              if (games2.length > 0) {
                setGames(games2);
                return;
              }
            }
          } catch {}
          // No games found, use fallback
          setGames(FALLBACK_GAMES);
          setUsingFallback(true);
        }
      } catch (err) {
        setError('Impossible de charger les matchs NBA');
        setGames(FALLBACK_GAMES);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, []);

  return { games, loading, error, usingFallback };
}
