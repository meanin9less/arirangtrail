package com.example.arirangtrail.service.review;

import com.example.arirangtrail.data.dto.review.ReviewCommentDTO;
import com.example.arirangtrail.data.entity.ReviewCommentEntity;
import com.example.arirangtrail.data.entity.ReviewEntity;
import com.example.arirangtrail.data.repository.ReviewCommentRepository;
import com.example.arirangtrail.data.repository.ReviewRepository;
import com.example.arirangtrail.data.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewCommentService {
    private final ReviewCommentRepository reviewCommentRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;

    public List<ReviewCommentDTO> getReviewCommentsByReviewId(Long reviewid) {
        ReviewEntity review = this.reviewRepository.findById(reviewid).orElse(null);
        if (review != null) {
            List<ReviewCommentEntity> reviewCommentEntity = this.reviewCommentRepository.findAllByReviewid(review);
            if(!reviewCommentEntity.isEmpty()){
                List<ReviewCommentDTO> reviewCommentDTOList = new ArrayList<>();
                for(ReviewCommentEntity reviewCommentEntity1 : reviewCommentEntity){
                    ReviewCommentDTO reviewCommentDTO = ReviewCommentDTO.builder()
                            .reviewid(review.getId())
                            .commentid(reviewCommentEntity1.getCommentid())
                            .content(reviewCommentEntity1.getContent())
                            .createdat(reviewCommentEntity1.getCreatedat())
                            .updatedat(reviewCommentEntity1.getUpdatedat())
                            .username(reviewCommentEntity1.getUsername())
                            .nickname(reviewCommentEntity1.getNickname())
                            .build();
                    reviewCommentDTOList.add(reviewCommentDTO);
                }
                return reviewCommentDTOList;
            }
        }
        return null;
    }

    public boolean createReviewComment(Long reviewid, ReviewCommentDTO reviewCommentDTO){
        ReviewEntity review = this.reviewRepository.findById(reviewid).orElse(null);
        if (review != null) {
            ReviewCommentEntity reviewCommentEntity = new ReviewCommentEntity();
            reviewCommentEntity.setCommentid(reviewCommentDTO.getCommentid());
            reviewCommentEntity.setContent(reviewCommentDTO.getContent());
            reviewCommentEntity.setUsername(reviewCommentDTO.getUsername());
            reviewCommentEntity.setNickname(reviewCommentDTO.getNickname());
            reviewCommentEntity.setReviewid(review);
            reviewCommentRepository.save(reviewCommentEntity);
            return true;
        }
        return false;
    }

}
