import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TTFLPick } from '../../hooks/useTTFL';

export interface PlayerOption {
  name: string;
  team: string;
  opponent: string;
  isStar: boolean;
  recentScores: (number | null)[]; // 5 derniers scores TTFL (null = pas de données)
  cooldownDays: number;
  estimatedAvg: number | null; // estimation via moyennes de saison
}

interface Props {
  player: PlayerOption;
  isSelected: boolean;
  onSelect: () => void;
}

function scoreColor(s: number): string {
  if (s >= 40) return '#4CAF50';
  if (s >= 25) return '#F5C842';
  return '#E84040';
}

export default function TTFLPlayerCard({ player, isSelected, onSelect }: Props) {
  const isOnCooldown = player.cooldownDays > 0;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
        isOnCooldown && styles.cardCooldown,
      ]}
      onPress={onSelect}
      disabled={isOnCooldown}
      activeOpacity={0.8}
    >
      {/* Nom + équipe */}
      <View style={styles.nameRow}>
        <View style={styles.nameCol}>
          <Text style={[styles.name, isOnCooldown && styles.nameCooldown]} numberOfLines={1}>
            {player.isStar ? '⭐ ' : ''}{player.name}
          </Text>
          <Text style={styles.matchup}>{player.team} vs {player.opponent}</Text>
        </View>

        {isOnCooldown ? (
          <View style={styles.cooldownBadge}>
            <Text style={styles.cooldownText}>⏳ {player.cooldownDays}j</Text>
          </View>
        ) : isSelected ? (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedText}>✓ CHOISI</Text>
          </View>
        ) : player.estimatedAvg !== null ? (
          <View style={styles.avgBadge}>
            <Text style={styles.avgValue}>{player.estimatedAvg.toFixed(0)}</Text>
            <Text style={styles.avgLabel}>moy.</Text>
          </View>
        ) : null}
      </View>

      {/* 5 derniers scores */}
      <View style={styles.scoresRow}>
        <Text style={styles.scoresLabel}>5 derniers :</Text>
        <View style={styles.scores}>
          {player.recentScores.length === 0
            ? <Text style={styles.noScore}>—</Text>
            : player.recentScores.slice(0, 5).map((s, i) => (
                <Text
                  key={i}
                  style={[styles.scoreChip, s !== null && { color: scoreColor(s) }]}
                >
                  {s !== null ? s.toFixed(0) : '—'}
                </Text>
              ))
          }
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0d0d1b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e1e35',
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  cardSelected: { borderColor: '#9B7FFF', backgroundColor: '#0f0f25' },
  cardCooldown: { opacity: 0.45 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameCol: { flex: 1 },
  name: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#D0D0E8', fontWeight: '600' },
  nameCooldown: { color: '#404060' },
  matchup: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#6060A0', marginTop: 2 },
  cooldownBadge: { backgroundColor: '#1a1a30', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  cooldownText: { fontFamily: 'BebasNeue_400Regular', fontSize: 13, color: '#6060A0', letterSpacing: 0.5 },
  selectedBadge: { backgroundColor: '#1e1040', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#9B7FFF' },
  selectedText: { fontFamily: 'BebasNeue_400Regular', fontSize: 13, color: '#9B7FFF', letterSpacing: 0.5 },
  avgBadge: { alignItems: 'center', minWidth: 40 },
  avgValue: { fontFamily: 'BebasNeue_400Regular', fontSize: 20, color: '#C0C0D8', lineHeight: 22 },
  avgLabel: { fontFamily: 'DMSans_400Regular', fontSize: 9, color: '#404060', letterSpacing: 0.5 },
  scoresRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoresLabel: { fontFamily: 'DMSans_400Regular', fontSize: 10, color: '#404060' },
  scores: { flexDirection: 'row', gap: 6 },
  scoreChip: { fontFamily: 'BebasNeue_400Regular', fontSize: 16, color: '#404060', lineHeight: 18 },
  noScore: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#404060' },
});
