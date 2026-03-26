import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface Props {
  label: string;
  score: number; // 0-10
  color?: string;
}

export default function AnimatedBar({ label, score, color = '#F0F0F5' }: Props) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: score / 10,
      duration: 800,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const barColor = score >= 7 ? '#F0F0F5' : score >= 4 ? '#F5C842' : '#E84040';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color: barColor }]}>{score}/10</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: barColor,
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#9090B0',
  },
  value: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 15,
  },
  track: {
    height: 6,
    backgroundColor: '#1e1e35',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
