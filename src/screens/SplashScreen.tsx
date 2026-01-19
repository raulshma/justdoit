import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Image, Animated, Modal } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import { useTheme } from 'react-native-paper';
import { colorPalettes } from '../theme/colors';

type Props = {
  isAppReady: boolean;
  onAnimationComplete: () => void;
};

const SplashScreen: React.FC<Props> = ({ isAppReady, onAnimationComplete }) => {
  const theme = useTheme();
  const [isBootSplashHidden, setIsBootSplashHidden] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isAppReady && !isBootSplashHidden) {
      const initAnimation = async () => {
        // Hide the native boot splash immediately
        await BootSplash.hide({ fade: false });
        setIsBootSplashHidden(true);

        // Start the fade out animation
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.5,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onAnimationComplete();
        });
      };

      initAnimation();
    }
  }, [isAppReady, isBootSplashHidden, onAnimationComplete, opacity, scale]);

  return (
    <Modal
      transparent
      visible
      statusBarTranslucent
      animationType="none"
      hardwareAccelerated
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Animated.View style={[styles.logoContainer, { opacity, transform: [{ scale }] }]}>
          <Image
            source={require('../../assets/bootsplash/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorPalettes.default.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100, // Matches --logo-width
    height: 100,
  },
});

export default SplashScreen;
