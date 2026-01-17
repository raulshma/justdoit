import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { GoalFormScreen } from '../../src/screens/GoalFormScreen';

/**
 * Goal Detail/Edit Screen Route
 * Dynamic route for viewing/editing a specific goal
 */
export default function GoalDetail() {
  const { id, mode = 'view' } = useLocalSearchParams<{ id: string; mode?: 'view' | 'edit' }>();

  return <GoalFormScreen goalId={id} mode={mode} />;
}
