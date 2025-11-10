import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/styles';

export type TabType = 'grid' | 'video' | 'bookmark' | 'tagged';

export interface ProfileTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  showSavedTab?: boolean; // Chỉ hiển thị tab saved cho profile của chính mình
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  showSavedTab = false,
}) => {
  const allTabs: { type: TabType; icon: keyof typeof Ionicons.glyphMap }[] = [
    { type: 'grid', icon: 'grid' },
    { type: 'video', icon: 'play-circle-outline' },
    { type: 'bookmark', icon: 'bookmark-outline' },
    { type: 'tagged', icon: 'person-outline' },
  ];
  
  // Filter tabs based on showSavedTab
  const tabs = showSavedTab 
    ? allTabs 
    : allTabs.filter(tab => tab.type !== 'bookmark');

  const getIconName = (tabType: TabType, isActive: boolean) => {
    if (tabType === 'bookmark') {
      return isActive ? 'bookmark' : 'bookmark-outline';
    }
    // For other tabs, use the icon from the tabs array
    const tab = allTabs.find(t => t.type === tabType);
    return tab?.icon || 'grid';
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.type;
        return (
          <TouchableOpacity
            key={tab.type}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onTabChange(tab.type)}
          >
            <Ionicons
              name={getIconName(tab.type, isActive) as keyof typeof Ionicons.glyphMap}
              size={24}
              color={isActive ? Colors.text : Colors.textSecondary}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.text,
  },
});

