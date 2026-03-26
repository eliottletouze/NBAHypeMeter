import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_KEYS from '../config/apiKeys';
import { GameData, formatDateString, getDateFromDaysAgo } from './useGames';

export interface GameOdds {
  gameId: string;
  moneyline: { home: number; away: number };
  handicap: { homeLine: number; homeOdds: number; awayLine: number; awayOdds: number };
  overUnder: { line: number; overOdds: number; underOdds: number };
}

const CACHE_TTL = 10 * 60_000;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Hash fiable sans overflow 32-bit ────────────────────────────────────────
function seeded(seed: string, idx: number): number {
  const str = `${seed}_${idx}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) & 0x7fffffff;
  }
  // second pass pour mieux distribuer
  h = ((h ^ (h >>> 15)) * 0x2c1b3c6d) & 0x7fffffff;
  h = ((h ^ (h >>> 12)) * 0x297a2d39) & 0x7fffffff;
  h = h ^ (h >>> 15);
  return (h & 0x7fffffff) / 0x7fffffff;
}

// Cotes américaines → décimales
function usToDecimal(american: number): number {
  if (!american || american === 0) return 1.91;
  return american > 0
    ? round2(american / 100 + 1)
    : round2(100 / Math.abs(american) + 1);
}

// ESPN abbreviation → tricode NBA
const ESPN_TO_NBA: Record<string, string> = {
  GS: 'GSW', SA: 'SAS', NO: 'NOP', NY: 'NYK', UTAH: 'UTA',
};
function toTricode(abbr: string): string {
  return ESPN_TO_NBA[abbr] ?? abbr;
}

// ── Source 1 : ESPN scoreboard (gratuit, no clé) ────────────────────────────
async function fetchESPNOdds(games: GameData[], dateStr: string): Promise<Record<string, GameOdds> | null> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`,
      { signal: controller.signal }
    ).finally(() => clearTimeout(tid));
    if (!res.ok) return null;

    const json = await res.json();
    const events: any[] = json?.events ?? [];
    const map: Record<string, GameOdds> = {};

    for (const event of events) {
      const comp = event.competitions?.[0];
      if (!comp) continue;

      const homeComp = comp.competitors?.find((c: any) => c.homeAway === 'home');
      const awayComp = comp.competitors?.find((c: any) => c.homeAway === 'away');
      if (!homeComp || !awayComp) continue;

      const homeCode = toTricode(homeComp.team?.abbreviation ?? '');
      const awayCode = toTricode(awayComp.team?.abbreviation ?? '');
      const game = games.find(
        g => g.homeTeam.teamTricode === homeCode && g.awayTeam.teamTricode === awayCode
      );
      if (!game) continue;

      const oddsArr: any[] = comp.odds ?? [];
      if (oddsArr.length === 0) continue;
      const o = oddsArr[0];

      // Moneyline (American → décimal)
      const homeML: number = o.homeTeamOdds?.moneyLine ?? 0;
      const awayML: number = o.awayTeamOdds?.moneyLine ?? 0;
      if (!homeML && !awayML) continue; // pas de vraies cotes

      // Handicap — ESPN donne spread (valeur absolue) + homeTeamOdds.favorite (bool)
      const spreadAbs: number = Math.abs(o.spread ?? 0);
      const homeIsFav: boolean = o.homeTeamOdds?.favorite ?? (homeML < 0);
      const homeLine = homeIsFav ? -spreadAbs : spreadAbs;

      // Over/Under
      const ouLine: number = o.overUnder ?? 220.5;

      map[game.gameId] = {
        gameId: game.gameId,
        moneyline: {
          home: homeML ? usToDecimal(homeML) : usToDecimal(homeIsFav ? -150 : 130),
          away: awayML ? usToDecimal(awayML) : usToDecimal(homeIsFav ? 130 : -150),
        },
        handicap: {
          homeLine: round2(homeLine),
          homeOdds: o.homeTeamOdds?.spreadOdds ? usToDecimal(o.homeTeamOdds.spreadOdds) : 1.91,
          awayLine: round2(-homeLine),
          awayOdds: o.awayTeamOdds?.spreadOdds ? usToDecimal(o.awayTeamOdds.spreadOdds) : 1.91,
        },
        overUnder: {
          line: ouLine,
          overOdds: 1.91,
          underOdds: 1.91,
        },
      };
    }

    return Object.keys(map).length > 0 ? map : null;
  } catch {
    clearTimeout(tid);
    return null;
  }
}

