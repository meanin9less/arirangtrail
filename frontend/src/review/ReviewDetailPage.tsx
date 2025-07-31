import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosInstance';
import axios from 'axios';
import styles from './ReviewDetailPage.module.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './swiper-custom.css';
import { Navigation, Pagination } from 'swiper/modules';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface Photo {
    photoId: number;
    photoUrl: string;
}

interface Review {
    reviewId: string;
    username: string;
    contentId: string;
    contentTitle: string;
    title: string;
    content: string;
    rating: number;
    visitDate?: string;
    photos?: Photo[];
    caption?: string;
    createdAt: string;
    updatedAt: string;
}

interface Comment {
    commentid: string;
    reviewid: string;
    content: string;
    username: string;
    nickname: string;
    createdat: string;
    updatedat: string;
}

function ReviewDetailPage() {
    const { reviewId } = useParams<{ reviewId: string }>();
    const navigate = useNavigate();
    const currentUser = useSelector((state: RootState) => state.token.userProfile);

    const [review, setReview] = useState<Review | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newCommentText, setNewCommentText] = useState<string>('');

    const fetchComments = useCallback(async () => {
        if (!reviewId) return;
        try {
            const response = await apiClient.get(`/reviews/${reviewId}/comments`);
            setComments(response.data || []);
        } catch (error) {
            console.error("댓글 로딩 실패:", error);
            setComments([]);
        }
    }, [reviewId]);

    useEffect(() => {
        if (!reviewId) {
            setError('리뷰 ID가 제공되지 않았습니다.');
            setLoading(false);
            return;
        }

        const fetchReviewDetail = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.get(`/reviews/${reviewId}`);
                setReview(response.data);
            } catch (err: any) {
                console.error(`리뷰 상세 정보 불러오기 오류 (ID: ${reviewId}):`, err);
                let errorMessage = '리뷰 상세 정보를 불러오는 데 실패했습니다.';
                if (axios.isAxiosError(err) && err.response) {
                    errorMessage = err.response.data?.message || errorMessage;
                }
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchReviewDetail();
        fetchComments();
    }, [reviewId, fetchComments]);

    const handleAddComment = async () => {
        if (!newCommentText.trim() || !currentUser?.username) {
            alert("댓글 내용을 입력하거나 로그인해야 합니다.");
            return;
        }

        try {
            const response = await apiClient.post(`/reviews/${reviewId}/comments`, {
                content: newCommentText,
                username: currentUser.username,
                nickname: currentUser.nickname
            });
            setNewCommentText('');
            setComments([...comments, response.data])
        } catch (error) {
            console.error("댓글 추가 실패:", error);
            alert("댓글 추가에 실패했습니다.");
        }
    };

    const handleUpdateComment = async (commentId: string) => {
        const currentComment = comments.find(c => c.commentid === commentId);
        const newContent = prompt("수정할 댓글 내용을 입력하세요:", currentComment?.content);

        if (newContent && newContent.trim() !== "") {
            try {
                const response = await apiClient.put(`/reviews/comments/${commentId}`, {
                    content: newContent,
                });
                setComments(comments.map(com => {
                    return com.content === response.data.commentid ? response.data : com
                }))
            } catch (error) {
                console.error("댓글 수정 실패:", error);
                alert("댓글 수정에 실패했습니다.");
            }
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
            try {
                await apiClient.delete(`/reviews/comments/${commentId}`);
                setComments(comments.filter(com => com.commentid !== commentId));
            } catch (error) {
                console.error("댓글 삭제 실패:", error);
                alert("댓글 삭제에 실패했습니다.");
            }
        }
    };

    if (loading) {
        return <div className={styles.detailContainer}><p>리뷰를 불러오는 중...</p></div>;
    }

    if (error) {
        return (
            <div className={styles.detailContainer}>
                <p className={styles.errorMessage}>{error}</p>
                <button onClick={() => navigate('/review')} className={styles.backButton}>
                    리뷰 목록으로 돌아가기
                </button>
            </div>
        );
    }

    if (!review) {
        return (
            <div className={styles.detailContainer}>
                <p>리뷰를 찾을 수 없습니다.</p>
                <button onClick={() => navigate('/review')} className={styles.backButton}>
                    리뷰 목록으로 돌아가기
                </button>
            </div>
        );
    }

    return (
        <div className={styles.detailContainer}>
            <h2 className={styles.reviewTitle}>{review.title}</h2>

            {review.photos && review.photos.length > 0 && (
                <Swiper
                    modules={[Navigation, Pagination]}
                    spaceBetween={10}
                    slidesPerView={1}
                    navigation
                    pagination={{ clickable: true }}
                    className={styles.detailSwiper}
                >
                    {review.photos.map(photo => (
                        <SwiperSlide key={photo.photoId}>
                            <img src={photo.photoUrl} alt={review.caption || review.title} className={styles.detailImage} />
                        </SwiperSlide>
                    ))}
                </Swiper>
            )}

            <div className={styles.reviewDetailsGroup}>
                <div className={styles.reviewDetailsLine}>
                    <p className={styles.reviewDetailItem}>작성자: <strong>{review.username}</strong></p>
                    <p className={styles.reviewDetailItem}>별점: ⭐ {review.rating}</p>
                </div>
                {(review.contentTitle || review.visitDate) && (
                    <div className={styles.reviewDetailsLine}>
                        {review.contentTitle && (
                            <p className={styles.reviewDetailItem}>행사: {review.contentTitle} (ID: {review.contentId})</p>
                        )}
                        {review.visitDate && (
                            <p className={styles.reviewDetailItem}>방문일: {review.visitDate}</p>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.reviewContent}>
                <p>{review.content}</p>
            </div>

            <p className={styles.reviewDate}>작성일: {new Date(review.createdAt).toLocaleString()}</p>
            <p className={styles.reviewDate}>최종 수정일: {new Date(review.updatedAt).toLocaleString()}</p>

            <button onClick={() => navigate('/review')} className={styles.backButton}>
                목록으로
            </button>
            {currentUser && currentUser?.username === review.username && (
                <div className={styles.actionButtons}>
                    <button onClick={() => navigate(`/review/update/${reviewId}`)} className={styles.editButton}>
                        수정
                    </button>
                    <button onClick={async () => {
                        if (window.confirm("정말로 이 리뷰를 삭제하시겠습니까?")) {
                            try {
                                await apiClient.delete(`/reviews/${reviewId}`);
                                navigate(`/review`);
                            } catch (error) {
                                console.error("리뷰 삭제 실패:", error);
                                alert("리뷰 삭제에 실패했습니다.");
                            }
                        }
                    }} className={styles.editButton}>
                        삭제
                    </button>
                </div>
            )}

            <div className={styles.commentsSection}>
                <h3>댓글 ({comments.length})</h3>
                <div className={styles.commentsList}>
                    {comments.length === 0 ? (
                        <p className={styles.noComments}>아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.commentid} className={styles.commentItem}>
                                <p className={styles.commentAuthor}>{comment.nickname}<span> ({comment.username})</span></p>
                                <p className={styles.commentText}>{comment.content}</p>
                                <p className={styles.commentDate}>{new Date(comment.createdat).toLocaleString()}</p>
                                {currentUser && currentUser.username === comment.username && (
                                    <div className={styles.commentActionButtons}>
                                        <button onClick={() => handleUpdateComment(comment.commentid)} className={styles.commentEditButton}>
                                            수정
                                        </button>
                                        <button onClick={() => handleDeleteComment(comment.commentid)} className={styles.commentDeleteButton}>
                                            삭제
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className={styles.commentInputContainer}>
                    <textarea
                        className={styles.commentTextarea}
                        placeholder="댓글을 입력하세요..."
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                    />
                    <button onClick={handleAddComment} className={styles.commentSubmitButton}>
                        댓글 작성
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ReviewDetailPage;