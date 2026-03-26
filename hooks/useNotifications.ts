import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Player } from '../data/players';
import { GameData } from './useGames';
import { computeHype } from '../utils/hype';

const NOTIFIED_KEY = '@nba_hype_notified_v1';

async function getNotifiedIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFIED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

async function markNotified(ids: Set<string>, newId: string) {
  ids.add(newId);
  await AsyncStorage.setItem(NOTIFIED_KEY, JSON.stringify([...ids]));
}

async function sendNow(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
}

async function scheduleMorning(title: string, body: string) {
  const now = new Date();
  const morning = new Date();
  morning.setHours(9, 0, 0, 0);

  if (morning <= now) {
    // Already past 9am — send immediately
    await sendNow(title, body);
  } else {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: morning,
      },
    });
  }
}

export function useNotifications(
  games: GameData[],
  favoritePlayers: Player[],
  loading: boolean,
  daysAgo: number,
) {
  useEffect(() => {
    if (Platform.OS === 'web' || loading || games.length === 0) return;

    async function run() {
      // Ask permission (no-op if already granted/denied)
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      const notified = await getNotifiedIds();

      for (const game of games.filter(g => g.gameStatus === 3)) {
        const hype = computeHype(
          game.homeTeam.score,
          game.awayTeam.score,
          game.homeTeam.teamTricode,
          game.awayTeam.teamTricode,
          favoritePlayers,
        );

        // ── 1. Notification "match à ne pas manquer" (hype ≥ 8) ──────────────
        const hypeKey = `hype_${game.gameId}`;
        if (hype.total >= 8 && !notified.has(hypeKey)) {
          await sendNow(
            '🔥 Match à ne pas manquer !',
            `${game.awayTeam.teamTricode} @ ${game.homeTeam.teamTricode} — Hype ${hype.total}/10`,
          );
          await markNotified(notified, hypeKey);
        }

        // ── 2. Alerte matin joueur favori (seulement pour hier) ──────────────
        if (daysAgo === 1) {
          const presentFavs = favoritePlayers.filter(
            p => p.team === game.homeTeam.teamTricode || p.team === game.awayTeam.teamTricode,
          );
          if (presentFavs.length > 0) {
            const morningKey = `morning_${game.gameId}`;
            if (!notified.has(morningKey)) {
              const names = presentFavs.map(p => p.name.split(' ').pop()).join(' & ');
              await scheduleMorning(
                `⭐ ${names} a joué hier !`,
                `${game.awayTeam.teamTricode} @ ${game.homeTeam.teamTricode} — Hype ${hype.total}/10`,
              );
              await markNotified(notified, morningKey);
            }
          }
        }
      }
    }

    run();
  }, [games, favoritePlayers, loading, daysAgo]);
}