// ── Source 2 : The Odds API (optionnel, clé dans config/apiKeys.ts) ──────────
const NAME_TO_TRICODE: Record<string, string> = {
  'Atlanta Hawks': 'ATL', 'Boston Celtics': 'BOS', 'Brooklyn Nets': 'BKN',
  'Charlotte Hornets': 'CHA', 'Chicago Bulls': 'CHI', 'Cleveland Cavaliers': 'CLE',
  'Dallas Mavericks': 'DAL', 'Denver Nuggets': 'DEN', 'Detroit Pistons': 'DET',
  'Golden State Warriors': 'GSW', 'Houston Rockets': 'HOU', 'Indiana Pacers': 'IND',
  'LA Clippers': 'LAC', 'Los Angeles Clippers': 'LAC', 'Los Angeles Lakers': 'LAL',
  'Memphis Grizzlies': 'MEM', 'Miami Heat': 'MIA', 'Milwaukee Bucks': 'MIL',
  'Minnesota Timberwolves': 'MIN', 'New Orleans Pelicans': 'NOP', 'New York Knicks': 'NYK',
  'Oklahoma City Thunder': 'OKC', 'Orlando Magic': 'ORL', 'Philadelphia 76ers': 'PHI',
  'Phoenix Suns': 'PHX', 'Portland Trail Blazers': 'POR', 'Sacramento Kings': 'SAC',
  'San Antonio Spurs': 'SAS', 'Toronto Raptors': 'TOR', 'Utah Jazz': 'UTA',
  'Washington Wizards': 'WAS',
};

async function fetchFromOddsApi(games: GameData[]): Promise<Record<string, GameOdds> | null> {
  if (!API_KEYS.theOddsApi) return null;
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(
      `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${API_KEYS.theOddsApi}&regions=eu&markets=h2h,spreads,totals&oddsFormat=decimal`,
      { signal: controller.signal }
    ).finally(() => clearTimeout(tid));
    if (!res.ok) return null;
    const data: any[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const map: Record<string, GameOdds> = {};
    for (const ev of data) {
      const homeCode = NAME_TO_TRICODE[ev.home_team];
      const awayCode = NAME_TO_TRICODE[ev.away_team];
      if (!homeCode || !awayCode) continue;
      const g = games.find(x => x.homeTeam.teamTricode === homeCode && x.awayTeam.teamTricode === awayCode);
      if (!g) continue;
      const bookmakers: any[] = ev.bookmakers ?? [];
      const bk = bookmakers.find((b: any) => b.key === 'unibet_eu')
             ?? bookmakers.find((b: any) => b.key === 'betclic')
             ?? bookmakers[0];
      if (!bk) continue;
      const h2h     = bk.markets?.find((m: any) => m.key === 'h2h');
      const spreads = bk.markets?.find((m: any) => m.key === 'spreads');
      const totals  = bk.markets?.find((m: any) => m.key === 'totals');
      const hH2H    = h2h?.outcomes?.find((o: any) => NAME_TO_TRICODE[o.name] === homeCode);
      const aH2H    = h2h?.outcomes?.find((o: any) => NAME_TO_TRICODE[o.name] === awayCode);
      if (!hH2H || !aH2H) continue;
      const hSpread = spreads?.outcomes?.find((o: any) => NAME_TO_TRICODE[o.name] === homeCode);
      const aSpread = spreads?.outcomes?.find((o: any) => NAME_TO_TRICODE[o.name] === awayCode);
      const over    = totals?.outcomes?.find((o: any) => o.name === 'Over');
      const under   = totals?.outcomes?.find((o: any) => o.name === 'Under');
      map[g.gameId] = {
        gameId: g.gameId,
        moneyline: { home: hH2H.price, away: aH2H.price },
        handicap: {
          homeLine: hSpread?.point ?? -3.5,
          homeOdds: hSpread?.price ?? 1.91,
          awayLine: aSpread?.point ?? 3.5,
          awayOdds: aSpread?.price ?? 1.91,
        },
        overUnder: {
          line: over?.point ?? 220.5,
          overOdds: over?.price ?? 1.91,
          underOdds: under?.price ?? 1.91,
        },
      };
    }
    return Object.keys(map).length > 0 ? map : null;
  } catch {
    clearTimeout(tid);
    return null;
  }
}

