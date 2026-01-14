import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, SectionList, Alert } from 'react-native';
import {
  Text,
  useTheme,
  Portal,
  Modal,
  Button,
  Searchbar,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { GoalTemplate, Category } from '../types';
import { templateService, categoryManager, storageService } from '../services';
import { TemplateCard, TemplatePreview } from '../components';
import { ThemedIcon } from '../components/ThemedIcon';

type TemplatesScreenProps = NativeStackScreenProps<any, 'Templates'>;

interface TemplateSection {
  title: string;
  data: GoalTemplate[];
  category?: Category;
}

/**
 * TemplatesScreen - Shows template list organized by category
 * Requirements: 3.1, 3.2, 3.6
 */
export const TemplatesScreen: React.FC<TemplatesScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get all templates and categories
  const templates = useMemo(() => templateService.getTemplates(), []);
  const categories = useMemo(() => categoryManager.getCategories(), []);

  // Create a map of category IDs to categories
  const categoryMap = useMemo(() => {
    const map: Record<string, Category> = {};
    categories.forEach(cat => {
      map[cat.id] = cat;
    });
    return map;
  }, [categories]);

  // Filter templates by search query
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;
    const query = searchQuery.toLowerCase();
    return templates.filter(
      t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        categoryMap[t.categoryId]?.name.toLowerCase().includes(query)
    );
  }, [templates, searchQuery, categoryMap]);

  // Group templates by category
  const sections: TemplateSection[] = useMemo(() => {
    const grouped: Record<string, GoalTemplate[]> = {};
    
    filteredTemplates.forEach(template => {
      const categoryId = template.categoryId;
      if (!grouped[categoryId]) {
        grouped[categoryId] = [];
      }
      grouped[categoryId].push(template);
    });

    // Sort templates within each category: built-in first, then by name
    Object.keys(grouped).forEach(categoryId => {
      grouped[categoryId].sort((a, b) => {
        if (a.isBuiltIn !== b.isBuiltIn) {
          return a.isBuiltIn ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    });

    // Create sections sorted by category name
    return Object.entries(grouped)
      .map(([categoryId, templates]) => ({
        title: categoryMap[categoryId]?.name || 'Other',
        data: templates,
        category: categoryMap[categoryId],
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [filteredTemplates, categoryMap]);

  /**
   * Handle template selection - show preview
   */
  const handleTemplatePress = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setShowPreview(true);
    }
  }, [templates]);

  /**
   * Handle long press on custom template - show delete option
   */
  const handleTemplateLongPress = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template && !template.isBuiltIn) {
      setSelectedTemplate(template);
      setShowDeleteConfirm(true);
    }
  }, [templates]);

  /**
   * Handle creating a goal from the selected template
   * Requirements: 3.3, 3.4, 3.6
   */
  const handleUseTemplate = useCallback(() => {
    if (!selectedTemplate) return;

    try {
      // Create goal from template
      const goal = templateService.createGoalFromTemplate(selectedTemplate.id);
      
      // Save the goal
      storageService.saveGoal(goal);

      setShowPreview(false);
      setSelectedTemplate(null);

      // Navigate to edit the new goal for customization
      navigation.navigate('GoalForm', { goalId: goal.id, mode: 'edit' });
    } catch (error) {
      console.error('Failed to create goal from template:', error);
      Alert.alert('Error', 'Failed to create goal from template. Please try again.');
    }
  }, [selectedTemplate, navigation]);

  /**
   * Handle deleting a custom template
   * Requirements: 3.7
   */
  const handleDeleteTemplate = useCallback(() => {
    if (!selectedTemplate) return;

    try {
      templateService.deleteCustomTemplate(selectedTemplate.id);
      setShowDeleteConfirm(false);
      setSelectedTemplate(null);
      // Force re-render by navigating to same screen
      navigation.setParams({});
    } catch (error) {
      console.error('Failed to delete template:', error);
      Alert.alert('Error', 'Failed to delete template. Please try again.');
    }
  }, [selectedTemplate, navigation]);

  /**
   * Handle closing the screen
   */
  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  /**
   * Render section header
   */
  const renderSectionHeader = useCallback(
    ({ section }: { section: TemplateSection }) => (
      <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
        {section.category && (
          <View style={[styles.categoryDot, { backgroundColor: section.category.color }]} />
        )}
        <Text
          variant="titleSmall"
          style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
        >
          {section.title}
        </Text>
        <Text
          variant="labelSmall"
          style={[styles.sectionCount, { color: theme.colors.outline }]}
        >
          {section.data.length} template{section.data.length !== 1 ? 's' : ''}
        </Text>
      </View>
    ),
    [theme]
  );

  /**
   * Render template item
   */
  const renderItem = useCallback(
    ({ item }: { item: GoalTemplate }) => (
      <TemplateCard
        template={item}
        category={categoryMap[item.categoryId]}
        onPress={handleTemplatePress}
        onLongPress={handleTemplateLongPress}
      />
    ),
    [categoryMap, handleTemplatePress, handleTemplateLongPress]
  );

  /**
   * Render empty state
   */
  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <ThemedIcon name="file-document-outline" size={64} themeColor="outline" />
        <Text
          variant="titleMedium"
          style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
        >
          No Templates Found
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
        >
          {searchQuery
            ? 'Try a different search term'
            : 'Templates will appear here'}
        </Text>
      </View>
    ),
    [theme, searchQuery]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 12 }]}>
        <IconButton
          icon="close"
          size={28}
          iconColor={theme.colors.onSurface}
          onPress={handleClose}
          style={{ marginLeft: -8 }}
        />
        <Text variant="titleLarge" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          Goal Templates
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search templates..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}
          inputStyle={{ color: theme.colors.onSurface }}
          iconColor={theme.colors.onSurfaceVariant}
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />
      </View>

      {/* Template List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />

      {/* Template Preview Modal */}
      <Portal>
        <Modal
          visible={showPreview}
          onDismiss={() => {
            setShowPreview(false);
            setSelectedTemplate(null);
          }}
          contentContainerStyle={[
            styles.previewModal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          {selectedTemplate && (
            <>
              <TemplatePreview
                template={selectedTemplate}
                category={categoryMap[selectedTemplate.categoryId]}
              />
              <View style={styles.previewActions}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowPreview(false);
                    setSelectedTemplate(null);
                  }}
                  style={styles.previewButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleUseTemplate}
                  style={styles.previewButton}
                >
                  Use Template
                </Button>
              </View>
            </>
          )}
        </Modal>
      </Portal>

      {/* Delete Confirmation Modal */}
      <Portal>
        <Modal
          visible={showDeleteConfirm}
          onDismiss={() => {
            setShowDeleteConfirm(false);
            setSelectedTemplate(null);
          }}
          contentContainerStyle={[
            styles.deleteModal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            variant="titleMedium"
            style={[styles.deleteTitle, { color: theme.colors.onSurface }]}
          >
            Delete Template?
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.deleteText, { color: theme.colors.onSurfaceVariant }]}
          >
            Are you sure you want to delete "{selectedTemplate?.name}"? This action cannot be undone.
          </Text>
          <View style={styles.deleteActions}>
            <Button
              mode="outlined"
              onPress={() => {
                setShowDeleteConfirm(false);
                setSelectedTemplate(null);
              }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              buttonColor={theme.colors.error}
              onPress={handleDeleteTemplate}
            >
              Delete
            </Button>
          </View>
        </Modal>
      </Portal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    borderRadius: 12,
    elevation: 0,
  },
  listContent: {
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionTitle: {
    fontWeight: '600',
    flex: 1,
  },
  sectionCount: {
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
  },
  previewModal: {
    margin: 20,
    padding: 24,
    borderRadius: 20,
    maxHeight: '80%',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  previewButton: {
    minWidth: 100,
  },
  deleteModal: {
    margin: 20,
    padding: 24,
    borderRadius: 20,
  },
  deleteTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  deleteText: {
    marginBottom: 24,
  },
  deleteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});

export default TemplatesScreen;
