import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BALANCE_KEY = '@betting_balance_v1';
const BETS_KEY    = '@betting_bets_v1';
const SLIP_KEY    = '@betting_slip_v1';

const DEFAULT_BALANCE = 10_000;
const RESET_BALANCE   = 1_000;
export const MIN_STAKE = 100;

export type BetType = 'moneyline' | 'handicap' | 'over_under';
export type BetSelection = 'home' | 'away' | 'over' | 'under';
export type BetStatus = 'pending' | 'won' | 'lost' | 'void';

export interface SlipItem {
  id: string;          // gameId + '_' + type + '_' + selection
  gameId: string;
  gameLabel: string;   // "LAL vs GSW"
  betType: BetType;
  selection: BetSelection;
  selectionLabel: string; // "Lakers" | "Over 225.5"
  odds: number;
  homeLine?: number;   // pour résolution handicap
  awayLine?: number;
  ouLine?: number;     // pour résolution O/U
}

export interface PlacedBet {
  id: string;
  items: SlipItem[];
  stake: number;
  combinedOdds: number;
  potentialWin: number;
  status: BetStatus;
  placedAt: number;
  resolvedAt?: number;
}

export interface BettingStats {
  total: number;
  won: number;
  lost: number;
  winRate: number;
  totalGain: number;
}

function combinedOdds(items: SlipItem[]): number {
  return Math.round(items.reduce((acc, i) => acc * i.odds, 1) * 100) / 100;
}

function resolveSingleItem(
  item: SlipItem,
  homeScore: number,
  awayScore: number,
): boolean {
  switch (item.betType) {
    case 'moneyline':
      return item.selection === 'home' ? homeScore > awayScore : awayScore > homeScore;
    case 'handicap': {
      const hl = item.homeLine ?? 0;
      const al = item.awayLine ?? 0;
      return item.selection === 'home'
        ? homeScore + hl > awayScore
        : awayScore + al > homeScore;
    }
    case 'over_under': {
      const total = homeScore + awayScore;
      const line = item.ouLine ?? 220.5;
      return item.selection === 'over' ? total > line : total < line;
    }
  }
}

