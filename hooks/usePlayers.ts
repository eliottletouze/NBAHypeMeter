import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Player } from '../data/players';

const STORAGE_KEY = '@nba_hype_favorite_players';

export function usePlayers() {
  const [favoritePlayers, setFavoritePlayers] = useState<Player[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setFavoritePlayers(JSON.parse(stored));
        }
      } catch {}
      setLoaded(true);
    }
    load();
  }, []);

  async function addPlayer(player: Player) {
    if (favoritePlayers.some((p) => p.id === player.id)) return;
    const updated = [...favoritePlayers, player];
    setFavoritePlayers(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  async function removePlayer(playerId: string) {
    const updated = favoritePlayers.filter((p) => p.id !== playerId);
    setFavoritePlayers(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  return { favoritePlayers, addPlayer, removePlayer, loaded };
}
