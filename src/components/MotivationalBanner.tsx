import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import quotesData from '../data/quotes.json';

/**
 * Collection of motivational quotes for daily inspiration
 * Loaded from external JSON file for easy maintenance
 */
const MOTIVATIONAL_QUOTES = quotesData.quotes;

interface MotivationalBannerProps {
  rotationInterval?: number;
}

/**
 * MotivationalBanner Component
 * High Fidelity: Minimalist, clean typography, subtle background.
 */
export const MotivationalBanner: React.FC<MotivationalBannerProps> = ({
  rotationInterval = 30000,
}) => {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
  );
  
  // Animation value for dissolve effect
  const fadeAnim = useState(new Animated.Value(1))[0];

  const animateTransition = useCallback(() => {
    // 1. Dissolve Out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start(() => {
      // 2. Change Content
      setCurrentIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);

      // 3. Dissolve In
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }).start();
    });
  }, [fadeAnim]);

  useEffect(() => {
    const interval = setInterval(animateTransition, rotationInterval);
    return () => clearInterval(interval);
  }, [animateTransition, rotationInterval]);

  const currentQuote = MOTIVATIONAL_QUOTES[currentIndex];

  return (
    <View style={styles.container}>
      <Surface style={[styles.pill, { backgroundColor: theme.colors.surfaceVariant + '80' }]} elevation={0}>
        <Animated.View 
          style={[
            styles.content, 
            { opacity: fadeAnim }
          ]}
        >
          <Text
            variant="bodyLarge"
            style={[styles.quote, { color: theme.colors.onSurface }]}
          >
            {`"${currentQuote.quote}"`}
          </Text>
          <Text
            variant="labelSmall"
            style={[styles.author, { color: theme.colors.primary }]}
          >
            {currentQuote.author}
          </Text>
        </Animated.View>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  pill: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 30, // Pill shape
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  quote: {
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
    fontWeight: '400',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  author: {
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
});

export default MotivationalBanner;
