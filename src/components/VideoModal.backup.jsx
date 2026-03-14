import React, { useState, useEffect, useRef } from 'react';
import { likeVideo, addComment } from '../api';

// Free sample comedy videos (Mixkit CDN)
const SAMPLE_VIDEOS = [
    "https://assets.mixkit.co/videos/preview/mixkit-young-man-with-long-hair-laughing-while-using-his-phone-41481-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-changing-a-lights-of-a-club-32943-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-portrait-of-a-fashion-woman-with-pink-hair-39875-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-group-of-friends-partying-happily-4640-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-taking-photos-from-different-angles-of-a-model-34421-large.mp4",
];

const getVideoSrc = (id) => {
    const index = (typeof id === 'number' ? id : String(id).length) % SAMPLE_VIDEOS.length;
    return SAMPLE_VIDEOS[Math.abs(index)];
};

const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=0&rel=0`;
    }
    return null;
};

const StarRating = ({ rating, onRate }) => {
    const [hovered, setHovered] = useState(0);
    return (
        <div style={{ display: 'flex', gap: '6px', margin: '6px 0 20px' }}>
            {[1, 2, 3, 4, 5].map(star => (
                <span
                    key={star}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => onRate(star)}
                    style={{
                        fontSize: '1.6rem',
                        cursor: 'pointer',
                        color: star <= (hovered || rating) ? '#ffb300' : 'var(--border)',
                        transition: 'color 0.2s, transform 0.15s',
                        transform: hovered === star ? 'scale(1.25)' : 'scale(1)',
                        display: 'inline-block'
                    }}
                >★</span>
            ))}
            {rating > 0 && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', alignSelf: 'center', marginLeft: '6px' }}>
                    {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
                </span>
            )}
        </div>
    );
};

const VideoModal = ({ video, onClose, startWithComments = false }) => {
    const videoRef = useRef(null);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(video?.likes || 0);
    const [rating, setRating] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [showComments, setShowComments] = useState(startWithComments);
    const [comments, setComments] = useState(video?.comments || []);
    const [commentName, setCommentName] = useState('');
    const [commentText, setCommentText] = useState('');
    const [posting, setPosting] = useState(false);

    const videoSrc = video?.video_url || video?.videoUrl || getVideoSrc(video?.id || 1);
    const youtubeUrl = getYouTubeEmbedUrl(videoSrc);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    // ESC key to close
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleLike = async () => {
        if (!video.id) return;
        const newLiked = !liked;
        setLiked(newLiked);

        try {
            const data = await likeVideo(video.id, newLiked ? 'like' : 'unlike');
            setLikeCount(data.likes);
        } catch (err) {
            console.error("Failed to like video", err);
            // Revert on error
            setLiked(!newLiked);
        }
    };

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(videoRef.current.muted);
    };

    const handleRate = (star) => setRating(star);

    const handlePostComment = async () => {
        if (!commentName.trim() || !commentText.trim() || !video.id) return;
        setPosting(true);
        try {
            const data = await addComment(video.id, commentName.trim(), commentText.trim());
            setComments(prev => [data, ...prev]);
            setCommentName('');
            setCommentText('');
        } catch (err) {
            console.error("Failed to post comment", err);
        } finally {
            setPosting(false);
        }
    };

    const formatCount = (n) => {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toString();
    };

    if (!video) return null;

    return (
        <>
            <style>{`
                @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes modalSlideUp { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes spin { to { transform: rotate(360deg); } }
                .video-play-overlay { opacity: 0; transition: opacity 0.2s; }
                .video-player-wrap:hover .video-play-overlay { opacity: 1; }
            `}</style>
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.82)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 8000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    animation: 'modalFadeIn 0.25s ease',
                }}
            >
                <div
                    onClick={e => e.stopPropagation()}
                    style={{
                        background: 'var(--bg-primary)',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '600px',
                        maxHeight: '92vh',
                        overflowY: 'auto',
                        position: 'relative',
                        animation: 'modalSlideUp 0.35s cubic-bezier(0.15, 0.85, 0.35, 1)',
                        scrollbarWidth: 'none',
                        border: '1px solid var(--border)',
                        boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
                    }}
                >
                    {/* ── Video Player ── */}
                    <div
                        className="video-player-wrap"
                        style={{ position: 'relative', width: '100%', background: '#000', borderRadius: '24px 24px 0 0', overflow: 'hidden', aspectRatio: '16/9' }}
                    >
                        {youtubeUrl ? (
                            <iframe
                                width="100%"
                                height="100%"
                                src={youtubeUrl}
                                title={video.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{ borderRadius: '24px 24px 0 0' }}
                            ></iframe>
                        ) : (
                            <>
                                <video
                                    ref={videoRef}
                                    src={videoSrc}
                                    autoPlay
                                    playsInline
                                    loop
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                />

                                {/* Dark gradient bottom */}
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(transparent, rgba(0,0,0,0.75))', pointerEvents: 'none' }} />

                                {/* Play/Pause overlay center button */}
                                <div
                                    className="video-play-overlay"
                                    onClick={togglePlay}
                                    style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                >
                                    <div style={{ width: '60px', height: '60px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', border: '2px solid rgba(255,255,255,0.3)' }}>
                                        {isPlaying ? (
                                            <svg width="22" height="22" fill="white" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                        ) : (
                                            <svg width="22" height="22" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Bottom controls bar */}
                        <div style={{ position: 'absolute', bottom: '10px', left: '12px', right: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {/* Creator */}
                            {(video.creator_name || video.creator) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '28px', height: '28px', background: '#ff3d00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                                        {(video.creator_name || String(video.creator))[0]}
                                    </div>
                                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                                        {video.creator_name || video.creator}
                                    </span>
                                </div>
                            )}
                            {/* Mute + Play */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={toggleMute}
                                    style={{ width: '32px', height: '32px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                                >
                                    {isMuted ? (
                                        <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17 18.36L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
                                    ) : (
                                        <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                                    )}
                                </button>
                                <button
                                    onClick={togglePlay}
                                    style={{ width: '32px', height: '32px', background: 'rgba(255,61,0,0.85)', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                >
                                    {isPlaying ? (
                                        <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                    ) : (
                                        <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute', top: '12px', right: '12px',
                                width: '34px', height: '34px',
                                background: 'rgba(0,0,0,0.55)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#fff', fontSize: '1rem',
                                backdropFilter: 'blur(4px)',
                                transition: 'background 0.2s',
                                zIndex: 2
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,61,0,0.8)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.55)'}
                        >✕</button>
                    </div>

                    {/* ── Content below video ── */}
                    <div style={{ padding: '20px 20px 0' }}>

                        {/* Title */}
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.4 }}>{video.title}</h2>

                        {/* Views / Likes / Comment Toggle / Rating row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                <span>{video.views || '1.2K'} views</span>
                            </div>
                            <button
                                onClick={handleLike}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: liked ? 'rgba(255,61,0,0.12)' : 'var(--bg-secondary)',
                                    border: liked ? '1px solid rgba(255,61,0,0.4)' : '1px solid var(--border)',
                                    borderRadius: '20px', padding: '6px 14px',
                                    cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
                                    color: liked ? '#ff3d00' : 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <svg width="15" height="15" fill={liked ? '#ff3d00' : 'none'} stroke={liked ? '#ff3d00' : 'currentColor'} strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                                {formatCount(likeCount)}
                            </button>
                            {/* Comment Toggle Button */}
                            <button
                                onClick={() => setShowComments(p => !p)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: showComments ? 'rgba(255,61,0,0.12)' : 'var(--bg-secondary)',
                                    border: showComments ? '1px solid rgba(255,61,0,0.4)' : '1px solid var(--border)',
                                    borderRadius: '20px', padding: '6px 14px',
                                    cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
                                    color: showComments ? '#ff3d00' : 'var(--text-secondary)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                {comments.length}
                            </button>
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                <span>⭐</span>
                                <span>{rating > 0 ? `${rating}.0 / 5.0` : 'No rating yet'}</span>
                            </div>
                        </div>

                        {/* Star Rating */}
                        <div style={{ marginBottom: '4px' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>Rate this video:</h3>
                            <StarRating rating={rating} onRate={handleRate} />
                        </div>

                        <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0 18px' }} />

                        {/* Comment Section — collapsed by default, opens on comment icon click */}
                        {showComments && (
                            <>
                                {/* Comments Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                                    <svg width="18" height="18" fill="none" stroke="var(--text-primary)" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Comments</h3>
                                    <span style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderRadius: '12px', padding: '2px 10px', fontSize: '0.8rem', fontWeight: 700 }}>{comments.length}</span>
                                </div>

                                {/* Comment Input */}
                                <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '16px', marginBottom: '20px', border: '1px solid var(--border)' }}>
                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '6px' }}>Your name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter your name..."
                                            value={commentName}
                                            onChange={e => setCommentName(e.target.value)}
                                            style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                                            onFocus={e => e.target.style.borderColor = '#ff3d00'}
                                            onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '6px' }}>Comment</label>
                                        <textarea
                                            placeholder="Share your thoughts on this video..."
                                            value={commentText}
                                            onChange={e => setCommentText(e.target.value)}
                                            rows={3}
                                            style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                            onFocus={e => e.target.style.borderColor = '#ff3d00'}
                                            onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                        />
                                    </div>
                                    <button
                                        onClick={handlePostComment}
                                        disabled={posting || !commentName.trim() || !commentText.trim()}
                                        style={{
                                            width: '100%', padding: '12px',
                                            background: (!commentName.trim() || !commentText.trim()) ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #ff6a00, #ff3d00)',
                                            color: (!commentName.trim() || !commentText.trim()) ? 'var(--text-secondary)' : '#fff',
                                            border: 'none', borderRadius: '12px',
                                            fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {posting ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                                                Posting...
                                            </span>
                                        ) : (
                                            <>
                                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                                                Post Comment
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Comment List */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px' }}>
                                    {comments.map(c => (
                                        <div key={c.id} style={{ display: 'flex', gap: '12px', padding: '14px', background: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--border)', animation: 'fadeIn 0.3s ease' }}>
                                            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #ff6a00, #ff3d00)', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '0.9rem' }}>
                                                {(c.user_name || 'A')[0]}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{c.user_name || c.name}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : (c.time || 'Just now')}
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{c.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default VideoModal;
