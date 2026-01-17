import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LegendList } from '@legendapp/list';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  useTheme,
  Surface,
  TouchableRipple,
  Searchbar,
  Icon,
  Chip,
} from 'react-native-paper';
import type { ModelSelectionScreenProps } from '../navigation/types';
import { aiService, type OpenRouterModel, type GroupedModels } from '../services/aiService';
import { useSettings } from '../context/SettingsContext';
import { ThemedIcon } from '../components/ThemedIcon';

/**
 * Format context length for display
 */
const formatContextLength = (length?: number): string => {
  if (!length) return 'Unknown';
  if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`;
  if (length >= 1000) return `${Math.round(length / 1000)}K`;
  return `${length}`;
};

/**
 * Format pricing for display (per million tokens)
 */
const formatPricing = (price: string): string => {
  const num = parseFloat(price);
  if (num === 0) return 'Free';
  // Price is per token, convert to per million
  const perMillion = num * 1000000;
  if (perMillion < 0.01) return '<$0.01/M';
  if (perMillion < 1) return `$${perMillion.toFixed(2)}/M`;
  return `$${perMillion.toFixed(2)}/M`;
};

/**
 * Get modality icon and label
 */
const getModalityInfo = (modality?: string): { icon: string; label: string; color: string }[] => {
  if (!modality) return [{ icon: 'text', label: 'Text', color: '#6366f1' }];
  
  const info: { icon: string; label: string; color: string }[] = [];
  
  if (modality.includes('text')) {
    info.push({ icon: 'text', label: 'Text', color: '#6366f1' });
  }
  if (modality.includes('image')) {
    info.push({ icon: 'image', label: 'Vision', color: '#10b981' });
  }
  if (modality.includes('audio')) {
    info.push({ icon: 'microphone', label: 'Audio', color: '#f59e0b' });
  }
  
  return info.length > 0 ? info : [{ icon: 'text', label: 'Text', color: '#6366f1' }];
};

/**
 * Get capability badges from supported_parameters
 */
const getCapabilities = (params?: string[]): { label: string; icon: string }[] => {
  if (!params) return [];
  
  const caps: { label: string; icon: string }[] = [];
  
  if (params.includes('tools') || params.includes('tool_choice')) {
    caps.push({ label: 'Tools', icon: 'hammer-wrench' });
  }
  if (params.includes('response_format')) {
    caps.push({ label: 'JSON', icon: 'code-json' });
  }
  if (params.includes('stop')) {
    caps.push({ label: 'Stop', icon: 'stop-circle' });
  }
  
  return caps;
};

/**
 * Model Card Component - Memoized for performance
 */
const ModelCard = memo(({
  model,
  isSelected,
  onSelect,
}: {
  model: OpenRouterModel;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const theme = useTheme();
  const modalities = getModalityInfo(model.architecture?.modality);
  const capabilities = getCapabilities(model.supported_parameters);
  const isFree = parseFloat(model.pricing?.prompt || '0') === 0;
  
  // Extract provider from model ID (e.g., "openai/gpt-4" -> "openai")
  const provider = model.id.split('/')[0];
  
  return (
    <TouchableRipple
      onPress={onSelect}
      style={[
        styles.modelCard,
        {
          backgroundColor: isSelected 
            ? theme.colors.primaryContainer + '40' 
            : theme.colors.surface,
          borderColor: isSelected ? theme.colors.primary : theme.colors.outline + '20',
          borderWidth: isSelected ? 2 : 1,
        }
      ]}
      rippleColor={theme.colors.primaryContainer + '40'}
    >
      <View>
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            {isSelected && (
              <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]}>
                <Icon source="check" size={12} color={theme.colors.onPrimary} />
              </View>
            )}
            <View style={styles.cardTitleContainer}>
              <Text 
                variant="titleMedium" 
                style={[styles.modelName, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {model.name}
              </Text>
              <Text 
                variant="labelSmall" 
                style={[styles.providerId, { color: theme.colors.onSurfaceVariant }]}
                numberOfLines={1}
              >
                {provider}
              </Text>
            </View>
          </View>
          
          {/* Pricing Badge */}
          <Surface 
            style={[
              styles.pricingBadge, 
              { backgroundColor: isFree ? theme.colors.primaryContainer : theme.colors.tertiaryContainer || theme.colors.secondaryContainer }
            ]} 
            elevation={0}
          >
            <Text 
              variant="labelSmall" 
              style={{ 
                color: isFree ? theme.colors.primary : theme.colors.tertiary || theme.colors.secondary,
                fontWeight: '700',
              }}
            >
              {isFree ? 'FREE' : formatPricing(model.pricing?.prompt || '0')}
            </Text>
          </Surface>
        </View>
        
        {/* Description */}
        {model.description && (
          <Text 
            variant="bodySmall" 
            style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={2}
          >
            {model.description}
          </Text>
        )}
        
        {/* Metadata Row */}
        <View style={styles.metadataRow}>
          {/* Context Length */}
          <View style={styles.metadataItem}>
            <ThemedIcon name="text-box-outline" size={14} themeColor="onSurfaceVariant" />
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
              {formatContextLength(model.context_length)} ctx
            </Text>
          </View>
          
          {/* Max Completion */}
          {model.top_provider?.max_completion_tokens && (
            <View style={styles.metadataItem}>
              <ThemedIcon name="arrow-expand-right" size={14} themeColor="onSurfaceVariant" />
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
                {formatContextLength(model.top_provider.max_completion_tokens)} max
              </Text>
            </View>
          )}
          
          {/* Moderated */}
          {model.top_provider?.is_moderated && (
            <View style={styles.metadataItem}>
              <ThemedIcon name="shield-check" size={14} themeColor="primary" />
              <Text variant="labelSmall" style={{ color: theme.colors.primary, marginLeft: 4 }}>
                Moderated
              </Text>
            </View>
          )}
        </View>
        
        {/* Modality & Capabilities Row */}
        <View style={styles.badgesRow}>
          {modalities.map((mod, idx) => (
            <View 
              key={`mod-${idx}`} 
              style={[styles.badge, { backgroundColor: mod.color + '20' }]}
            >
              <ThemedIcon name={mod.icon as any} size={12} color={mod.color} />
              <Text variant="labelSmall" style={{ color: mod.color, marginLeft: 4, fontWeight: '600' }}>
                {mod.label}
              </Text>
            </View>
          ))}
          
          {capabilities.map((cap, idx) => (
            <View 
              key={`cap-${idx}`} 
              style={[styles.badge, { backgroundColor: theme.colors.surfaceVariant }]}
            >
              <ThemedIcon name={cap.icon as any} size={12} themeColor="onSurfaceVariant" />
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
                {cap.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableRipple>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render if these change
  return prevProps.model.id === nextProps.model.id && 
         prevProps.isSelected === nextProps.isSelected;
});

/**
 * ModelSelectionScreen - Full-screen model picker with rich metadata
 */
export const ModelSelectionScreen: React.FC<ModelSelectionScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { settings, updateSettings } = useSettings();
  
  const [models, setModels] = useState<GroupedModels>({ free: [], paid: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'free' | 'paid'>('free');
  
  // Load models on mount
  useEffect(() => {
    setLoading(true);
    aiService.fetchAvailableModels()
      .then(setModels)
      .finally(() => setLoading(false));
  }, []);
  
  // Filter models by search query
  const filteredModels = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return models;
    
    const filterFn = (m: OpenRouterModel) => 
      m.name.toLowerCase().includes(query) || 
      m.id.toLowerCase().includes(query) ||
      m.description?.toLowerCase().includes(query);
    
    return {
      free: models.free.filter(filterFn),
      paid: models.paid.filter(filterFn),
    };
  }, [models, searchQuery]);
  
  const displayedModels = activeTab === 'free' ? filteredModels.free : filteredModels.paid;
  
  const handleSelectModel = useCallback(async (modelId: string) => {
    await updateSettings({ selectedAiModel: modelId });
    navigation.goBack();
  }, [updateSettings, navigation]);
  
  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <ThemedIcon name="close" size={24} themeColor="onSurface" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            Select AI Model
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {models.free.length + models.paid.length} models available
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search models..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant + '50' }]}
          inputStyle={{ fontSize: 14 }}
          elevation={0}
        />
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableRipple
          onPress={() => setActiveTab('free')}
          style={[
            styles.tab,
            activeTab === 'free' && { backgroundColor: theme.colors.primaryContainer },
          ]}
          borderless
        >
          <View style={styles.tabContent}>
            <Icon 
              source="gift-outline" 
              size={18} 
              color={activeTab === 'free' ? theme.colors.primary : theme.colors.onSurfaceVariant} 
            />
            <Text 
              variant="labelLarge" 
              style={{ 
                color: activeTab === 'free' ? theme.colors.primary : theme.colors.onSurfaceVariant,
                marginLeft: 8,
                fontWeight: activeTab === 'free' ? '700' : '500',
              }}
            >
              Free ({filteredModels.free.length})
            </Text>
          </View>
        </TouchableRipple>
        
        <TouchableRipple
          onPress={() => setActiveTab('paid')}
          style={[
            styles.tab,
            activeTab === 'paid' && { backgroundColor: theme.colors.primaryContainer },
          ]}
          borderless
        >
          <View style={styles.tabContent}>
            <Icon 
              source="currency-usd" 
              size={18} 
              color={activeTab === 'paid' ? theme.colors.primary : theme.colors.onSurfaceVariant} 
            />
            <Text 
              variant="labelLarge" 
              style={{ 
                color: activeTab === 'paid' ? theme.colors.primary : theme.colors.onSurfaceVariant,
                marginLeft: 8,
                fontWeight: activeTab === 'paid' ? '700' : '500',
              }}
            >
              Paid ({filteredModels.paid.length})
            </Text>
          </View>
        </TouchableRipple>
      </View>
      
      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
            Loading models...
          </Text>
        </View>
      ) : displayedModels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon source="magnify-close" size={64} color={theme.colors.onSurfaceVariant + '50'} />
          <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
            No models found
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant + '80', marginTop: 4 }}>
            Try a different search term
          </Text>
        </View>
      ) : (
        <LegendList
          data={displayedModels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ModelCard
              model={item}
              isSelected={settings.selectedAiModel === item.id}
              onSelect={() => handleSelectModel(item.id)}
            />
          )}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={180}
          recycleItems={true}
          ListFooterComponent={<View style={{ height: 40 }} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    borderRadius: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  modelCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  modelName: {
    fontWeight: '600',
  },
  providerId: {
    marginTop: 2,
    opacity: 0.7,
  },
  pricingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  description: {
    marginTop: 8,
    lineHeight: 18,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
});

export default ModelSelectionScreen;