// ── Source 3 : Fallback déterministe (avec hash corrigé) ────────────────────
// Utilise les tricodes des équipes comme seed supplémentaire pour plus de variété
export function generateOdds(game: GameData): GameOdds {
  // Seed = gameId + les deux tricodes pour garantir la variété même avec des IDs proches
  const seed = `${game.gameId}_${game.homeTeam.teamTricode}_${game.awayTeam.teamTricode}`;

  const homeIsFav = seeded(seed, 0) > 0.48;

  // Moneyline : favori 1.50–1.85, outsider 1.95–2.60
  const favML  = round2(1.50 + seeded(seed, 1) * 0.35);
  const undML  = round2(1.95 + seeded(seed, 2) * 0.65);

  // Handicap : -1.5 à -10.5
  const spreadSteps = Math.floor(seeded(seed, 3) * 10); // 0–9
  const spread = -(1.5 + spreadSteps); // -1.5 à -10.5
  const hcpJuice = round2(1.87 + seeded(seed, 4) * 0.08);
  const hcpJuice2 = round2(1.87 + seeded(seed, 5) * 0.08);

  // O/U : 210.5 à 240.5 (plages réalistes NBA)
  const ouSteps = Math.floor(seeded(seed, 6) * 31); // 0–30
  const ouLine  = 210.5 + ouSteps;
  const overOdds  = round2(1.85 + seeded(seed, 7) * 0.12);
  const underOdds = round2(1.85 + seeded(seed, 8) * 0.12);

  return {
    gameId: game.gameId,
    moneyline: {
      home: homeIsFav ? favML : undML,
      away: homeIsFav ? undML : favML,
    },
    handicap: {
      homeLine: homeIsFav ? spread : -spread,
      homeOdds: hcpJuice,
      awayLine: homeIsFav ? -spread : spread,
      awayOdds: hcpJuice2,
    },
    overUnder: { line: ouLine, overOdds, underOdds },
  };
}

// ── Hook principal ──────────────────────────────────────────────────────────
export type OddsSource = 'espn' | 'theOddsApi' | 'generated';

export function useOdds(games: GameData[], daysAgo: number) {
  const [odds, setOdds]     = useState<Record<string, GameOdds>>({});
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<OddsSource>('generated');

  useEffect(() => {
    if (games.length === 0) { setLoading(false); return; }
    setLoading(true);

    const dateStr  = formatDateString(getDateFromDaysAgo(daysAgo));
    const cacheKey = `@nba_odds_v3_${dateStr}`;

    async function load() {
      // Cache
      try {
        const raw = await AsyncStorage.getItem(cacheKey);
        if (raw) {
          const { data, ts, src } = JSON.parse(raw);
          if (Date.now() - ts < CACHE_TTL) {
            setOdds(data);
            setSource(src ?? 'generated');
            setLoading(false);
            return;
          }
        }
      } catch {}

      // 1. ESPN (gratuit)
      const espn = await fetchESPNOdds(games, dateStr);
      // 2. The Odds API si clé dispo
      const theOdds = await fetchFromOddsApi(games);

      // Fusion : The Odds API > ESPN > fallback par match
      const map: Record<string, GameOdds> = {};
      for (const g of games) {
        map[g.gameId] = theOdds?.[g.gameId] ?? espn?.[g.gameId] ?? generateOdds(g);
      }

      const src: OddsSource =
        theOdds && Object.keys(theOdds).length > 0 ? 'theOddsApi'
        : espn   && Object.keys(espn).length   > 0 ? 'espn'
        : 'generated';

      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify({ data: map, ts: Date.now(), src }));
      } catch {}
      setOdds(map);
      setSource(src);
      setLoading(false);
    }

    load();
  }, [games, daysAgo]);

  const sourceLabel =
    source === 'espn'       ? '📡 ESPN (en direct)' :
    source === 'theOddsApi' ? '📊 The Odds API'     :
                              '🎲 Cotes indicatives';

  return { odds, loading, usingFallback: source === 'generated', sourceLabel };
}
