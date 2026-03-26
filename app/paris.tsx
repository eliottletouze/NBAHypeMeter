import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGames, getDateFromDaysAgo, formatDateLabel } from '../hooks/useGames';
import { useOdds } from '../hooks/useOdds';
import { useBetting } from '../hooks/useBetting';
import BetCard from '../components/betting/BetCard';
import BetSlip from '../components/betting/BetSlip';
import BetHistory from '../components/betting/BetHistory';

const MAX_DAYS_BACK    = 7;
const MAX_DAYS_FORWARD = 3;

export default function ParisScreen() {
  const [daysAgo, setDaysAgo] = useState(0);
  const { games, loading: loadingGames } = useGames(daysAgo);
  const { odds, loading: loadingOdds, usingFallback, sourceLabel } = useOdds(games, daysAgo);
  const {
    balance, bets, slip, loaded,
    combinedOddsValue, maxStake,
    addToSlip, removeFromSlip, clearSlip, placeBet,
    resolveGame, resetBalance, stats,
  } = useBetting();

  const date = getDateFromDaysAgo(daysAgo);
  const dateLabel = formatDateLabel(date, daysAgo);

  // Résolution automatique des paris quand un match est final
  useEffect(() => {
    for (const g of games) {
      if (g.gameStatus !== 3) continue;
      const hasPending = bets.some(
        b => b.status === 'pending' && b.items.some(i => i.gameId === g.gameId)
      );
      if (hasPending) {
        resolveGame(g.gameId, g.homeTeam.score, g.awayTeam.score);
      }
    }
  }, [games]);

  const isLoading = loadingGames || loadingOdds || !loaded;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, slip.length > 0 && { paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>🎰 PARIS</Text>
            <Text style={[styles.fallbackNote, !usingFallback && styles.fallbackNoteReal]}>
              {sourceLabel}
            </Text>
          </View>
          <View style={styles.balanceChip}>
            <Text style={styles.balanceValue}>{balance.toLocaleString('fr-FR')}</Text>
            <Text style={styles.balanceCoin}> 💰</Text>
          </View>
        </View>

        {/* Navigation dates */}
        <View style={styles.dateNav}>
          <TouchableOpacity
            style={[styles.navBtn, daysAgo >= MAX_DAYS_BACK && styles.navBtnDisabled]}
            onPress={() => setDaysAgo(d => Math.min(d + 1, MAX_DAYS_BACK))}
            disabled={daysAgo >= MAX_DAYS_BACK}
          >
            <Text style={styles.navBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
          <TouchableOpacity
            style={[styles.navBtn, daysAgo <= -MAX_DAYS_FORWARD && styles.navBtnDisabled]}
            onPress={() => setDaysAgo(d => Math.max(d - 1, -MAX_DAYS_FORWARD))}
            disabled={daysAgo <= -MAX_DAYS_FORWARD}
          >
            <Text style={styles.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#9B7FFF" size="large" />
            <Text style={styles.loadingText}>Chargement des cotes...</Text>
          </View>
        ) : games.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>😴</Text>
            <Text style={styles.emptyText}>Pas de matchs ce jour-là</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>CHOISIR UN MARCHÉ</Text>
            {games.map(g => (
              <BetCard
                key={g.gameId}
                game={g}
                odds={odds[g.gameId]}
                slip={slip}
                onToggle={addToSlip}
                locked={daysAgo > 0}
              />
            ))}
          </>
        )}

        {/* Séparateur historique */}
        <View style={styles.divider} />
        <BetHistory
          bets={bets}
          stats={stats}
          balance={balance}
          onReset={resetBalance}
        />
      </ScrollView>

      {/* Slip sticky */}
      <BetSlip
        slip={slip}
        combinedOdds={combinedOddsValue}
        balance={balance}
        maxStake={maxStake}
        onRemove={removeFromSlip}
        onClear={clearSlip}
        onPlace={placeBet}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#08080f' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 30,
    color: '#F0F0F5',
    letterSpacing: 2,
  },
  fallbackNote: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: '#F5C842',
    marginTop: 2,
  },
  fallbackNoteReal: {
    color: '#4CAF50',
  },
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d0d1b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e1e35',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  balanceValue: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    color: '#F5C842',
    lineHeight: 24,
  },
  balanceCoin: { fontSize: 16 },
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
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, backgroundColor: '#131325',
  },
  navBtnDisabled: { opacity: 0.25 },
  navBtnText: { fontFamily: 'BebasNeue_400Regular', fontSize: 26, color: '#D0D0D8', lineHeight: 30 },
  dateLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#D0D0D8',
    textTransform: 'capitalize',
    flex: 1,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 12,
    color: '#6060A0',
    letterSpacing: 2,
    marginBottom: 10,
  },
  loadingBox: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#6060A0' },
  emptyBox: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontFamily: 'DMSans_400Regular', fontSize: 15, color: '#6060A0' },
  divider: { height: 1, backgroundColor: '#1e1e35', marginVertical: 20 },
});
