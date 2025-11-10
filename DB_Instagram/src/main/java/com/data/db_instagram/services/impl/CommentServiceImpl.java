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
import com.data.db_instagram.repository.CommentsRepository;
import com.data.db_instagram.repository.IUserRepository;
import com.data.db_instagram.repository.PostsRepository;
import com.data.db_instagram.repository.ProfilesRepository;
import com.data.db_instagram.services.CommentService;
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
    private final PostsRepository postsRepository;
    private final IUserRepository userRepository;
    private final ProfilesRepository profilesRepository;
    private final UserMapper userMapper;

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

        return buildCommentResponse(comment, userId);
    }

    @Override
    @Transactional
    public void deleteComment(UUID userId, UUID commentId) {
        Comments comment = commentsRepository.findById(commentId)
                .orElseThrow(() -> new HttpNotFound("Comment not found"));

        if (!comment.getUserId().equals(userId)) {
            throw new HttpForbidden("You can only delete your own comments");
        }

        comment.setIsDeleted(true);
        comment.setUpdatedAt(new Date());
        commentsRepository.save(comment);
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
                .build();
    }
}

