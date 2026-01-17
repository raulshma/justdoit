import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Platform, LayoutChangeEvent, Pressable } from 'react-native';
import { BlurView, BlurTint } from 'expo-blur';
import { useTheme } from 'react-native-paper';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../context/SettingsContext';

export function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const showLabels = settings.showTabBarLabels;

  // Filter out hidden routes (e.g. href: null)
  // Use useMemo to prevent unnecessary re-calculations
  const visibleRoutes = useMemo(() => {
    return state.routes.filter(route => {
      const { options } = descriptors[route.key];
      // Check for explicit href: null (Expo Router) or tabBarItemStyle: { display: 'none' }
      if ((options as any).href === null) return false;
      if ((options.tabBarItemStyle as any)?.display === 'none') return false;
      return true;
    });
  }, [state.routes, descriptors]);

  // Find the index of the active tab within the visible routes
  const currentRoute = state.routes[state.index];
  const activeRouteIndex = visibleRoutes.findIndex(r => r.key === currentRoute.key);
  
  // If active route is hidden, fallback to 0
  const validActiveIndex = activeRouteIndex >= 0 ? activeRouteIndex : 0;
  
  const [containerWidth, setContainerWidth] = React.useState(0);
  
  // Shared value for the active index (0, 1, 2, etc.)
  // We animate the INDEX, not the pixels, for better responsiveness
  const activeIndexAnim = useSharedValue(validActiveIndex);

  // Update animated index when active tab changes
  useEffect(() => {
    activeIndexAnim.value = withSpring(validActiveIndex, {
      damping: 15,
      stiffness: 150,
    });
  }, [validActiveIndex]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const blurTint: BlurTint = theme.dark ? 'dark' : 'light';
  const glassBackground = theme.dark ? 'rgba(30,30,30,0.5)' : 'rgba(255,255,255,0.7)';

  // Indicator style dynamically calculated based on current width and animated index
  const indicatorStyle = useAnimatedStyle(() => {
    if (!containerWidth || visibleRoutes.length === 0) return {};
    
    const tabWidth = containerWidth / visibleRoutes.length;
    
    // Dynamic dimensions based on showLabels
    const indicatorH = showLabels ? 64 : 42;
    // When labels are shown, scale width to fit tab with some padding
    // When icons only, use fixed pill width
    const indicatorW = showLabels ? (tabWidth - 24) : 48; 
    const indicatorRadius = showLabels ? 22 : 21;
    const marginTop = -indicatorH / 2;
    
    // Calculate position: (Index * TabWidth) + (Half TabWidth) - (Half IndicatorWidth)
    const translateX = (activeIndexAnim.value * tabWidth) + (tabWidth / 2) - (indicatorW / 2);

    return {
      width: indicatorW,
      height: indicatorH,
      borderRadius: indicatorRadius,
      transform: [
        { translateX } 
      ],
      marginTop,
      backgroundColor: theme.colors.secondaryContainer,
    };
  }, [containerWidth, visibleRoutes.length, showLabels, theme]);

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + 12 }]}>
      <BlurView
        intensity={80}
        tint={blurTint}
        style={[
          styles.container, 
          { 
            backgroundColor: glassBackground,
            borderColor: theme.colors.outlineVariant,
            height: showLabels ? 80 : 64,
          }
        ]}
        onLayout={handleLayout}
      >
        {/* Animated Background Indicator */}
        {containerWidth > 0 && (
           <Animated.View style={[styles.indicator, indicatorStyle]} />
        )}

        {visibleRoutes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = validActiveIndex === index;
          
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              isFocused={isFocused}
              label={label}
              options={options}
              onPress={onPress}
              onLongPress={onLongPress}
              theme={theme}
              showLabel={showLabels}
            />
          );
        })}
      </BlurView>
    </View>
  );
}

interface TabItemProps {
  isFocused: boolean;
  label: string | ((props: { focused: boolean; color: string; position: any; children: string }) => React.ReactNode);
  options: any;
  onPress: () => void;
  onLongPress: () => void;
  theme: any;
  showLabel: boolean;
}

// Separate component for individual tab to handle its own animations
function TabItem({ isFocused, label, options, onPress, onLongPress, theme, showLabel }: TabItemProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    // Subtle breathing animation: Scale down slightly then spring back
    // Avoids full disappearance for a smoother, more refined feel
    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }), 
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    opacity.value = withTiming(isFocused ? 1 : 0.7, { duration: 200 });
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const Icon = options.tabBarIcon;
  const iconColor = isFocused ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant;
  const textColor = isFocused ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      android_ripple={{ borderless: true, color: theme.colors.onSurfaceVariant }}
      style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
    >
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        {Icon && <Icon color={iconColor} size={26} focused={isFocused} />}
      </Animated.View>
      
      {showLabel && (
        <Animated.Text 
          style={[
            styles.label, 
            { color: textColor }, 
            animatedTextStyle
          ]}
        >
          {typeof label === 'string' ? label : ''}
        </Animated.Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
    zIndex: 100,
  },
  container: {
    flexDirection: 'row',
    height: 64, // Compact
    borderRadius: 32,
    marginHorizontal: 20, // Wider margins
    alignItems: 'center',
    justifyContent: 'space-around',
    overflow: 'hidden',
    borderWidth: 0.5,
    elevation: 4, // Softer shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, // Lighter shadow
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48, // Match indicator width
    height: 42, // Match indicator height
    borderRadius: 21,
    zIndex: 2,
  },
  indicator: {
    position: 'absolute',
    borderRadius: 21,
    top: '50%',
    left: 0, // Ensure strictly positioned from left to avoid implicit flex centering
    zIndex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: -4,
  },
});
