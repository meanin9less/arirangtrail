package com.example.arirangtrail.data.dao.review;

import com.example.arirangtrail.data.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReviewDAO {
    private final ReviewRepository reviewRepository;

    
}
