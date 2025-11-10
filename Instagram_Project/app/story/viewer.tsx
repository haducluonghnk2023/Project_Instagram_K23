import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Image,
  Animated,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Video, ResizeMode } from "expo-av";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Spacing, FontSizes } from "@/constants/styles";
import { Avatar } from "@/components/common";
import { useUserPosts } from "@/hooks/usePost";
import { useMe } from "@/hooks/useAuth";
import { Post } from "@/types/post";
import { filterStories, getFirstVideo } from "@/utils/post";
import { getUserDisplayName, getAvatarUrl } from "@/utils/user";
import { getTimeAgo } from "@/utils/date";
import { TIMING } from "@/constants/timing";
import { logger } from "@/utils/logger";

const { width, height } = Dimensions.get("window");
const STORY_DURATION = TIMING.STORY_DURATION;

interface StoryViewerProps {
  userId: string;
  initialStoryIndex?: number;
}

export default function StoryViewerScreen() {
  const { userId, initialStoryIndex = 0 } = useLocalSearchParams<{
    userId: string;
    initialStoryIndex?: string;
  }>();
  const { data: posts } = useUserPosts(userId || "", 0, 10);
  const { data: currentUser } = useMe();

  // Filter stories (posts with video in last 24 hours, not reels)
  const stories = React.useMemo(() => {
    if (!posts) return [];
    return filterStories(posts);
  }, [posts]);

  const [currentStoryIndex, setCurrentStoryIndex] = useState(
    parseInt(initialStoryIndex || "0", 10)
  );
  const progressAnim = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const progressRef = useRef(0);

  const currentStory = stories[currentStoryIndex];
  const videoMedia = currentStory ? getFirstVideo(currentStory) : undefined;

  // Progress animation
  useEffect(() => {
    if (!isPaused && isPlaying && currentStory) {
      progressAnim.setValue(0);
      progressRef.current = 0;
      const animation = Animated.timing(progressAnim, {
        toValue: 1,
        duration: STORY_DURATION,
        useNativeDriver: false,
      });
      animation.start(({ finished }) => {
        if (finished) {
          handleNextStory();
        }
      });
      return () => {
        animation.stop();
      };
    } else {
      progressAnim.stopAnimation((value) => {
        progressRef.current = value;
      });
    }
  }, [currentStoryIndex, isPaused, isPlaying, currentStory]);

  const handleNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      progressRef.current = 0;
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      progressRef.current = 0;
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    videoRef.current?.pauseAsync();
    progressAnim.stopAnimation();
  };

  const handleResume = () => {
    setIsPaused(false);
    videoRef.current?.playAsync();
    const remainingDuration = STORY_DURATION - (progressRef.current * STORY_DURATION);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: remainingDuration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        handleNextStory();
      }
    });
  };

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 50) {
          if (gestureState.dx > 0) {
            handlePrevStory();
          } else {
            handleNextStory();
          }
        } else if (Math.abs(gestureState.dy) > 50) {
          if (gestureState.dy > 0) {
            handleClose();
          }
        }
      },
    })
  ).current;

  if (!stories || stories.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có story nào</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar hidden />
      <SafeAreaView style={styles.safeArea} edges={[]}>
        {/* Progress Bars */}
        <View style={styles.progressContainer}>
          {stories.map((_, index) => (
            <View key={index} style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground} />
              {index === currentStoryIndex && (
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              )}
              {index < currentStoryIndex && (
                <View style={[styles.progressBarFill, { width: "100%" }]} />
              )}
            </View>
          ))}
        </View>

        {/* Story Content */}
        {currentStory && videoMedia && (
          <View style={styles.storyContent}>
            <Video
              ref={videoRef}
              source={{ uri: videoMedia.mediaUrl }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              shouldPlay={isPlaying && !isPaused}
              isLooping={false}
              onPlaybackStatusUpdate={(status) => {
                if (status.isLoaded) {
                  setIsPlaying(status.isPlaying);
                  if (status.didJustFinish) {
                    handleNextStory();
                  }
                }
              }}
            />

            {/* Overlay */}
            <View style={styles.overlay}>
              {/* Top Bar */}
              <View style={styles.topBar}>
                <View style={styles.userInfo}>
                  <Avatar
                    source={currentStory.user.profile?.avatarUrl || null}
                    size={32}
                    showBorder={false}
                  />
                  <Text style={styles.username}>
                    {getUserDisplayName(currentStory.user)}
                  </Text>
                  <Text style={styles.timeAgo}>
                    {getTimeAgo(new Date(currentStory.createdAt))}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Bottom Actions */}
              <View style={styles.bottomBar}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push(`/message/chat/${currentStory.userId}`)}
                >
                  <Ionicons name="chatbubble-outline" size={24} color="#fff" />
                  <Text style={styles.actionText}>Trả lời</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    // Like story
                  }}
                >
                  <Ionicons name="heart-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    // Share story
                  }}
                >
                  <Ionicons name="paper-plane-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Tap Areas */}
            <TouchableOpacity
              style={styles.leftTapArea}
              onPress={handlePrevStory}
              activeOpacity={1}
            />
            <TouchableOpacity
              style={styles.rightTapArea}
              onPress={handleNextStory}
              activeOpacity={1}
            />
            <TouchableOpacity
              style={styles.centerTapArea}
              onPressIn={handlePause}
              onPressOut={handleResume}
              activeOpacity={1}
            />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  safeArea: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.xs,
    gap: Spacing.xs / 2,
  },
  progressBarContainer: {
    flex: 1,
    height: 2,
    position: "relative",
  },
  progressBarBackground: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 1,
  },
  progressBarFill: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 1,
  },
  storyContent: {
    flex: 1,
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  username: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: "#fff",
  },
  timeAgo: {
    fontSize: FontSizes.xs,
    color: "rgba(255, 255, 255, 0.7)",
  },
  closeButton: {
    padding: Spacing.xs,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  actionButton: {
    alignItems: "center",
    gap: Spacing.xs / 2,
  },
  actionText: {
    fontSize: FontSizes.xs,
    color: "#fff",
  },
  leftTapArea: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: width / 3,
  },
  rightTapArea: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: width / 3,
  },
  centerTapArea: {
    position: "absolute",
    left: width / 3,
    right: width / 3,
    top: 0,
    bottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: "#fff",
  },
});

