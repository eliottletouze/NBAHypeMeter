import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { GameData } from '../hooks/useYesterdayGames';
import { Player } from '../data/players';
import { computeHype, HypeBreakdown } from '../utils/hype';
import { getTeam } from '../data/teams';
import HypeRing from './HypeRing';
import AnimatedBar from './AnimatedBar';

interface Props {
  game: GameData | null;
  favoritePlayers: Player[];
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function HypeModal({ game, favoritePlayers, onClose }: Props) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const visible = game !== null;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 150,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!game) return null;

  const hype: HypeBreakdown = computeHype(
    game.homeTeam.score,
    game.awayTeam.score,
    game.homeTeam.teamTricode,
    game.awayTeam.teamTricode,
    favoritePlayers
  );

  const homeTeam = getTeam(game.homeTeam.teamTricode);
  const awayTeam = getTeam(game.awayTeam.teamTricode);

  const verdictColor =
    hype.total >= 8 ? '#F0F0F5' : hype.total >= 6 ? '#F5C842' : hype.total >= 4 ? '#F5C842' : '#6060A0';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={[styles.backdrop, { opacity: backdropAnim }]}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* Handle */}
        <View style={styles.handle} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Title */}
          <Text style={styles.matchTitle}>
            {awayTeam.emoji} {awayTeam.name.toUpperCase()} × {homeTeam.name.toUpperCase()} {homeTeam.emoji}
          </Text>

          {/* Ring */}
          <HypeRing score={hype.total} />

          {/* Verdict */}
          <View style={[styles.verdictBadge, { borderColor: verdictColor }]}>
            <Text style={[styles.verdictText, { color: verdictColor }]}>
              {hype.verdictEmoji} {hype.verdict}
            </Text>
          </View>

          {/* Summary */}
          <Text style={styles.summary}>{hype.summary}</Text>

          {/* Criteria bars */}
          <Text style={styles.sectionTitle}>ANALYSE</Text>

          <AnimatedBar label="Match serré" score={hype.closenessScore} />
          <AnimatedBar label="Intensité offensive" score={hype.intensityScore} />
          {hype.overtimeScore > 0 && (
            <AnimatedBar label="Suspense final" score={hype.overtimeScore} />
          )}

          {/* Player scores */}
          {hype.playerScores.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>TES JOUEURS</Text>
              {hype.playerScores.map(({ player, score, isPresent }) => (
                <View key={player.id}>
                  {isPresent ? (
                    <AnimatedBar
                      label={`${player.isStar ? '⭐' : '🏀'} ${player.name}`}
                      score={score}
                    />
                  ) : (
                    <View style={styles.absentRow}>
                      <Text style={styles.absentName}>❌ {player.name}</Text>
                      <Text style={styles.absentLabel}>Absent de ce match</Text>
                    </View>
                  )}
                </View>
              ))}
            </>
          )}

          <View style={styles.bottomPad} />
        </ScrollView>

        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.closeBtnText}>FERMER</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0d0d1b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.88,
    borderTopWidth: 1,
    borderColor: '#1e1e35',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#1e1e35',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  matchTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    color: '#F0F0F5',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 24,
  },
  verdictBadge: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  verdictText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 18,
    letterSpacing: 1,
  },
  summary: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#9090B0',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 13,
    color: '#6060A0',
    letterSpacing: 2,
    marginBottom: 14,
  },
  absentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#131325',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e1e35',
  },
  absentName: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#6060A0',
  },
  absentLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: '#404060',
  },
  closeBtn: {
    margin: 16,
    marginBottom: 32,
    backgroundColor: '#131325',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e1e35',
  },
  closeBtnText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 16,
    color: '#6060A0',
    letterSpacing: 2,
  },
  bottomPad: {
    height: 8,
  },
});
