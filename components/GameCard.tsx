import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { GameData } from '../hooks/useGames';
import { Player } from '../data/players';
import { getTeam, getTeamLogo } from '../data/teams';
import { computeHype } from '../utils/hype';
import ResultModal from './ResultModal';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 80;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function getRingColor(score: number): string {
  if (score >= 7) return '#F0F0F5';
  if (score >= 4) return '#F5C842';
  return '#E84040';
}

function MiniRing({ score }: { score: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(200, withTiming(score / 10, { duration: 900 }));
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE * (1 - progress.value),
  }));

  const color = getRingColor(score);

  return (
    <View style={miniRingStyles.container}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} stroke="#1e1e35" strokeWidth={RING_STROKE} fill="none" />
        <AnimatedCircle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
          stroke={color} strokeWidth={RING_STROKE} fill="none"
          strokeDasharray={RING_CIRCUMFERENCE}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90, ${RING_SIZE / 2}, ${RING_SIZE / 2})`}
        />
      </Svg>
      <View style={miniRingStyles.center} pointerEvents="none">
        <Text style={[miniRingStyles.score, { color }]}>{score % 1 === 0 ? score.toFixed(0) : score.toFixed(1)}</Text>
        <Text style={miniRingStyles.outOf}>/10</Text>
      </View>
    </View>
  );
}

const miniRingStyles = StyleSheet.create({
  container: { width: RING_SIZE, height: RING_SIZE, justifyContent: 'center', alignItems: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  score: { fontFamily: 'BebasNeue_400Regular', fontSize: 24, lineHeight: 26 },
  outOf: { fontFamily: 'DMSans_400Regular', fontSize: 9, color: '#6060A0' },
});

function MiniBar({ score, delay = 0 }: { score: number; delay?: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay + 300, withTiming(score / 10, { duration: 700 }));
  }, [score]);

  const animatedStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` as any }));
  const color = score >= 7 ? '#F0F0F5' : score >= 4 ? '#F5C842' : '#E84040';

  return (
    <View style={barStyles.track}>
      <Animated.View style={[barStyles.fill, { backgroundColor: color }, animatedStyle]} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: { height: 4, backgroundColor: '#1a1a2e', borderRadius: 2, overflow: 'hidden', flex: 1 },
  fill: { height: '100%', borderRadius: 2 },
});

interface Props {
  game: GameData;
  favoritePlayers: Player[];
}

