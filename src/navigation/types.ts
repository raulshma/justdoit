import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

/**
 * Mode for the Goal Form screen
 */
export type GoalFormMode = 'add' | 'view' | 'edit';

/**
 * Home Stack parameter list
 */
export type HomeStackParamList = {
  Home: { ignoreMinimalRedirect?: boolean } | undefined;
  MinimalGoals: undefined;
};

/**
 * Statistics Stack parameter list
 */
export type StatisticsStackParamList = {
  Statistics: undefined;
};

/**
 * Settings Stack parameter list
 */
export type SettingsStackParamList = {
  Settings: undefined;
};

/**
 * Focus Stack parameter list
 */
export type FocusStackParamList = {
  FocusMode: undefined;
};

/**
 * Root Bottom Tab parameter list
 */
export type RootTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  FocusTab: NavigatorScreenParams<FocusStackParamList>;
  StatisticsTab: NavigatorScreenParams<StatisticsStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

/**
 * Goal Form parameters - unified for add/view/edit modes
 */
export type GoalFormParams = {
  goalId?: string;
  mode?: GoalFormMode;
};

/**
 * Root Stack parameter list (contains tabs + modal screens)
 */
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList>;
  GoalForm: GoalFormParams | undefined;
  ModelSelection: undefined;
  Templates: undefined;
  Achievements: undefined;
  Challenges: undefined;
  Logs: undefined;
  AISettings: undefined;
};

/**
 * Screen props for Home Stack screens
 */
export type HomeScreenProps = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'Home'>,
  CompositeScreenProps<
    BottomTabScreenProps<RootTabParamList>,
    NativeStackScreenProps<RootStackParamList>
  >
>;

/**
 * GoalForm is now at the root stack level (modal) - handles add/view/edit
 */
export type GoalFormScreenProps = NativeStackScreenProps<RootStackParamList, 'GoalForm'>;

/**
 * ModelSelection screen props
 */
export type ModelSelectionScreenProps = NativeStackScreenProps<RootStackParamList, 'ModelSelection'>;

/**
 * Screen props for Statistics Stack screens
 */
export type StatisticsScreenProps = CompositeScreenProps<
  NativeStackScreenProps<StatisticsStackParamList, 'Statistics'>,
  CompositeScreenProps<
    BottomTabScreenProps<RootTabParamList>,
    NativeStackScreenProps<RootStackParamList>
  >
>;

/**
 * Screen props for Settings Stack screens
 */
export type SettingsScreenProps = CompositeScreenProps<
  NativeStackScreenProps<SettingsStackParamList, 'Settings'>,
  CompositeScreenProps<
    BottomTabScreenProps<RootTabParamList>,
    NativeStackScreenProps<RootStackParamList>
  >
>;

/**
 * Declaration for useNavigation hook type safety
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
