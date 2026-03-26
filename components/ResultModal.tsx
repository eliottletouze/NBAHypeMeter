import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { GameData } from '../hooks/useGames';
import { Player } from '../data/players';
import { useGameStats, PlayerStat } from '../hooks/useGameStats';
import { getTeamLogo } from '../data/teams';

interface Props {
  visible: boolean;
  game: GameData;
  favoritePlayers: Player[];
  onClose: () => void;
}

function Pill({ value, label, highlight = false }: { value: string | number; label: string; highlight?: boolean }) {
  return (
    <View style={sr.pill}>
      <Text style={[sr.pillVal, highlight && sr.pillHighlight]}>{value}</Text>
      <Text style={sr.pillLabel}>{label}</Text>
    </View>
  );
}

function StatRow({ stat, isFav = false }: { stat: PlayerStat; isFav?: boolean }) {
  return (
    <View style={sr.card}>
      {/* Nom + équipe */}
      <View style={sr.nameRow}>
        <Text style={[sr.name, isFav && sr.favName]} numberOfLines={1}>
          {isFav ? '⭐ ' : ''}{stat.name}
        </Text>
        {stat.teamTricode ? <Text style={sr.teamBadge}>{stat.teamTricode}</Text> : null}
      </View>
      {/* Ligne 1 : PTS REB AST STL BLK */}
      <View style={sr.pillRow}>
        <Pill value={stat.pts} label="PTS" highlight={isFav} />
        <Pill value={stat.reb} label="REB" />
        <Pill value={stat.ast} label="AST" />
        <Pill value={stat.stl} label="STL" />
        <Pill value={stat.blk} label="BLK" />
      </View>
      {/* Ligne 2 : FG% 3P% */}
      <View style={sr.pillRow}>
        <Pill value={stat.fgPct} label="FG%" />
        <Pill value={stat.fg3Pct} label="3P%" />
      </View>
    </View>
  );
}