export default function GameCard({ game, favoritePlayers }: Props) {
  const homeTeam = getTeam(game.homeTeam.teamTricode);
  const awayTeam = getTeam(game.awayTeam.teamTricode);

  // Carte simplifiée pour les matchs à venir / en cours
  if (game.gameStatus !== 3) {
    const hasFav = favoritePlayers.some(
      p => p.team === game.homeTeam.teamTricode || p.team === game.awayTeam.teamTricode
    );
    return (
      <View style={[styles.card, hasFav && upcomingStyles.favBorder]}>
        <View style={styles.topRow}>
          <View style={styles.teamBlock}>
            <Image source={{ uri: game.awayTeam.logo ?? getTeamLogo(awayTeam.abbr) }} style={styles.logo} resizeMode="contain" />
            <Text style={styles.tricode}>{awayTeam.abbr}</Text>
            <Text style={styles.teamName}>{awayTeam.name}</Text>
          </View>
          <View style={upcomingStyles.center}>
            <Text style={upcomingStyles.vs}>VS</Text>
            {game.gameTime && <Text style={upcomingStyles.time}>{game.gameTime}</Text>}
            {game.gameStatus === 2 && <Text style={upcomingStyles.live}>● EN DIRECT</Text>}
          </View>
          <View style={styles.teamBlock}>
            <Image source={{ uri: game.homeTeam.logo ?? getTeamLogo(homeTeam.abbr) }} style={styles.logo} resizeMode="contain" />
            <Text style={styles.tricode}>{homeTeam.abbr}</Text>
            <Text style={styles.teamName}>{homeTeam.name}</Text>
          </View>
        </View>
        {hasFav && (
          <View style={upcomingStyles.favRow}>
            {favoritePlayers
              .filter(p => p.team === game.homeTeam.teamTricode || p.team === game.awayTeam.teamTricode)
              .map(p => (
                <View key={p.id} style={upcomingStyles.favBadge}>
                  <Text style={upcomingStyles.favBadgeText}>⭐ {p.name.split(' ').pop()}</Text>
                </View>
              ))}
          </View>
        )}
      </View>
    );
  }

  const [showResult, setShowResult] = useState(false);

  const hype = useMemo(() => computeHype(
    game.homeTeam.score, game.awayTeam.score,
    game.homeTeam.teamTricode, game.awayTeam.teamTricode,
    favoritePlayers
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [game.gameId, game.homeTeam.score, game.awayTeam.score, game.homeTeam.teamTricode, game.awayTeam.teamTricode, favoritePlayers]);

  const diff = Math.abs(game.homeTeam.score - game.awayTeam.score);
  const badges: { label: string; color: string }[] = [];
  if (diff <= 4) badges.push({ label: '⏱️ OT possible', color: '#E84040' });
  else if (diff <= 10) badges.push({ label: '🔥 Match serré', color: '#F5C842' });
  for (const p of favoritePlayers) {
    if (p.team === game.homeTeam.teamTricode || p.team === game.awayTeam.teamTricode) {
      badges.push({ label: `⭐ ${p.name.split(' ')[1] ?? p.name}`, color: '#9B7FFF' });
    }
  }

  const verdictColor = hype.total >= 8 ? '#F0F0F5' : hype.total >= 6 ? '#F5C842' : hype.total >= 4 ? '#F5C842' : '#404060';
  const hasFav = favoritePlayers.some(
    p => p.team === game.homeTeam.teamTricode || p.team === game.awayTeam.teamTricode
  );

  return (
    <View style={[styles.card, hasFav && upcomingStyles.favBorder]}>
      {/* Teams + Ring row */}
      <View style={styles.topRow}>
        <View style={styles.teamBlock}>
          <Image source={{ uri: game.awayTeam.logo ?? getTeamLogo(awayTeam.abbr) }} style={styles.logo} resizeMode="contain" />
          <Text style={styles.tricode}>{awayTeam.abbr}</Text>
          <Text style={styles.teamName}>{awayTeam.name}</Text>
        </View>

        <MiniRing score={hype.total} />

        <View style={styles.teamBlock}>
          <Image source={{ uri: game.homeTeam.logo ?? getTeamLogo(homeTeam.abbr) }} style={styles.logo} resizeMode="contain" />
          <Text style={styles.tricode}>{homeTeam.abbr}</Text>
          <Text style={styles.teamName}>{homeTeam.name}</Text>
        </View>
      </View>

      {/* Verdict */}
      <View style={[styles.verdictRow, { borderColor: verdictColor }]}>
        <Text style={[styles.verdictText, { color: verdictColor }]}>
          {hype.verdictEmoji} {hype.verdict}
        </Text>
      </View>

      {/* Badges */}
      {badges.length > 0 && (
        <View style={styles.badgesRow}>
          {badges.map((b, i) => (
            <View key={i} style={[styles.badge, { borderColor: b.color }]}>
              <Text style={[styles.badgeText, { color: b.color }]}>{b.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Criteria bars */}
      <View style={styles.barsSection}>
        <View style={styles.barRow}>
          <Text style={styles.barLabel}>Serré</Text>
          <MiniBar score={hype.closenessScore} delay={0} />
          <Text style={[styles.barValue, { color: getRingColor(hype.closenessScore) }]}>{hype.closenessScore}</Text>
        </View>
        <View style={styles.barRow}>
          <Text style={styles.barLabel}>Intensité</Text>
          <MiniBar score={hype.intensityScore} delay={100} />
          <Text style={[styles.barValue, { color: getRingColor(hype.intensityScore) }]}>{hype.intensityScore}</Text>
        </View>
        {hype.overtimeScore > 0 && (
          <View style={styles.barRow}>
            <Text style={styles.barLabel}>Suspense</Text>
            <MiniBar score={hype.overtimeScore} delay={200} />
            <Text style={[styles.barValue, { color: getRingColor(hype.overtimeScore) }]}>{hype.overtimeScore}</Text>
          </View>
        )}
        {hype.playerScores.filter(({ isPresent }) => isPresent).map(({ player, score }, i) => (
          <View key={player.id} style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>
              {`⭐ ${player.name.split(' ')[1] ?? player.name}`}
            </Text>
            <MiniBar score={score} delay={300 + i * 80} />
            <Text style={[styles.barValue, { color: getRingColor(score) }]}>{score}</Text>
          </View>
        ))}
      </View>

      {/* Spoil button */}
      <TouchableOpacity style={styles.spoilBtn} onPress={() => setShowResult(true)}>
        <Text style={styles.spoilBtnText}>👁 Voir le résultat</Text>
      </TouchableOpacity>

      <ResultModal
        visible={showResult}
        game={game}
        favoritePlayers={favoritePlayers}
        onClose={() => setShowResult(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0d0d1b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e1e35',
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  teamBlock: { alignItems: 'center', flex: 1 },
  logo: { width: 44, height: 44, marginBottom: 4 },
  tricode: { fontFamily: 'BebasNeue_400Regular', fontSize: 20, color: '#F0F0F5', letterSpacing: 1 },
  teamName: { fontFamily: 'DMSans_400Regular', fontSize: 10, color: '#6060A0', textTransform: 'uppercase' },
  verdictRow: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 10,
  },
  verdictText: { fontFamily: 'BebasNeue_400Regular', fontSize: 14, letterSpacing: 1 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  badge: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: 'DMSans_400Regular', fontSize: 10, fontWeight: '600' },
  barsSection: { gap: 8, marginBottom: 10 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#6060A0', width: 58 },
  barValue: { fontFamily: 'BebasNeue_400Regular', fontSize: 13, width: 18, textAlign: 'right' },
  summary: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#505070', lineHeight: 17 },
  spoilBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2e2e50',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  spoilBtnText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#6060A0', fontWeight: '600' },
});

const upcomingStyles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: 4 },
  vs: { fontFamily: 'BebasNeue_400Regular', fontSize: 18, color: '#404060', letterSpacing: 2 },
  time: { fontFamily: 'BebasNeue_400Regular', fontSize: 20, color: '#9B7FFF', letterSpacing: 1 },
  live: { fontFamily: 'DMSans_400Regular', fontSize: 10, color: '#E84040', fontWeight: '700', letterSpacing: 1 },
  favBorder: { borderColor: '#9B7FFF' },
  favRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  favBadge: { borderWidth: 1, borderColor: '#9B7FFF', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  favBadgeText: { fontFamily: 'DMSans_400Regular', fontSize: 10, color: '#9B7FFF', fontWeight: '600' },
});
