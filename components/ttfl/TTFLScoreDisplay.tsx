import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { TTFLPick } from '../../hooks/useTTFL';

interface Props {
  pick: TTFLPick;
  isLive?: boolean;
}

function scoreColor(s: number): string {
  if (s >= 40) return '#4CAF50';
  if (s >= 25) return '#F5C842';
  return '#E84040';
}

function StatLine({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={sl.row}>
      <Text style={sl.label}>{label}</Text>
      <Text style={[sl.value, highlight && sl.valueHighlight]}>{value}</Text>
    </View>
  );
}

export default function TTFLScoreDisplay({ pick, isLive }: Props) {
  const score = pick.stats?.ttflScore ?? null;
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (score !== null) {
      scale.value = withSpring(1, { damping: 12 });
      opacity.value = withTiming(1, { duration: 400 });
    }
  }, [score]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const s = pick.stats;
  const color = score !== null ? scoreColor(score) : '#6060A0';

  // Décomposition du score
  const twoMade    = s ? s.fgm - s.fg3m : 0;
  const twoMissed  = s ? (s.fga - s.fg3a) - twoMade : 0;
  const threeMissed = s ? s.fg3a - s.fg3m : 0;
  const ftMissed   = s ? s.fta - s.ftm : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.playerName}>{pick.playerName}</Text>
          <Text style={styles.matchup}>{pick.playerTeam} vs {pick.opponent}</Text>
        </View>
        {isLive && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveText}>● EN DIRECT</Text>
          </View>
        )}
      </View>

      {score === null ? (
        <View style={styles.pendingBox}>
          <Text style={styles.pendingEmoji}>⏳</Text>
          <Text style={styles.pendingText}>En attente du match...</Text>
        </View>
      ) : (
        <>
          {/* Grand score animé */}
          <Animated.View style={[styles.scoreBox, animStyle]}>
            <Text style={[styles.scoreValue, { color }]}>{score}</Text>
            <Text style={styles.scorePts}>pts TTFL</Text>
            {s?.isTripleDouble && <Text style={styles.bonusText}>TRIPLE-DOUBLE +3.0 🔥</Text>}
            {s?.isDoubleDouble && !s.isTripleDouble && <Text style={styles.bonusText}>DOUBLE-DOUBLE +1.5 ⭐</Text>}
          </Animated.View>

          {/* Décomposition */}
          {s && (
            <View style={styles.breakdown}>
              <Text style={styles.breakdownTitle}>DÉCOMPOSITION</Text>
              <View style={styles.breakdownGrid}>
                <View style={styles.breakdownCol}>
                  <StatLine label="PTS" value={`+${s.pts}`} highlight />
                  <StatLine label="REB" value={`+${s.reb}`} highlight />
                  <StatLine label="AST" value={`+${s.ast}`} highlight />
                  <StatLine label="STL" value={`+${s.stl}`} highlight />
                  <StatLine label="BLK" value={`+${s.blk}`} highlight />
                </View>
                <View style={styles.breakdownCol}>
                  <StatLine label="2pts ✓" value={`+${twoMade}`} highlight />
                  <StatLine label="3pts ✓" value={`+${s.fg3m}`} highlight />
                  <StatLine label="LF ✓"   value={`+${s.ftm}`}  highlight />
                  <StatLine label="2pts ✗" value={`-${twoMissed}`} />
                  <StatLine label="3pts ✗" value={`-${threeMissed}`} />
                  <StatLine label="LF ✗"   value={`-${ftMissed}`} />
                  <StatLine label="BP"     value={`-${s.tov}`} />
                </View>
              </View>
              <View style={styles.shootingRow}>
                <Text style={styles.shootingText}>
                  FG : {s.fgm}/{s.fga} · 3P : {s.fg3m}/{s.fg3a} · LF : {s.ftm}/{s.fta}
                </Text>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0d0d1b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e1e35',
    padding: 16,
    gap: 12,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  playerName: { fontFamily: 'DMSans_400Regular', fontSize: 15, color: '#F0F0F5', fontWeight: '700' },
  matchup: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#6060A0', marginTop: 2 },
  liveBadge: { backgroundColor: '#1a0a0a', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#E84040' },
  liveText: { fontFamily: 'BebasNeue_400Regular', fontSize: 11, color: '#E84040', letterSpacing: 1 },
  pendingBox: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  pendingEmoji: { fontSize: 32 },
  pendingText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#6060A0' },
  scoreBox: { alignItems: 'center', paddingVertical: 8 },
  scoreValue: { fontFamily: 'BebasNeue_400Regular', fontSize: 72, lineHeight: 76 },
  scorePts: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#6060A0', marginTop: -4 },
  bonusText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#F5C842', marginTop: 4, fontWeight: '600' },
  breakdown: { gap: 8 },
  breakdownTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 11, color: '#404060', letterSpacing: 2 },
  breakdownGrid: { flexDirection: 'row', gap: 16 },
  breakdownCol: { flex: 1, gap: 4 },
  shootingRow: { borderTopWidth: 1, borderTopColor: '#1e1e35', paddingTop: 8 },
  shootingText: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#6060A0', textAlign: 'center' },
});

const sl = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#6060A0' },
  value: { fontFamily: 'BebasNeue_400Regular', fontSize: 15, color: '#E84040', lineHeight: 17 },
  valueHighlight: { color: '#4CAF50' },
});