export default function ResultModal({ visible, game, favoritePlayers, onClose }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const { home: homeStats, away: awayStats, loading } = useGameStats(confirmed ? game.gameId : null);

  const handleClose = () => {
    setConfirmed(false);
    onClose();
  };

  const homeWins = game.homeTeam.score > game.awayTeam.score;
  const top2Away = awayStats.slice(0, 2);
  const top2Home = homeStats.slice(0, 2);

  // Normalise les noms : minuscules, suppression des accents, apostrophes uniformisées
  function normName(s: string): string {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[''`\u2019]/g, "'")
      .trim();
  }

  // Map nom normalisé → équipe(s) pour fallback nom de famille + équipe
  const favFullNames = new Set(favoritePlayers.map(p => normName(p.name)));
  const favByLastName = new Map<string, Set<string>>();
  for (const p of favoritePlayers) {
    const parts = normName(p.name).split(' ');
    const lastName = parts.slice(1).join(' ');
    if (lastName.length > 2) {
      if (!favByLastName.has(lastName)) favByLastName.set(lastName, new Set());
      favByLastName.get(lastName)!.add(p.team);
    }
  }

  function isFavStat(stat: PlayerStat): boolean {
    const norm = normName(stat.name);
    if (favFullNames.has(norm)) return true;
    // Fallback : nom de famille + même équipe (couvre les abréviations ESPN)
    const lastName = norm.split(' ').slice(1).join(' ');
    if (lastName.length > 2 && favByLastName.has(lastName)) {
      return favByLastName.get(lastName)!.has(stat.teamTricode);
    }
    return false;
  }

  const favStats = [...awayStats, ...homeStats].filter(s => isFavStat(s));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          {!confirmed ? (
            <View style={styles.confirmWrap}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningTitle}>ATTENTION SPOIL</Text>
              <Text style={styles.warningBody}>
                Tu vas voir le score et les stats de ce match.{'\n'}Tu es sûr de vouloir te spoiler ?
              </Text>
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelText}>Non, annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={() => setConfirmed(true)}>
                  <Text style={styles.confirmText}>Oui, spoile-moi</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.resultsContent}>
              {/* Score */}
              <View style={styles.scoreRow}>
                <View style={styles.scoreTeam}>
                  <Image
                    source={{ uri: game.awayTeam.logo ?? getTeamLogo(game.awayTeam.teamTricode) }}
                    style={styles.scoreLogo}
                    resizeMode="contain"
                  />
                  <Text style={[styles.scoreNum, !homeWins && styles.winnerNum]}>
                    {game.awayTeam.score}
                  </Text>
                  <Text style={styles.scoreTricode}>{game.awayTeam.teamTricode}</Text>
                  {!homeWins && <Text style={styles.winBadge}>VAINQUEUR</Text>}
                </View>

                <Text style={styles.scoreDash}>—</Text>

                <View style={styles.scoreTeam}>
                  <Image
                    source={{ uri: game.homeTeam.logo ?? getTeamLogo(game.homeTeam.teamTricode) }}
                    style={styles.scoreLogo}
                    resizeMode="contain"
                  />
                  <Text style={[styles.scoreNum, homeWins && styles.winnerNum]}>
                    {game.homeTeam.score}
                  </Text>
                  <Text style={styles.scoreTricode}>{game.homeTeam.teamTricode}</Text>
                  {homeWins && <Text style={styles.winBadge}>VAINQUEUR</Text>}
                </View>
              </View>

              {loading ? (
                <ActivityIndicator color="#9B7FFF" style={{ marginVertical: 24 }} />
              ) : (
                <>

                  {favStats.length > 0 && (
                    <View style={styles.statsSection}>
                      <Text style={styles.sectionTitle}>
                        TES JOUEURS ({favStats.length})
                      </Text>
                      {favStats.map((s) => (
                        <StatRow key={s.name} stat={s} isFav />
                      ))}
                    </View>
                  )}

                  {(top2Away.length > 0 || top2Home.length > 0) && (
                    <View style={styles.statsSection}>
                      <Text style={styles.sectionTitle}>MEILLEURES PERFS</Text>
                      {[...top2Away, ...top2Home].map((s, i) => (
                        <StatRow key={i} stat={s} />
                      ))}
                    </View>
                  )}

                  {!loading && top2Away.length === 0 && top2Home.length === 0 && (
                    <Text style={styles.noStats}>Stats non disponibles</Text>
                  )}
                </>
              )}

              <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                <Text style={styles.closeBtnText}>Fermer</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  box: {
    backgroundColor: '#0d0d1b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e1e35',
    width: '100%',
    maxHeight: '85%',
    padding: 20,
  },
  // Confirmation
  confirmWrap: { alignItems: 'center', gap: 14 },
  warningIcon: { fontSize: 44 },
  warningTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 26,
    color: '#F5C842',
    letterSpacing: 2,
  },
  warningBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#8080A0',
    textAlign: 'center',
    lineHeight: 21,
  },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4, width: '100%' },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2e2e50',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#6060A0' },
  confirmBtn: {
    flex: 1.6,
    backgroundColor: '#1e1e35',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 16,
    color: '#F0F0F5',
    letterSpacing: 1,
  },
  // Results
  resultsContent: { gap: 0 },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scoreTeam: { alignItems: 'center', flex: 1, gap: 2 },
  scoreLogo: { width: 60, height: 60, marginBottom: 4 },
  scoreNum: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 48,
    color: '#2e2e50',
    lineHeight: 50,
  },
  winnerNum: { color: '#F0F0F5' },
  scoreTricode: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: '#6060A0',
    textTransform: 'uppercase',
  },
  winBadge: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 10,
    color: '#9B7FFF',
    letterSpacing: 1,
    marginTop: 2,
  },
  scoreDash: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 28,
    color: '#2e2e50',
    marginHorizontal: 4,
  },
  // Stats
  statsSection: { marginBottom: 16 },
  sectionTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 12,
    color: '#6060A0',
    letterSpacing: 2,
    marginBottom: 10,
  },
  noStats: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#404060',
    textAlign: 'center',
    marginVertical: 16,
  },
  closeBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#1e1e35',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  closeBtnText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#6060A0' },
});

const sr = StyleSheet.create({
  card: {
    backgroundColor: '#0a0a18',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a1a30',
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#8080A0',
    flex: 1,
  },
  favName: { color: '#D0D0E8', fontWeight: '600' },
  teamBadge: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 11,
    color: '#404060',
    letterSpacing: 1,
  },
  pillRow: { flexDirection: 'row', gap: 6 },
  pill: { alignItems: 'center', minWidth: 40, flex: 1 },
  pillVal: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 18,
    color: '#C0C0D8',
    lineHeight: 20,
  },
  pillHighlight: { color: '#9B7FFF' },
  pillLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 8,
    color: '#404060',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