export function useBetting() {
  const [balance, setBalance]   = useState(DEFAULT_BALANCE);
  const [bets, setBets]         = useState<PlacedBet[]>([]);
  const [slip, setSlip]         = useState<SlipItem[]>([]);
  const [loaded, setLoaded]     = useState(false);

  // Hydrate from AsyncStorage
  useEffect(() => {
    async function hydrate() {
      try {
        const [rawBal, rawBets, rawSlip] = await Promise.all([
          AsyncStorage.getItem(BALANCE_KEY),
          AsyncStorage.getItem(BETS_KEY),
          AsyncStorage.getItem(SLIP_KEY),
        ]);
        if (rawBal !== null) setBalance(JSON.parse(rawBal));
        if (rawBets !== null) setBets(JSON.parse(rawBets));
        if (rawSlip !== null) setSlip(JSON.parse(rawSlip));
      } catch {}
      setLoaded(true);
    }
    hydrate();
  }, []);

  const persist = useCallback(async (
    newBalance: number,
    newBets: PlacedBet[],
    newSlip: SlipItem[],
  ) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(BALANCE_KEY, JSON.stringify(newBalance)),
        AsyncStorage.setItem(BETS_KEY, JSON.stringify(newBets)),
        AsyncStorage.setItem(SLIP_KEY, JSON.stringify(newSlip)),
      ]);
    } catch {}
  }, []);

  // ── Slip management ────────────────────────────────────────────────────────

  const addToSlip = useCallback((item: SlipItem) => {
    setSlip(prev => {
      // Un seul marché par match dans un combiné
      const filtered = prev.filter(i => !(i.gameId === item.gameId && i.betType === item.betType));
      // Si c'est exactement le même item déjà sélectionné → déselectionner
      if (prev.some(i => i.id === item.id)) {
        const next = filtered;
        persist(balance, bets, next);
        return next;
      }
      if (prev.length >= 5) return prev; // max 5
      const next = [...filtered, item];
      persist(balance, bets, next);
      return next;
    });
  }, [balance, bets, persist]);

  const removeFromSlip = useCallback((id: string) => {
    setSlip(prev => {
      const next = prev.filter(i => i.id !== id);
      persist(balance, bets, next);
      return next;
    });
  }, [balance, bets, persist]);

  const clearSlip = useCallback(() => {
    setSlip([]);
    persist(balance, bets, []);
  }, [balance, bets, persist]);

  // ── Place bet ──────────────────────────────────────────────────────────────

  const placeBet = useCallback((stake: number): { ok: boolean; error?: string } => {
    if (slip.length === 0) return { ok: false, error: 'Aucun pari sélectionné' };
    if (stake < MIN_STAKE) return { ok: false, error: `Mise minimum : ${MIN_STAKE} 💰` };
    const maxStake = Math.floor(balance * 0.3);
    if (stake > maxStake) return { ok: false, error: `Mise maximum : ${maxStake} 💰 (30% du solde)` };
    if (stake > balance) return { ok: false, error: 'Solde insuffisant' };

    const co = combinedOdds(slip);
    const bet: PlacedBet = {
      id: `bet_${Date.now()}`,
      items: [...slip],
      stake,
      combinedOdds: co,
      potentialWin: Math.round(stake * co),
      status: 'pending',
      placedAt: Date.now(),
    };
    const newBalance = balance - stake;
    const newBets = [bet, ...bets];
    setBalance(newBalance);
    setBets(newBets);
    setSlip([]);
    persist(newBalance, newBets, []);
    return { ok: true };
  }, [slip, balance, bets, persist]);

  // ── Resolve game ───────────────────────────────────────────────────────────

  const resolveGame = useCallback((gameId: string, homeScore: number, awayScore: number) => {
    setBets(prev => {
      const pendingForGame = prev.filter(
        b => b.status === 'pending' && b.items.some(i => i.gameId === gameId)
      );
      if (pendingForGame.length === 0) return prev;

      let balanceDelta = 0;
      const updated = prev.map(b => {
        if (b.status !== 'pending') return b;
        const itemsForGame = b.items.filter(i => i.gameId === gameId);
        if (itemsForGame.length === 0) return b;

        // Résoudre les items concernant ce match
        const allResolved = b.items.every(i => {
          if (i.gameId !== gameId) return false; // on ne sait pas encore
          return true;
        });

        // Pari simple sur ce match OU dernier match d'un combiné ?
        const allGamesResolved = b.items.every(i => i.gameId === gameId);
        if (!allGamesResolved) return b; // combiné pas encore entièrement terminé

        const won = b.items.every(i => resolveSingleItem(i, homeScore, awayScore));
        const status: BetStatus = won ? 'won' : 'lost';
        if (won) balanceDelta += b.potentialWin;
        return { ...b, status, resolvedAt: Date.now() };
      });

      if (balanceDelta > 0) {
        setBalance(cur => {
          const nb = cur + balanceDelta;
          AsyncStorage.setItem(BALANCE_KEY, JSON.stringify(nb)).catch(() => {});
          return nb;
        });
      }

      try { AsyncStorage.setItem(BETS_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  // ── Reset balance ──────────────────────────────────────────────────────────

  const resetBalance = useCallback(() => {
    setBalance(RESET_BALANCE);
    persist(RESET_BALANCE, bets, slip);
  }, [bets, slip, persist]);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats: BettingStats = (() => {
    const finished = bets.filter(b => b.status === 'won' || b.status === 'lost');
    const won = finished.filter(b => b.status === 'won');
    const totalGain = bets.reduce((acc, b) => {
      if (b.status === 'won') return acc + (b.potentialWin - b.stake);
      if (b.status === 'lost') return acc - b.stake;
      return acc;
    }, 0);
    return {
      total: finished.length,
      won: won.length,
      lost: finished.length - won.length,
      winRate: finished.length > 0 ? Math.round((won.length / finished.length) * 100) : 0,
      totalGain,
    };
  })();

  const combinedOddsValue = slip.length > 0 ? combinedOdds(slip) : 0;

  return {
    balance,
    bets,
    slip,
    loaded,
    combinedOddsValue,
    addToSlip,
    removeFromSlip,
    clearSlip,
    placeBet,
    resolveGame,
    resetBalance,
    stats,
    maxStake: Math.floor(balance * 0.3),
  };
}
