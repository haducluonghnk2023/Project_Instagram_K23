package com.data.db_instagram.services.impl;

import com.data.db_instagram.dto.request.CreatePostRequest;
import com.data.db_instagram.dto.request.UpdatePostRequest;
import com.data.db_instagram.dto.response.*;
import com.data.db_instagram.exception.HttpForbidden;
import com.data.db_instagram.exception.HttpNotFound;
import com.data.db_instagram.mapper.UserMapper;
import com.data.db_instagram.model.*;
import com.data.db_instagram.repository.*;
import com.data.db_instagram.services.PostService;
import com.data.db_instagram.services.SavedPostsService;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class PostServiceImpl implements PostService {
    private final PostsRepository postsRepository;
    private final PostMediaRepository postMediaRepository;
    private final PostReactionsRepository postReactionsRepository;
    private final CommentsRepository commentsRepository;
    private final IUserRepository userRepository;
    private final ProfilesRepository profilesRepository;
    private final UserMapper userMapper;
    private final SavedPostsService savedPostsService;

    public PostServiceImpl(
            PostsRepository postsRepository,
            PostMediaRepository postMediaRepository,
            PostReactionsRepository postReactionsRepository,
            CommentsRepository commentsRepository,
            IUserRepository userRepository,
            ProfilesRepository profilesRepository,
            UserMapper userMapper,
            @Lazy SavedPostsService savedPostsService
    ) {
        this.postsRepository = postsRepository;
        this.postMediaRepository = postMediaRepository;
        this.postReactionsRepository = postReactionsRepository;
        this.commentsRepository = commentsRepository;
        this.userRepository = userRepository;
        this.profilesRepository = profilesRepository;
        this.userMapper = userMapper;
        this.savedPostsService = savedPostsService;
    }

    @Override
    @Transactional
    public PostResponse createPost(UUID userId, CreatePostRequest request) {
        Posts post = new Posts();
        post.setUserId(userId);
        post.setContent(request.getContent());
        post.setVisibility(request.getVisibility() != null ? request.getVisibility() : "public");
        post.setLocation(request.getLocation());
        post.setCreatedAt(new Date());
        post = postsRepository.save(post);

        // Save media
        if (request.getMediaUrls() != null && !request.getMediaUrls().isEmpty()) {
            List<String> mediaTypes = request.getMediaTypes();
            for (int i = 0; i < request.getMediaUrls().size(); i++) {
                Post_media media = new Post_media();
                media.setPostId(post.getId());
                media.setMediaUrl(request.getMediaUrls().get(i));
                // Determine media type: use provided type or detect from URL
                String mediaType = "image"; // default
                if (mediaTypes != null && i < mediaTypes.size() && mediaTypes.get(i) != null) {
                    mediaType = mediaTypes.get(i);
                } else {
                    // Auto-detect from URL (if contains video extensions)
                    String url = request.getMediaUrls().get(i).toLowerCase();
                    if (url.contains(".mp4") || url.contains(".mov") || url.contains(".avi") || 
                        url.contains("video") || url.contains("/v/")) {
                        mediaType = "video";
                    }
                }
                media.setMediaType(mediaType);
                media.setOrderIndex(i);
                postMediaRepository.save(media);
            }
        }

        return buildPostResponse(post, userId);
    }

    @Override
    @Transactional
    public PostResponse updatePost(UUID userId, UUID postId, UpdatePostRequest request) {
        Posts post = postsRepository.findByIdAndIsDeletedFalse(postId)
                .orElseThrow(() -> new HttpNotFound("Post not found"));

        if (!post.getUserId().equals(userId)) {
            throw new HttpForbidden("You can only update your own posts");
        }

        if (request.getContent() != null) {
            post.setContent(request.getContent());
        }
        if (request.getVisibility() != null) {
            post.setVisibility(request.getVisibility());
        }
        if (request.getLocation() != null) {
            post.setLocation(request.getLocation());
        }
        post.setUpdatedAt(new Date());
        post = postsRepository.save(post);

        // Update media if provided
        if (request.getMediaUrls() != null) {
            postMediaRepository.deleteByPostId(postId);
            List<String> mediaTypes = request.getMediaTypes();
            for (int i = 0; i < request.getMediaUrls().size(); i++) {
                Post_media media = new Post_media();
                media.setPostId(post.getId());
                media.setMediaUrl(request.getMediaUrls().get(i));
                // Determine media type: use provided type or detect from URL
                String mediaType = "image"; // default
                if (mediaTypes != null && i < mediaTypes.size() && mediaTypes.get(i) != null) {
                    mediaType = mediaTypes.get(i);
                } else {
                    // Auto-detect from URL
                    String url = request.getMediaUrls().get(i).toLowerCase();
                    if (url.contains(".mp4") || url.contains(".mov") || url.contains(".avi") || 
                        url.contains("video") || url.contains("/v/")) {
                        mediaType = "video";
                    }
                }
                media.setMediaType(mediaType);
                media.setOrderIndex(i);
                postMediaRepository.save(media);
            }
        }

        return buildPostResponse(post, userId);
    }

    @Override
    @Transactional
    public void deletePost(UUID userId, UUID postId) {
        Posts post = postsRepository.findByIdAndIsDeletedFalse(postId)
                .orElseThrow(() -> new HttpNotFound("Post not found"));

        if (!post.getUserId().equals(userId)) {
            throw new HttpForbidden("You can only delete your own posts");
        }

        post.setIsDeleted(true);
        post.setUpdatedAt(new Date());
        postsRepository.save(post);
    }

    @Override
    public PostResponse getPostById(UUID postId, UUID currentUserId) {
        Posts post = postsRepository.findByIdAndIsDeletedFalse(postId)
                .orElseThrow(() -> new HttpNotFound("Post not found"));
        return buildPostResponse(post, currentUserId);
    }

    @Override
    public List<PostResponse> getFriendsPosts(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Posts> postsPage = postsRepository.findFriendsPosts(userId, pageable);
        List<Posts> posts = postsPage.getContent();
        
        if (posts.isEmpty()) {
            // Fallback: lấy posts của user và posts public
            List<Posts> userPosts = postsRepository.findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(userId);
            List<Posts> publicPosts = postsRepository.findByVisibilityAndIsDeletedFalseOrderByCreatedAtDesc("public");
            Set<UUID> seenIds = new HashSet<>();
            List<Posts> fallbackPosts = new ArrayList<>();
            for (Posts post : userPosts) {
                if (!seenIds.contains(post.getId())) {
                    fallbackPosts.add(post);
                    seenIds.add(post.getId());
                }
            }
            for (Posts post : publicPosts) {
                if (!seenIds.contains(post.getId())) {
                    fallbackPosts.add(post);
                    seenIds.add(post.getId());
                }
            }
            fallbackPosts.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
            // Apply pagination manually
            int start = page * size;
            int end = Math.min(start + size, fallbackPosts.size());
            if (start < fallbackPosts.size()) {
                posts = fallbackPosts.subList(start, end);
            }
        }
        
        // Batch build để tránh N+1 query
        return buildPostResponses(posts, userId);
    }

    @Override
    public List<PostResponse> getUserPosts(UUID userId, UUID currentUserId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Posts> postsPage = postsRepository.findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(userId, pageable);
        List<Posts> posts = postsPage.getContent();
        
        // Batch build để tránh N+1 query
        return buildPostResponses(posts, currentUserId);
    }

    @Override
    public List<PostResponse> getReels(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Posts> reelsPage = postsRepository.findReels(userId, pageable);
        List<Posts> reels = reelsPage.getContent();
        
        // Batch build để tránh N+1 query
        return buildPostResponses(reels, userId);
    }

    // Batch build posts để tránh N+1 query problem
    private List<PostResponse> buildPostResponses(List<Posts> posts, UUID currentUserId) {
        if (posts.isEmpty()) {
            return new ArrayList<>();
        }
        
        // Collect all user IDs
        Set<UUID> userIds = new HashSet<>();
        for (Posts post : posts) {
            userIds.add(post.getUserId());
        }
        
        // Batch load users và profiles
        List<Users> users = userRepository.findAllById(userIds);
        Map<UUID, Users> userMap = users.stream()
                .collect(Collectors.toMap(Users::getId, u -> u));
        
        List<Profiles> profiles = profilesRepository.findByUserIdIn(new ArrayList<>(userIds));
        Map<UUID, Profiles> profileMap = profiles.stream()
                .collect(Collectors.toMap(Profiles::getUser_id, p -> p));
        
        // Collect all post IDs for batch loading media, reactions, comments
        List<UUID> postIds = posts.stream().map(Posts::getId).collect(Collectors.toList());
        
        // Batch load media - optimized: single query instead of N queries
        List<Post_media> allMedia = postMediaRepository.findByPostIdInOrderByPostIdAscOrderIndexAsc(postIds);
        Map<UUID, List<Post_media>> mediaMap = allMedia.stream()
                .collect(Collectors.groupingBy(Post_media::getPostId));
        
        // Batch load reactions - optimized: single query instead of N queries
        List<Post_reactions> allReactions = postReactionsRepository.findByPostIdInOrderByPostIdAscCreatedAtDesc(postIds);
        Map<UUID, List<Post_reactions>> reactionsMap = allReactions.stream()
                .collect(Collectors.groupingBy(Post_reactions::getPostId));
        
        // Collect reaction user IDs
        Set<UUID> reactionUserIds = allReactions.stream()
                .map(Post_reactions::getUserId)
                .collect(Collectors.toSet());
        
        // Batch load reaction users và profiles
        List<Users> reactionUsers = userRepository.findAllById(reactionUserIds);
        Map<UUID, Users> reactionUserMap = reactionUsers.stream()
                .collect(Collectors.toMap(Users::getId, u -> u));
        
        List<Profiles> reactionProfiles = profilesRepository.findByUserIdIn(new ArrayList<>(reactionUserIds));
        Map<UUID, Profiles> reactionProfileMap = reactionProfiles.stream()
                .collect(Collectors.toMap(Profiles::getUser_id, p -> p));
        
        // Batch check saved posts
        Set<UUID> savedPostIds = currentUserId != null 
            ? savedPostsService.getSavedPostIds(currentUserId, postIds)
            : Collections.emptySet();
        
        // Batch load comment counts - optimized: single query instead of N queries
        List<Object[]> commentCountResults = commentsRepository.countByPostIdInAndIsDeletedFalse(postIds);
        Map<UUID, Long> commentCountMap = new HashMap<>();
        for (Object[] result : commentCountResults) {
            UUID postId = (UUID) result[0];
            Long count = (Long) result[1];
            commentCountMap.put(postId, count);
        }
        // Set default count to 0 for posts without comments
        for (UUID postId : postIds) {
            commentCountMap.putIfAbsent(postId, 0L);
        }
        
        // Build responses
        return posts.stream()
                .map(post -> buildPostResponseOptimized(
                    post, 
                    currentUserId,
                    userMap,
                    profileMap,
                    mediaMap.getOrDefault(post.getId(), Collections.emptyList()),
                    reactionsMap.getOrDefault(post.getId(), Collections.emptyList()),
                    reactionUserMap,
                    reactionProfileMap,
                    savedPostIds.contains(post.getId()),
                    commentCountMap.getOrDefault(post.getId(), 0L)
                ))
                .collect(Collectors.toList());
    }
    
    private PostResponse buildPostResponse(Posts post, UUID currentUserId) {
        Users user = userRepository.findById(post.getUserId())
                .orElse(null);
        Profiles profile = user != null ? profilesRepository.findByUserId(user.getId()).orElse(null) : null;
        UserInfo userInfo = userMapper.toUserInfo(user, profile);

        // Get media
        List<Post_media> mediaList = postMediaRepository.findByPostIdOrderByOrderIndexAsc(post.getId());
        List<PostMediaInfo> mediaInfo = mediaList.stream()
                .map(m -> PostMediaInfo.builder()
                        .id(m.getId())
                        .mediaUrl(m.getMediaUrl())
                        .mediaType(m.getMediaType())
                        .orderIndex(m.getOrderIndex())
                        .build())
                .collect(Collectors.toList());

        // Get reactions
        List<Post_reactions> reactions = postReactionsRepository.findByPostIdOrderByCreatedAtDesc(post.getId());
        long reactionCount = reactions.size();
        boolean hasReacted = currentUserId != null && postReactionsRepository.existsByPostIdAndUserId(post.getId(), currentUserId);
        
        // Check if post is saved
        boolean isSaved = currentUserId != null && savedPostsService.isPostSaved(currentUserId, post.getId());

        // Get reactions preview (first 5)
        List<ReactionInfo> reactionsPreview = reactions.stream()
                .limit(5)
                .map(r -> {
                    Users rUser = userRepository.findById(r.getUserId()).orElse(null);
                    Profiles rProfile = rUser != null ? profilesRepository.findByUserId(rUser.getId()).orElse(null) : null;
                    UserInfo rUserInfo = userMapper.toUserInfo(rUser, rProfile);
                    return ReactionInfo.builder()
                            .id(r.getId())
                            .userId(r.getUserId())
                            .emoji(r.getEmoji() != null ? r.getEmoji() : "❤️")
                            .createdAt(r.getCreatedAt())
                            .user(rUserInfo)
                            .build();
                })
                .collect(Collectors.toList());

        // Get comment count
        long commentCount = commentsRepository.countByPostIdAndIsDeletedFalse(post.getId());

        return PostResponse.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .content(post.getContent())
                .visibility(post.getVisibility())
                .location(post.getLocation())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .user(userInfo)
                .media(mediaInfo)
                .reactionCount(reactionCount)
                .commentCount(commentCount)
                .hasReacted(hasReacted)
                .isSaved(isSaved)
                .reactions(reactionsPreview)
                .build();
    }
    
    // Optimized version sử dụng pre-loaded data để tránh N+1 query
    private PostResponse buildPostResponseOptimized(
            Posts post,
            UUID currentUserId,
            Map<UUID, Users> userMap,
            Map<UUID, Profiles> profileMap,
            List<Post_media> mediaList,
            List<Post_reactions> reactions,
            Map<UUID, Users> reactionUserMap,
            Map<UUID, Profiles> reactionProfileMap,
            boolean isSaved,
            long commentCount
    ) {
        Users user = userMap.get(post.getUserId());
        Profiles profile = profileMap.get(post.getUserId());
        UserInfo userInfo = userMapper.toUserInfo(user, profile);

        // Build media info
        List<PostMediaInfo> mediaInfo = mediaList.stream()
                .map(m -> PostMediaInfo.builder()
                        .id(m.getId())
                        .mediaUrl(m.getMediaUrl())
                        .mediaType(m.getMediaType())
                        .orderIndex(m.getOrderIndex())
                        .build())
                .collect(Collectors.toList());

        long reactionCount = reactions.size();
        boolean hasReacted = currentUserId != null && reactions.stream()
                .anyMatch(r -> r.getUserId().equals(currentUserId));

        // Get reactions preview (first 5)
        List<ReactionInfo> reactionsPreview = reactions.stream()
                .limit(5)
                .map(r -> {
                    Users rUser = reactionUserMap.get(r.getUserId());
                    Profiles rProfile = reactionProfileMap.get(r.getUserId());
                    UserInfo rUserInfo = userMapper.toUserInfo(rUser, rProfile);
                    return ReactionInfo.builder()
                            .id(r.getId())
                            .userId(r.getUserId())
                            .emoji(r.getEmoji() != null ? r.getEmoji() : "❤️")
                            .createdAt(r.getCreatedAt())
                            .user(rUserInfo)
                            .build();
                })
                .collect(Collectors.toList());

        // commentCount is already passed as parameter

        return PostResponse.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .content(post.getContent())
                .visibility(post.getVisibility())
                .location(post.getLocation())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .user(userInfo)
                .media(mediaInfo)
                .reactionCount(reactionCount)
                .commentCount(commentCount)
                .hasReacted(hasReacted)
                .isSaved(isSaved)
                .reactions(reactionsPreview)
                .build();
    }
}

