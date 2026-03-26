import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGames } from '../hooks/useGames';
import { useTTFL, todayStr } from '../hooks/useTTFL';
import { useTTFLDeadline } from '../hooks/useTTFLDeadline';
import { useBDLStats, calcTTFLScore } from '../hooks/useBDLStats';
import { useNBAPlayers } from '../hooks/useNBAPlayers';
import { STAR_PLAYER_NAMES } from '../data/players';
import TTFLPlayerCard, { PlayerOption } from '../components/ttfl/TTFLPlayerCard';
import TTFLScoreDisplay from '../components/ttfl/TTFLScoreDisplay';
import TTFLCalendar from '../components/ttfl/TTFLCalendar';
import TTFLLeague from '../components/ttfl/TTFLLeague';

type Section = 'pick' | 'history' | 'league';

export default function TTFLScreen() {
  const [section, setSection] = useState<Section>('pick');
  const [search, setSearch] = useState('');

  const { games, loading: loadingGames } = useGames(0); // matchs de ce soir
  const { players: allPlayers } = useNBAPlayers();
  const {
    picks, todayPick, loaded,
    makePick, cancelPick, updatePickStats,
    cooldownDaysLeft,
    seasonTotal, last7Avg, streak, hallOfShame,
    leagues, createLeague, addMemberToLeague, deleteLeague,
    pseudo, savePseudo,
  } = useTTFL();
  const { deadlineLabel, timeLeft, isPastDeadline, hasGamesTonight } = useTTFLDeadline();
  const { fetchDateStats, loading: loadingStats } = useBDLStats();

  // Équipes jouant ce soir
  const tonightTeams = useMemo(() => {
    const teams = new Set<string>();
    for (const g of games) {
      teams.add(g.homeTeam.teamTricode);
      teams.add(g.awayTeam.teamTricode);
    }
    return teams;
  }, [games]);

  // Joueurs jouant ce soir
  const tonightPlayers = useMemo((): PlayerOption[] => {
    return allPlayers
      .filter(p => tonightTeams.has(p.team))
      .map(p => {
        const myPicks = picks.filter(pk => pk.playerId === p.id.toLowerCase().replace(/[^a-z]/g, '_') || pk.playerName === p.name);
        const recentScores = myPicks
          .filter(pk => pk.stats !== null)
          .slice(0, 5)
          .map(pk => pk.stats?.ttflScore ?? null);
        const opponent = games.find(g =>
          g.homeTeam.teamTricode === p.team || g.awayTeam.teamTricode === p.team
        );
        const opp = opponent
          ? (opponent.homeTeam.teamTricode === p.team ? opponent.awayTeam.teamTricode : opponent.homeTeam.teamTricode)
          : '?';
        return {
          name: p.name,
          team: p.team,
          opponent: opp,
          isStar: p.isStar,
          recentScores,
          cooldownDays: cooldownDaysLeft(p.name),
          estimatedAvg: null,
        };
      })
      .sort((a, b) => {
        if (a.cooldownDays > 0 && b.cooldownDays === 0) return 1;
        if (a.cooldownDays === 0 && b.cooldownDays > 0) return -1;
        if (b.isStar !== a.isStar) return b.isStar ? 1 : -1;
        return a.name.localeCompare(b.name);
      });
  }, [allPlayers, tonightTeams, picks, games, cooldownDaysLeft]);

  const filteredPlayers = useMemo(() => {
    if (!search.trim()) return tonightPlayers.slice(0, 20);
    const q = search.toLowerCase();
    return tonightPlayers.filter(p =>
      p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [tonightPlayers, search]);

  // Rafraîchir les stats toutes les 2 min si un match est en direct
  useEffect(() => {
    if (!todayPick || todayPick.stats !== null) return;
    const today = todayStr();

    async function tryUpdateStats() {
      const stats = await fetchDateStats(today);
      const playerStat = stats.find(s =>
        s.playerName.toLowerCase().includes(todayPick!.playerName.split(' ').pop()!.toLowerCase())
      );
      if (playerStat) updatePickStats(today, playerStat);
    }

    tryUpdateStats();
    const id = setInterval(tryUpdateStats, 2 * 60_000);
    return () => clearInterval(id);
  }, [todayPick?.playerName]);

  function handlePick(playerName: string, team: string, opponent: string) {
    if (isPastDeadline) return;
    const result = makePick(playerName, team, opponent, Date.now());
    if (!result.ok) return;
    setSearch('');
  }

  const isLive = games.some(g => g.gameStatus === 2);
  const completedPicks = picks.filter(p => p.stats !== null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⭐ TTFL</Text>
          <View style={styles.seasonChip}>
            <Text style={styles.seasonValue}>{seasonTotal.toFixed(0)}</Text>
            <Text style={styles.seasonLabel}>pts saison</Text>
          </View>
        </View>

        {/* Deadline */}
        {hasGamesTonight && (
          <View style={[styles.deadlineBar, isPastDeadline && styles.deadlineBarPast]}>
            <View>
              <Text style={styles.deadlineTitle}>
                {isPastDeadline ? '🔒 DEADLINE PASSÉE' : '⏱️ DEADLINE'}
              </Text>
              {deadlineLabel && !isPastDeadline && (
                <Text style={styles.deadlineTime}>1er match : {deadlineLabel}</Text>
              )}
            </View>
            <Text style={[styles.countdown, isPastDeadline && styles.countdownPast]}>
              {isPastDeadline ? 'VERROUILLÉ' : timeLeft}
            </Text>
          </View>
        )}

        {/* Stats rapides */}
        <View style={styles.quickStats}>
          <QuickStat label="MOY 7J" value={last7Avg > 0 ? last7Avg.toFixed(1) : '—'} />
          <QuickStat label="STREAK" value={streak > 0 ? `🔥 ${streak}` : '—'} />
          <QuickStat label="PICKS" value={String(completedPicks.length)} />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['pick', 'history', 'league'] as Section[]).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.tab, section === s && styles.tabActive]}
              onPress={() => setSection(s)}
            >
              <Text style={[styles.tabText, section === s && styles.tabTextActive]}>
                {s === 'pick' ? 'MON PICK' : s === 'history' ? 'HISTORIQUE' : 'LIGUE'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Section PICK ─────────────────────────────────────────────────── */}
        {section === 'pick' && (
          <>
            {/* Pick en cours / score */}
            {todayPick ? (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>TON PICK CE SOIR</Text>
                  {!isPastDeadline && (
                    <TouchableOpacity onPress={() => cancelPick(isPastDeadline)}>
                      <Text style={styles.cancelPickText}>Changer</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TTFLScoreDisplay pick={todayPick} isLive={isLive} />
              </View>
            ) : (
              <View style={styles.noPickBox}>
                <Text style={styles.noPickEmoji}>{isPastDeadline ? '🔒' : '👆'}</Text>
                <Text style={styles.noPickText}>
                  {isPastDeadline
                    ? 'Deadline passée — 0 pts pour ce soir'
                    : 'Choisis ton joueur avant la deadline'}
                </Text>
              </View>
            )}

            {/* Sélection joueur */}
            {!todayPick && !isPastDeadline && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>JOUEURS CE SOIR</Text>
                {loadingGames ? (
                  <ActivityIndicator color="#9B7FFF" style={{ marginVertical: 20 }} />
                ) : tonightPlayers.length === 0 ? (
                  <View style={styles.noGamesBox}>
                    <Text style={styles.noGamesText}>Pas de matchs ce soir</Text>
                  </View>
                ) : (
                  <>
                    {/* Recherche */}
                    <View style={styles.searchBox}>
                      <Text style={styles.searchIcon}>🔍</Text>
                      <TextInput
                        style={styles.searchInput}
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Chercher un joueur..."
                        placeholderTextColor="#404060"
                      />
                      {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                          <Text style={styles.searchClear}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {filteredPlayers.map(p => (
                      <TTFLPlayerCard
                        key={`${p.name}_${p.team}`}
                        player={p}
                        isSelected={todayPick?.playerName === p.name}
                        onSelect={() => handlePick(p.name, p.team, p.opponent)}
                      />
                    ))}

                    {!search && tonightPlayers.length > 20 && (
                      <Text style={styles.moreText}>
                        + {tonightPlayers.length - 20} joueurs — affine ta recherche
                      </Text>
                    )}
                  </>
                )}
              </View>
            )}
          </>
        )}

        {/* ── Section HISTORIQUE ───────────────────────────────────────────── */}
        {section === 'history' && (
          <>
            {/* Calendrier */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CALENDRIER</Text>
              <TTFLCalendar picks={picks} />
            </View>

            {/* Liste des picks */}
            {picks.length === 0 ? (
              <View style={styles.noPickBox}>
                <Text style={styles.noPickEmoji}>📋</Text>
                <Text style={styles.noPickText}>Aucun pick pour l'instant</Text>
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PICKS RÉCENTS</Text>
                {picks.slice(0, 15).map(p => (
                  <PickHistoryRow key={p.date} pick={p} />
                ))}
              </View>
            )}

            {/* Hall of shame */}
            {hallOfShame.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>HALL OF SHAME 😂</Text>
                {hallOfShame.map((p, i) => (
                  <PickHistoryRow key={`shame_${i}`} pick={p} isShame />
                ))}
              </View>
            )}
          </>
        )}

        {/* ── Section LIGUE ────────────────────────────────────────────────── */}
        {section === 'league' && (
          <View style={styles.section}>
            <TTFLLeague
              leagues={leagues}
              pseudo={pseudo}
              seasonTotal={seasonTotal}
              onCreateLeague={createLeague}
              onDeleteLeague={deleteLeague}
              onSavePseudo={savePseudo}
            />
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={qs.box}>
      <Text style={qs.value}>{value}</Text>
      <Text style={qs.label}>{label}</Text>
    </View>
  );
}

function PickHistoryRow({ pick, isShame }: { pick: ReturnType<typeof useTTFL>['picks'][0]; isShame?: boolean }) {
  const score = pick.stats?.ttflScore ?? null;
  const color = score === null ? '#6060A0' : score >= 40 ? '#4CAF50' : score >= 25 ? '#F5C842' : '#E84040';
  return (
    <View style={[ph.row, isShame && ph.rowShame]}>
      <Text style={ph.date}>{pick.date.slice(5).replace('-', '/')}</Text>
      <View style={ph.info}>
        <Text style={ph.name} numberOfLines={1}>{pick.playerName}</Text>
        <Text style={ph.matchup}>{pick.playerTeam} vs {pick.opponent}</Text>
      </View>
      <Text style={[ph.score, { color }]}>
        {score !== null ? score.toFixed(0) : '⏳'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#08080f' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  headerTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 30, color: '#F0F0F5', letterSpacing: 2 },
  seasonChip: {
    backgroundColor: '#0d0d1b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e1e35',
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
  },
  seasonValue: { fontFamily: 'BebasNeue_400Regular', fontSize: 20, color: '#9B7FFF', lineHeight: 22 },
  seasonLabel: { fontFamily: 'DMSans_400Regular', fontSize: 9, color: '#404060', letterSpacing: 0.5 },
  deadlineBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0d1020',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#9B7FFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  deadlineBarPast: { borderColor: '#E84040', backgroundColor: '#110808' },
  deadlineTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 12, color: '#9B7FFF', letterSpacing: 1.5 },
  deadlineTime: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#6060A0', marginTop: 2 },
  countdown: { fontFamily: 'BebasNeue_400Regular', fontSize: 24, color: '#9B7FFF', letterSpacing: 2 },
  countdownPast: { fontSize: 16, color: '#E84040' },
  quickStats: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tabs: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e1e35',
    alignItems: 'center',
    backgroundColor: '#0d0d1b',
  },
  tabActive: { borderColor: '#9B7FFF', backgroundColor: '#13132a' },
  tabText: { fontFamily: 'BebasNeue_400Regular', fontSize: 13, color: '#404060', letterSpacing: 1 },
  tabTextActive: { color: '#9B7FFF' },
  section: { marginBottom: 20, gap: 10 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 12, color: '#6060A0', letterSpacing: 2 },
  cancelPickText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#9B7FFF' },
  noPickBox: { alignItems: 'center', paddingVertical: 24, gap: 8, marginBottom: 16 },
  noPickEmoji: { fontSize: 36 },
  noPickText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#6060A0', textAlign: 'center' },
  noGamesBox: { alignItems: 'center', paddingVertical: 24 },
  noGamesText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#6060A0' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d0d1b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e1e35',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#F0F0F5',
  },
  searchClear: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#404060' },
  moreText: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#404060', textAlign: 'center', paddingVertical: 8 },
});

const qs = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: '#0d0d1b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e1e35',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  value: { fontFamily: 'BebasNeue_400Regular', fontSize: 18, color: '#C0C0D8', lineHeight: 20 },
  label: { fontFamily: 'DMSans_400Regular', fontSize: 9, color: '#404060', letterSpacing: 1 },
});

const ph = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d0d1b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e1e35',
    padding: 10,
    gap: 10,
  },
  rowShame: { borderColor: '#3a1a1a', backgroundColor: '#0e0808' },
  date: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#404060', width: 32 },
  info: { flex: 1 },
  name: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#C0C0D8', fontWeight: '600' },
  matchup: { fontFamily: 'DMSans_400Regular', fontSize: 10, color: '#404060' },
  score: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, lineHeight: 24 },
});
