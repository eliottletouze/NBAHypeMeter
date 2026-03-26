import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useGames, getDateFromDaysAgo, formatDateLabel, GameData } from '../hooks/useGames';
import { computeHype } from '../utils/hype';
import { usePlayers } from '../hooks/usePlayers';
import { useNBAPlayers } from '../hooks/useNBAPlayers';
import { useNotifications } from '../hooks/useNotifications';
import GameCard from '../components/GameCard';
import PlayerSearch from '../components/PlayerSearch';

const MAX_DAYS_BACK = 14;
const MAX_DAYS_FORWARD = 7;

export default function HomeScreen() {
  const [daysAgo, setDaysAgo] = useState(1);
  const { games, loading, usingFallback } = useGames(daysAgo);
  const { favoritePlayers, addPlayer, removePlayer } = usePlayers();
  const { players: allPlayers, loading: loadingPlayers } = useNBAPlayers();

  useNotifications(games, favoritePlayers, loading, daysAgo);

  const date = getDateFromDaysAgo(daysAgo);
  const dateLabel = formatDateLabel(date, daysAgo);

  const sortedGames = useMemo(() => {
    const favTeams = new Set(favoritePlayers.map((p) => p.team));
    return [...games]
      .map((game) => ({
        game,
        finished: game.gameStatus === 3,
        isFav: favTeams.has(game.homeTeam.teamTricode) || favTeams.has(game.awayTeam.teamTricode),
        hype: game.gameStatus === 3
          ? computeHype(game.homeTeam.score, game.awayTeam.score, game.homeTeam.teamTricode, game.awayTeam.teamTricode, favoritePlayers).total
          : -1,
      }))
      .sort((a, b) => {
        // Matchs terminés avant les matchs à venir
        if (a.finished !== b.finished) return a.finished ? -1 : 1;
        // Parmi les terminés : favoris d'abord, puis par hype décroissant
        if (a.finished) {
          if (a.isFav !== b.isFav) return a.isFav ? -1 : 1;
          return b.hype - a.hype;
        }
        // Parmi les à venir : favoris d'abord
        if (a.isFav !== b.isFav) return a.isFav ? -1 : 1;
        return 0;
      })
      .map(({ game }) => game);
  }, [games, favoritePlayers]);

  const changeDay = (delta: number) => {
    setDaysAgo(d => Math.min(Math.max(d + delta, -MAX_DAYS_FORWARD), MAX_DAYS_BACK));
  };

  const swipe = useMemo(() =>
    Gesture.Pan()
      .activeOffsetX([-20, 20])
      .failOffsetY([-15, 15])
      .onEnd((e) => {
        if (Math.abs(e.translationX) < 60 && Math.abs(e.velocityX) < 500) return;
        runOnJS(changeDay)(e.translationX > 0 ? 1 : -1);
      })
  , []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <GestureDetector gesture={swipe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>NBA HYPE METER</Text>
          <Text style={styles.headerEmoji}>🏀</Text>
        </View>

        {/* Date navigation */}
        <View style={styles.dateNav}>
          <TouchableOpacity
            style={[styles.navBtn, daysAgo >= MAX_DAYS_BACK && styles.navBtnDisabled]}
            onPress={() => setDaysAgo((d) => Math.min(d + 1, MAX_DAYS_BACK))}
            disabled={daysAgo >= MAX_DAYS_BACK}
            activeOpacity={0.7}
          >
            <Text style={styles.navBtnText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.dateLabel}>{dateLabel}</Text>

          <TouchableOpacity
            style={[styles.navBtn, daysAgo <= -MAX_DAYS_FORWARD && styles.navBtnDisabled]}
            onPress={() => setDaysAgo((d) => Math.max(d - 1, -MAX_DAYS_FORWARD))}
            disabled={daysAgo <= -MAX_DAYS_FORWARD}
            activeOpacity={0.7}
          >
            <Text style={styles.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Player search */}
        <PlayerSearch
          allPlayers={allPlayers}
          loadingPlayers={loadingPlayers}
          favoritePlayers={favoritePlayers}
          onAdd={addPlayer}
          onRemove={removePlayer}
        />

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>{daysAgo < 0 ? 'PROCHAINS MATCHS' : 'MATCHS'}</Text>

        {usingFallback && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>⚠️ Données hors-ligne — matchs de démonstration</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#9B7FFF" size="large" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : sortedGames.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>😴</Text>
            <Text style={styles.emptyText}>Pas de matchs terminés ce jour-là</Text>
          </View>
        ) : (
          sortedGames.map((game) => (
            <GameCard key={game.gameId} game={game} favoritePlayers={favoritePlayers} />
          ))
        )}
      </ScrollView>
      </GestureDetector>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#08080f' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 32, color: '#F0F0F5', letterSpacing: 2 },
  headerEmoji: { fontSize: 24 },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d0d1b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e1e35',
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 20,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#131325',
  },
  navBtnDisabled: { opacity: 0.25 },
  navBtnText: { fontFamily: 'BebasNeue_400Regular', fontSize: 26, color: '#D0D0D8', lineHeight: 30 },
  dateLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#D0D0D8',
    textTransform: 'capitalize',
    textAlign: 'center',
    flex: 1,
  },
  divider: { height: 1, backgroundColor: '#1e1e35', marginBottom: 16 },
  sectionTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 13, color: '#6060A0', letterSpacing: 2, marginBottom: 12 },
  banner: { backgroundColor: '#1a1010', borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: '#3a1a1a' },
  bannerText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#E84040' },
  loadingContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#6060A0' },
  emptyContainer: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontFamily: 'DMSans_400Regular', fontSize: 15, color: '#6060A0' },
});
