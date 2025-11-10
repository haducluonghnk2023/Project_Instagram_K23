import { Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80; // Minimum horizontal swipe distance to trigger back
const VERTICAL_THRESHOLD = 120; // Maximum vertical movement allowed during horizontal swipe
const EDGE_THRESHOLD = 50; // Distance from left edge to start detecting swipe
const VELOCITY_THRESHOLD = 0.3; // Minimum velocity to trigger back on fast swipe

/**
 * Hook để thêm gesture swipe từ trái sang phải với visual feedback interactive
 * Màn hình sẽ di chuyển theo ngón tay khi vuốt, giống Instagram
 * Sử dụng react-native-gesture-handler để tránh conflict với ScrollView
 * @param enabled - Bật/tắt gesture (default: true)
 * @param onBack - Callback tùy chỉnh khi back (nếu không có thì dùng router.back())
 */
export const useSwipeBack = (enabled: boolean = true, onBack?: () => void) => {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(-1); // Dùng shared value để track trong worklet

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/home');
      }
    }
  };

  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX(5) // Chỉ trigger khi vuốt sang phải ít nhất 5px
    .failOffsetY([-VERTICAL_THRESHOLD, VERTICAL_THRESHOLD]) // Fail nếu vuốt quá dọc
    .onStart((event) => {
      'worklet';
      // Chỉ bắt đầu gesture nếu bắt đầu từ cạnh trái màn hình
      // Và không phải header area (top 100px)
      if (event.x < EDGE_THRESHOLD && event.y > 100) {
        startX.value = event.x;
        translateX.value = 0;
      } else {
        // Reset nếu không bắt đầu từ edge
        startX.value = -1;
      }
    })
    .onUpdate((event) => {
      'worklet';
      // Chỉ cho phép vuốt sang phải (dx > 0) và nếu bắt đầu từ edge
      if (event.translationX > 0 && startX.value >= 0 && startX.value < EDGE_THRESHOLD) {
        const dx = Math.min(event.translationX, width);
        translateX.value = dx;
      }
    })
    .onEnd((event) => {
      'worklet';
      if (!enabled || startX.value < 0) {
        translateX.value = withSpring(0);
        startX.value = -1;
        return;
      }

      // Kiểm tra nếu vuốt đủ xa và đủ nhanh
      const swipeDistance = event.translationX;
      const swipeVelocity = Math.abs(event.velocityX);
      const isHorizontalSwipe = Math.abs(event.translationX) > Math.abs(event.translationY);
      
      // Trigger nếu:
      // 1. Vuốt đủ xa (dx > threshold) HOẶC
      // 2. Vuốt nhanh (velocity > threshold) và đủ xa (dx > 50)
      const shouldGoBack = 
        isHorizontalSwipe &&
        swipeDistance > 0 &&
        Math.abs(event.translationY) < VERTICAL_THRESHOLD &&
        (swipeDistance > SWIPE_THRESHOLD || (swipeVelocity > VELOCITY_THRESHOLD && swipeDistance > 50));

      if (shouldGoBack) {
        // Animate màn hình ra ngoài hoàn toàn rồi mới navigate
        translateX.value = withTiming(width, { duration: 200 }, () => {
          translateX.value = 0;
          startX.value = -1;
          runOnJS(handleBack)();
        });
      } else {
        // Spring back về vị trí ban đầu nếu không đủ threshold
        translateX.value = withSpring(0, {
          damping: 15,
          stiffness: 150,
        });
        startX.value = -1;
      }
    })
    .onFinalize(() => {
      'worklet';
      // Reset nếu gesture bị hủy
      if (translateX.value > 0 && translateX.value < SWIPE_THRESHOLD) {
        translateX.value = withSpring(0, {
          damping: 15,
          stiffness: 150,
        });
      }
      startX.value = -1;
    });

  // Tạo animated style để apply transform
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return {
    gesture: panGesture,
    animatedStyle,
  };
};

