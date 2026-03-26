import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { PlacedBet, BettingStats } from '../../hooks/useBetting';

interface Props {
  bets: PlacedBet[];
  stats: BettingStats;
  balance: number;
  onReset: () => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

const STATUS_CONFIG = {
  pending: { label: 'EN COURS', color: '#F5C842' },
  won:     { label: '✅ GAGNÉ',  color: '#4CAF50' },
  lost:    { label: '❌ PERDU',  color: '#E84040' },
  void:    { label: 'ANNULÉ',   color: '#6060A0' },
};

export default function BetHistory({ bets, stats, balance, onReset }: Props) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? bets : bets.slice(0, 5);

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <StatBox label="PARIS" value={String(stats.total)} />
        <StatBox label="GAGNÉS" value={String(stats.won)} color="#4CAF50" />
        <StatBox label="TAUX" value={`${stats.winRate}%`} color="#9B7FFF" />
        <StatBox
          label="BILAN"
          value={`${stats.totalGain >= 0 ? '+' : ''}${stats.totalGain.toLocaleString('fr-FR')}`}
          color={stats.totalGain >= 0 ? '#4CAF50' : '#E84040'}
        />
      </View>

      {/* Reset si solde à 0 */}
      {balance === 0 && (
        <View style={styles.brokeBox}>
          <Text style={styles.brokeEmoji}>💸</Text>
          <Text style={styles.brokeText}>
            T'as tout perdu champion... Ça arrive aux meilleurs.
          </Text>
          <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
            <Text style={styles.resetBtnText}>RECOMMENCER (1 000 💰)</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Historique */}
      {bets.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>HISTORIQUE</Text>
          {displayed.map(bet => (
            <BetRow key={bet.id} bet={bet} />
          ))}
          {bets.length > 5 && (
            <TouchableOpacity onPress={() => setShowAll(v => !v)} style={styles.seeMore}>
              <Text style={styles.seeMoreText}>
                {showAll ? 'Voir moins' : `Voir les ${bets.length - 5} autres`}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

function BetRow({ bet }: { bet: PlacedBet }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[bet.status];

  return (
    <TouchableOpacity
      style={[styles.betRow, bet.status === 'won' && styles.betRowWon, bet.status === 'lost' && styles.betRowLost]}
      onPress={() => setOpen(v => !v)}
      activeOpacity={0.8}
    >
      <View style={styles.betRowTop}>
        <View style={styles.betRowLeft}>
          <Text style={styles.betDate}>{formatDate(bet.placedAt)}</Text>
          <Text style={styles.betLabel} numberOfLines={1}>
            {bet.items.length === 1
              ? `${bet.items[0].gameLabel} — ${bet.items[0].selectionLabel}`
              : `Combiné ×${bet.items.length}`}
          </Text>
        </View>
        <View style={styles.betRowRight}>
          <Text style={[styles.betStatus, { color: cfg.color }]}>{cfg.label}</Text>
          <Text style={styles.betOdds}>{bet.combinedOdds.toFixed(2)}x</Text>
        </View>
      </View>
      <View style={styles.betRowBottom}>
        <Text style={styles.betStake}>Mise : {bet.stake.toLocaleString('fr-FR')} 💰</Text>
        <Text style={[styles.betGain, {
          color: bet.status === 'won' ? '#4CAF50' : bet.status === 'lost' ? '#E84040' : '#6060A0',
        }]}>
          {bet.status === 'won'
            ? `+${(bet.potentialWin - bet.stake).toLocaleString('fr-FR')} 💰`
            : bet.status === 'lost'
            ? `-${bet.stake.toLocaleString('fr-FR')} 💰`
            : `→ ${bet.potentialWin.toLocaleString('fr-FR')} 💰`}
        </Text>
      </View>

      {open && bet.items.length > 1 && (
        <View style={styles.betDetails}>
          {bet.items.map(item => (
            <Text key={item.id} style={styles.betDetailLine}>
              · {item.gameLabel} — {item.selectionLabel} ({item.odds.toFixed(2)})
            </Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

function StatBox({ label, value, color = '#C0C0D8' }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 0 },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0d0d1b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e1e35',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 2,
  },
  statValue: { fontFamily: 'BebasNeue_400Regular', fontSize: 20, lineHeight: 22 },
  statLabel: { fontFamily: 'DMSans_400Regular', fontSize: 9, color: '#404060', letterSpacing: 1 },
  brokeBox: {
    backgroundColor: '#1a0a0a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a1a1a',
    padding: 16,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  brokeEmoji: { fontSize: 36 },
  brokeText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#8080A0', textAlign: 'center', lineHeight: 19 },
  resetBtn: { backgroundColor: '#E84040', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  resetBtnText: { fontFamily: 'BebasNeue_400Regular', fontSize: 14, color: '#fff', letterSpacing: 1 },
  sectionTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 12, color: '#6060A0', letterSpacing: 2, marginBottom: 8 },
  betRow: {
    backgroundColor: '#0d0d1b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e1e35',
    padding: 12,
    marginBottom: 6,
    gap: 6,
  },
  betRowWon: { borderColor: '#2a4a2a' },
  betRowLost: { borderColor: '#3a1a1a' },
  betRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  betRowLeft: { flex: 1, gap: 2 },
  betRowRight: { alignItems: 'flex-end', gap: 2 },
  betDate: { fontFamily: 'DMSans_400Regular', fontSize: 10, color: '#404060' },
  betLabel: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#C0C0D8', fontWeight: '600', maxWidth: 200 },
  betStatus: { fontFamily: 'BebasNeue_400Regular', fontSize: 11, letterSpacing: 1 },
  betOdds: { fontFamily: 'BebasNeue_400Regular', fontSize: 18, color: '#6060A0', lineHeight: 20 },
  betRowBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  betStake: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#6060A0' },
  betGain: { fontFamily: 'DMSans_400Regular', fontSize: 12, fontWeight: '700' },
  betDetails: { borderTopWidth: 1, borderTopColor: '#1e1e35', paddingTop: 8, gap: 4 },
  betDetailLine: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#6060A0' },
  seeMore: { alignItems: 'center', paddingVertical: 10 },
  seeMoreText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#9B7FFF' },
});
