package com.data.db_instagram.services.impl;

import com.data.db_instagram.dto.request.CreateCommentRequest;
import com.data.db_instagram.dto.response.CommentResponse;
import com.data.db_instagram.dto.response.UserInfo;
import com.data.db_instagram.exception.HttpBadRequest;
import com.data.db_instagram.exception.HttpForbidden;
import com.data.db_instagram.exception.HttpNotFound;
import com.data.db_instagram.mapper.UserMapper;
import com.data.db_instagram.model.Comments;
import com.data.db_instagram.model.Posts;
import com.data.db_instagram.model.Profiles;
import com.data.db_instagram.model.Users;
import com.data.db_instagram.model.Comment_tags;
import com.data.db_instagram.repository.CommentsRepository;
import com.data.db_instagram.repository.CommentTagsRepository;
import com.data.db_instagram.repository.IUserRepository;
import com.data.db_instagram.repository.PostsRepository;
import com.data.db_instagram.repository.ProfilesRepository;
import com.data.db_instagram.services.CommentService;
import com.data.db_instagram.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {
    private final CommentsRepository commentsRepository;
    private final CommentTagsRepository commentTagsRepository;
    private final PostsRepository postsRepository;
    private final IUserRepository userRepository;
    private final ProfilesRepository profilesRepository;
    private final UserMapper userMapper;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public CommentResponse createComment(UUID userId, UUID postId, CreateCommentRequest request) {
        // Verify post exists
        Posts post = postsRepository.findByIdAndIsDeletedFalse(postId)
                .orElseThrow(() -> new HttpNotFound("Post not found"));

        // Validate that at least content or imageUrl is provided
        if ((request.getContent() == null || request.getContent().trim().isEmpty()) 
                && (request.getImageUrl() == null || request.getImageUrl().trim().isEmpty())) {
            throw new HttpBadRequest("Comment must have either content or image");
        }
        
        // Validate comment depth: only allow 2 levels (parent comment and one level of replies)
        if (request.getParentCommentId() != null) {
            Comments parentComment = commentsRepository.findById(request.getParentCommentId())
                    .orElseThrow(() -> new HttpNotFound("Parent comment not found"));
            
            // If parent comment itself has a parent, reject (max depth is 2)
            if (parentComment.getParentComment() != null) {
                throw new HttpBadRequest("Cannot reply to a reply. Maximum comment depth is 2 levels.");
            }
        }
        
        Comments comment = new Comments();
        comment.setPostId(postId);
        comment.setUserId(userId);
        comment.setContent(request.getContent() != null ? request.getContent().trim() : "");
        comment.setImageUrl(request.getImageUrl());
        comment.setParentComment(request.getParentCommentId());
        comment.setCreatedAt(new Date());
        comment = commentsRepository.save(comment);

        // Lưu tagged users
        if (request.getTaggedUserIds() != null && !request.getTaggedUserIds().isEmpty()) {
            for (UUID taggedUserId : request.getTaggedUserIds()) {
                Comment_tags commentTag = new Comment_tags();
                commentTag.setComment_id(comment.getId());
                commentTag.setTagged_user_id(taggedUserId);
                commentTag.setCreated_at(new Date());
                commentTagsRepository.save(commentTag);
            }
        }

        // Tạo notification cho post owner (chỉ nếu không phải comment của chính mình)
        UUID postOwnerId = post.getUserId();
        if (!postOwnerId.equals(userId)) {
            // Chỉ tạo notification cho comment chính (không phải reply)
            // Vì reply sẽ được xử lý riêng nếu cần
            if (request.getParentCommentId() == null) {
                String payload = "{\"postId\":\"" + postId + "\",\"commentId\":\"" + comment.getId() + "\"}";
                notificationService.createNotification(postOwnerId, userId, "comment", payload);
            }
        }

        // Tạo notification cho các user được tag trong comment
        if (request.getTaggedUserIds() != null && !request.getTaggedUserIds().isEmpty()) {
            String payload = "{\"postId\":\"" + postId + "\",\"commentId\":\"" + comment.getId() + "\"}";
            for (UUID taggedUserId : request.getTaggedUserIds()) {
                // Chỉ tạo notification nếu không phải chính mình và không phải post owner (đã có notification comment rồi)
                if (!taggedUserId.equals(userId) && !taggedUserId.equals(postOwnerId)) {
                    notificationService.createNotification(taggedUserId, userId, "comment_tag", payload);
                }
            }
        }

        return buildCommentResponse(comment, userId);
    }

    @Override
    @Transactional
    public void deleteComment(UUID userId, UUID commentId) {
        Comments comment = commentsRepository.findById(commentId)
                .orElseThrow(() -> new HttpNotFound("Comment not found"));

        // Lấy post để kiểm tra xem user có phải là chủ bài viết không
        Posts post = postsRepository.findByIdAndIsDeletedFalse(comment.getPostId())
                .orElseThrow(() -> new HttpNotFound("Post not found"));

        UUID postOwnerId = post.getUserId();
        UUID commentOwnerId = comment.getUserId();

        // Cho phép xóa nếu:
        // 1. User là chủ bài viết (có thể xóa tất cả comment)
        // 2. User là người bình luận (chỉ có thể xóa comment của chính mình)
        if (!postOwnerId.equals(userId) && !commentOwnerId.equals(userId)) {
            throw new HttpForbidden("Bạn chỉ có thể xóa bình luận của chính mình hoặc chủ bài viết mới có thể xóa bình luận");
        }

        // Xóa comment chính
        comment.setIsDeleted(true);
        comment.setUpdatedAt(new Date());
        commentsRepository.save(comment);

        // Xóa tất cả replies của comment này (nếu có)
        List<Comments> replies = commentsRepository.findByParentComment(commentId);
        if (replies != null && !replies.isEmpty()) {
            Date now = new Date();
            for (Comments reply : replies) {
                if (!reply.getIsDeleted()) { // Chỉ xóa nếu chưa bị xóa
                    reply.setIsDeleted(true);
                    reply.setUpdatedAt(now);
                    commentsRepository.save(reply);
                }
            }
        }
    }

    @Override
    public List<CommentResponse> getPostComments(UUID postId, UUID currentUserId) {
        List<Comments> comments = commentsRepository.findByPostIdAndParentCommentIsNullAndIsDeletedFalseOrderByCreatedAtDesc(postId);
        return comments.stream()
                .map(comment -> buildCommentResponse(comment, currentUserId))
                .collect(Collectors.toList());
    }

    @Override
    public List<CommentResponse> getCommentReplies(UUID commentId, UUID currentUserId) {
        List<Comments> replies = commentsRepository.findByParentCommentAndIsDeletedFalseOrderByCreatedAtAsc(commentId);
        return replies.stream()
                .map(reply -> buildCommentResponse(reply, currentUserId))
                .collect(Collectors.toList());
    }

    private CommentResponse buildCommentResponse(Comments comment, UUID currentUserId) {
        Users user = userRepository.findById(comment.getUserId())
                .orElse(null);
        Profiles profile = user != null ? profilesRepository.findByUserId(user.getId()).orElse(null) : null;
        UserInfo userInfo = userMapper.toUserInfo(user, profile);

        // Count replies
        long replyCount = commentsRepository.findByParentCommentAndIsDeletedFalseOrderByCreatedAtAsc(comment.getId()).size();

        // Get tagged user IDs
        List<UUID> taggedUserIds = commentTagsRepository.findByComment_id(comment.getId())
                .stream()
                .map(Comment_tags::getTagged_user_id)
                .collect(Collectors.toList());

        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPostId())
                .userId(comment.getUserId())
                .parentCommentId(comment.getParentComment())
                .content(comment.getContent())
                .imageUrl(comment.getImageUrl())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .user(userInfo)
                .replyCount(replyCount)
                .reactionCount(0) // TODO: Add comment reactions if needed
                .hasReacted(false)
                .taggedUserIds(taggedUserIds)
                .build();
    }
}

