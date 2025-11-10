import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Post } from '@/types/post';

const { width } = Dimensions.get('window');
const POST_SIZE = (width - 4) / 3;

export interface PostGridProps {
  posts: Post[];
  onPostPress?: (post: Post) => void;
}

export const PostGrid: React.FC<PostGridProps> = ({ posts, onPostPress }) => {
  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="image-outline" size={64} color={Colors.textSecondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {posts.map((post) => {
        const firstMedia = post.media && post.media.length > 0 ? post.media[0] : null;
        return (
          <TouchableOpacity
            key={post.id}
            style={styles.postItem}
            onPress={() => onPostPress?.(post)}
            activeOpacity={0.8}
          >
            {firstMedia ? (
              <>
                {firstMedia.mediaType === 'video' ? (
                  <View style={styles.mediaContainer}>
                    <Image
                      source={{ uri: firstMedia.mediaUrl }}
                      style={styles.postImage}
                      resizeMode="cover"
                    />
                    <View style={styles.videoBadge}>
                      <Ionicons name="videocam" size={16} color="#fff" />
                    </View>
                  </View>
                ) : (
                  <Image
                    source={{ uri: firstMedia.mediaUrl }}
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                )}
                {post.media && post.media.length > 1 && (
                  <View style={styles.multipleMediaBadge}>
                    <Ionicons name="layers" size={16} color="#fff" />
                  </View>
                )}
              </>
            ) : (
              <View style={styles.postImagePlaceholder}>
                <Ionicons name="image-outline" size={40} color={Colors.border} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  postItem: {
    width: POST_SIZE,
    height: POST_SIZE,
    marginRight: 2,
    marginBottom: 2,
    position: 'relative',
  },
  mediaContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.backgroundSecondary,
  },
  postImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  multipleMediaBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

