import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon, IconButton, Text, useTheme } from 'react-native-paper';

/**
 * AboutSettingsScreen
 *
 * Extracted from SettingsScreen footer. Functionality is preserved.
 */
export function AboutSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
            <View style={styles.headerText}>
              <Text variant="headlineMedium" style={styles.headerTitle}>
                About
              </Text>
              <Text variant="bodyLarge" style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                App info and version
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.aboutContainer}>
          <Icon source="code-tags" size={32} color={theme.colors.primary + '80'} />
          <Text variant="titleMedium" style={{ marginTop: 12, opacity: 0.7, fontWeight: '700' }}>
            JustDoIt
          </Text>
          <Text variant="bodySmall" style={{ opacity: 0.5, marginTop: 4 }}>
            Version 1.0.0 (Alpha)
          </Text>
          <Text variant="bodySmall" style={{ opacity: 0.4, marginTop: 2 }}>
            Designed for focus & flow
          </Text>
        </View>

        <View style={styles.footerSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
    fontSize: 28,
  },
  headerSubtitle: {
    opacity: 0.6,
    marginTop: 4,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  aboutContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
  },
  footerSpacing: {
    height: 40,
  },
});

export default AboutSettingsScreen;
