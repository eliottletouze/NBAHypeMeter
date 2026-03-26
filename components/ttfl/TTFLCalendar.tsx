import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { TTFLPick } from '../../hooks/useTTFL';

interface Props {
  picks: TTFLPick[];
}

const MONTHS_FR = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
const DAYS_FR   = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function scoreColor(s: number): string {
  if (s >= 40) return '#4CAF50';
  if (s >= 25) return '#F5C842';
  return '#E84040';
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  // 0 = Lundi ... 6 = Dimanche (format FR)
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}

export default function TTFLCalendar({ picks }: Props) {
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay    = getFirstDayOfMonth(viewYear, viewMonth);

  // Map date string → pick
  const pickMap: Record<string, TTFLPick> = {};
  for (const p of picks) {
    pickMap[p.date] = p;
  }

  function dateStr(day: number): string {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const canGoNext = viewYear < today.getFullYear() || viewMonth < today.getMonth();

  // Grille : remplir les cases vides du début
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  // Compléter pour avoir un nombre multiple de 7
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={styles.container}>
      {/* Navigation mois */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {MONTHS_FR[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]} disabled={!canGoNext}>
          <Text style={styles.navBtnText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Jours de la semaine */}
      <View style={styles.weekRow}>
        {DAYS_FR.map((d, i) => (
          <Text key={i} style={styles.weekLabel}>{d}</Text>
        ))}
      </View>

      {/* Grille */}
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`empty_${i}`} style={styles.cell} />;
          const ds = dateStr(day);
          const pick = pickMap[ds];
          const score = pick?.stats?.ttflScore ?? null;
          const isToday = ds === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

          return (
            <View
              key={ds}
              style={[
                styles.cell,
                isToday && styles.cellToday,
                pick && !pick.stats && styles.cellPending,
              ]}
            >
              <Text style={[styles.cellDay, isToday && styles.cellDayToday]}>{day}</Text>
              {score !== null && (
                <Text style={[styles.cellScore, { color: scoreColor(score) }]}>
                  {score.toFixed(0)}
                </Text>
              )}
              {pick && !pick.stats && (
                <View style={styles.cellDot} />
              )}
            </View>
          );
        })}
      </View>

      {/* Légende */}
      <View style={styles.legend}>
        <LegendDot color="#4CAF50" label="≥40" />
        <LegendDot color="#F5C842" label="25-39" />
        <LegendDot color="#E84040" label="<25" />
        <View style={styles.legendDotPending} /><Text style={styles.legendLabel}>En cours</Text>
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const CELL_SIZE = 42;

const styles = StyleSheet.create({
  container: { gap: 8 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  navBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#131325' },
  navBtnDisabled: { opacity: 0.25 },
  navBtnText: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, color: '#D0D0D8', lineHeight: 26 },
  monthLabel: { fontFamily: 'BebasNeue_400Regular', fontSize: 16, color: '#D0D0E8', letterSpacing: 1 },
  weekRow: { flexDirection: 'row' },
  weekLabel: { flex: 1, textAlign: 'center', fontFamily: 'DMSans_400Regular', fontSize: 10, color: '#404060', paddingVertical: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    padding: 2,
    gap: 1,
  },
  cellToday: { backgroundColor: '#131325', borderWidth: 1, borderColor: '#9B7FFF' },
  cellPending: { backgroundColor: '#0f0f1e' },
  cellDay: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#6060A0' },
  cellDayToday: { color: '#9B7FFF', fontWeight: '700' },
  cellScore: { fontFamily: 'BebasNeue_400Regular', fontSize: 14, lineHeight: 15 },
  cellDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#F5C842' },
  legend: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 4, alignItems: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendDotPending: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#F5C842', marginRight: 4 },
  legendLabel: { fontFamily: 'DMSans_400Regular', fontSize: 10, color: '#404060' },
});
