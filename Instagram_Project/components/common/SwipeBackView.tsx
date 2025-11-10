import React from 'react';
import { ViewStyle, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useSwipeBack } from '@/hooks/useSwipeBack';

interface SwipeBackViewProps {
  children: React.ReactNode;
  enabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  onBack?: () => void; // Callback tùy chỉnh khi back
}

/**
 * Component wrapper để tự động thêm swipe back gesture với visual feedback
 * Sử dụng react-native-gesture-handler và reanimated để màn hình di chuyển theo ngón tay khi vuốt
 */
export const SwipeBackView: React.FC<SwipeBackViewProps> = ({ 
  children, 
  enabled = true,
  style,
  onBack
}) => {
  const { gesture, animatedStyle } = useSwipeBack(enabled, onBack);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[style, animatedStyle]}>
        {/* Wrap children trong View với pointerEvents để đảm bảo buttons hoạt động */}
        <View style={{ flex: 1 }} pointerEvents="box-none">
          {children}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

