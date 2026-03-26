import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';

interface Props {
  score: number; // 0-10
}

const SIZE = 140;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function getRingColor(score: number): string {
  if (score >= 7) return '#F0F0F5';
  if (score >= 4) return '#F5C842';
  return '#E84040';
}

export default function HypeRing({ score }: Props) {
  const progress = useSharedValue(0);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    progress.value = withTiming(score / 10, { duration: 1000 });
    // Animate the displayed number
    let start = 0;
    const step = score / 30;
    const interval = setInterval(() => {
      start += step;
      if (start >= score) {
        setDisplayScore(score);
        clearInterval(interval);
      } else {
        setDisplayScore(Math.round(start * 10) / 10);
      }
    }, 33);
    return () => clearInterval(interval);
  }, [score]);

  const animatedProps = useAnimatedProps(() => {
    const offset = CIRCUMFERENCE * (1 - progress.value);
    return {
      strokeDashoffset: offset,
    };
  });

  const color = getRingColor(score);

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        {/* Background track */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="#1e1e35"
          strokeWidth={STROKE}
          fill="none"
        />
        {/* Animated arc */}
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90, ${SIZE / 2}, ${SIZE / 2})`}
        />
      </Svg>
      <View style={styles.centerContent} pointerEvents="none">
        <Text style={[styles.scoreText, { color }]}>
          {displayScore % 1 === 0 ? displayScore.toFixed(0) : displayScore.toFixed(1)}
        </Text>
        <Text style={styles.outOfText}>/10</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 44,
    lineHeight: 48,
  },
  outOfText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#6060A0',
  },
});
