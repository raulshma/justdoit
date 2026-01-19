import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { GoalHistoryEntry, GoalHistoryChange } from '../types';
import { ThemedIcon } from './ThemedIcon';

interface GoalTimelineProps {
  history?: GoalHistoryEntry[];
}

export function GoalTimeline({ history }: GoalTimelineProps) {
  const theme = useTheme();

  if (!history || history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="bodySmall" style={{ color: theme.colors.outline, fontStyle: 'italic' }}>
          No history available
        </Text>
      </View>
    );
  }

  // Sort history descending (newest first)
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const formatValue = (val: any): string => {
    if (val === undefined || val === null) return 'none';
    if (typeof val === 'object') {
       if (val instanceof Date) return val.toLocaleDateString();
       if (val.type) return val.type; // for objects like recurrence
       return JSON.stringify(val);
    }
    return String(val);
  };

  const formatChange = (change: GoalHistoryChange) => {
    let fieldName = change.field;
    // Capitalize field name
    fieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    
    // Special field formatting if necessary
    if (fieldName === 'DueDate') fieldName = 'Due Date';
    if (fieldName === 'ReminderTime') fieldName = 'Reminder';

    return (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            <Text style={{ fontWeight: '600' }}>{fieldName}</Text> changed from <Text style={{ fontStyle: 'italic' }}>{formatValue(change.oldValue)}</Text> to <Text style={{ fontStyle: 'italic' }}>{formatValue(change.newValue)}</Text>
        </Text>
    );
  };

  const getActionIcon = (action: string) => {
      switch (action) {
          case 'created': return 'plus-circle';
          case 'updated': return 'pencil';
          case 'completed': return 'check-circle';
          case 'uncompleted': return 'undo';
          case 'postponed': return 'calendar-clock';
          default: return 'history';
      }
  };

  const getActionColor = (action: string) => {
      switch (action) {
          case 'created': return theme.colors.primary;
          case 'completed': return theme.colors.primary; // Greenish usually, but stick to theme
          case 'uncompleted': return theme.colors.error;
          case 'postponed': return theme.colors.tertiary;
          default: return theme.colors.secondary;
      }
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={[styles.header, { color: theme.colors.onSurface }]}>
        Audit History
      </Text>
      
      <View style={styles.timelineContainer}>
        {sortedHistory.map((entry, index) => {
          const isLast = index === sortedHistory.length - 1;
          const date = new Date(entry.timestamp);
          
          return (
            <View key={entry.id} style={styles.entryWrapper}>
              {/* Timeline Line */}
              <View style={styles.timelineLeftColumn}>
                  <View style={[styles.dot, { backgroundColor: getActionColor(entry.action) }]} />
                  {!isLast && <View style={[styles.line, { backgroundColor: theme.colors.surfaceVariant }]} />}
              </View>

              {/* Content */}
              <View style={[styles.content, { paddingBottom: isLast ? 0 : 24 }]}>
                <View style={styles.headerRow}>
                  <Text variant="labelLarge" style={{ 
                      color: getActionColor(entry.action), 
                      textTransform: 'capitalize',
                      fontWeight: '700'
                  }}>
                    {entry.action}
                  </Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
                    {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                {entry.note && (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurface, marginTop: 4 }}>
                        {entry.note}
                    </Text>
                )}

                {entry.changes && entry.changes.length > 0 && (
                    <View style={[styles.changesContainer, { backgroundColor: theme.colors.surfaceVariant, marginTop: 8 }]}>
                        {entry.changes.map((change, i) => (
                             <View key={i} style={{ marginBottom: i < entry.changes!.length - 1 ? 4 : 0 }}>
                                 {formatChange(change)}
                             </View>
                        ))}
                    </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 16,
    paddingHorizontal: 4,
    fontWeight: '700',
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  entryWrapper: {
    flexDirection: 'row',
  },
  timelineLeftColumn: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    zIndex: 1,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: -2,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changesContainer: {
     padding: 8,
     borderRadius: 8,
  }
});
