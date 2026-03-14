import React, { useState, useEffect, useRef } from 'react';
import { likeVideo, addComment, getVideoFeed, toggleFollow, recordWatch, saveVideo } from '../api';

// Free sample comedy videos (Mixkit CDN)
const SAMPLE_VIDEOS = [
    "https://assets.mixkit.co/videos/preview/mixkit-young-man-with-long-hair-laughing-while-using-his-phone-41481-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-changing-a-lights-of-a-club-32943-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-portrait-of-a-fashion-woman-with-pink-hair-39875-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-group-of-friends-partying-happily-4640-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-taking-photos-from-different-angles-of-a-model-34421-large.mp4",
];

const getVideoSrc = (video) => {
    if (!video) return SAMPLE_VIDEOS[0];
    const url = video.video_url || video.videoUrl;

    if (url) {
        // If it's a relative path from the backend (manual upload)
        if (url.startsWith('/media/')) {
            return `http://127.0.0.1:8000${url}`;
        }
        return url;
    }

    // Fallback to sample videos using id-based rotation
    const index = (typeof video.id === 'number' ? video.id : String(video.id).length) % SAMPLE_VIDEOS.length;
    return SAMPLE_VIDEOS[Math.abs(index)];
};

const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
        const origin = window.location.origin;
        return `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=1&rel=0&enablejsapi=1&origin=${origin}`;
    }
    return null;
};

const formatCount = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
};

const FeedVideoItem = ({ video, onClose, startWithComments, isMobile }) => {
    const containerRef = useRef(null);
    const videoRef = useRef(null);
    const iframeRef = useRef(null);
    const [isActive, setIsActive] = useState(!isMobile);

    const [liked, setLiked] = useState(video?.is_liked || false);
    const [saved, setSaved] = useState(video?.is_saved || false);
    const [likeCount, setLikeCount] = useState(video?.likes || 0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showComments, setShowComments] = useState(startWithComments);
    const [comments, setComments] = useState(video?.comments || []);
    const [commentName, setCommentName] = useState('');
    const [commentText, setCommentText] = useState('');
    const [posting, setPosting] = useState(false);
    const [following, setFollowing] = useState(video?.creator?.is_following || false);

    const videoSrc = getVideoSrc(video);
    const youtubeUrl = getYouTubeEmbedUrl(videoSrc);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            const visible = entry.isIntersecting;
            setIsActive(visible);
            if (visible) {
                if (video.id) recordWatch(video.id); // Track real history
                if (videoRef.current) {
                    videoRef.current.play().catch(e => console.log("Autoplay prevented:", e));
                    setIsPlaying(true);
                }
                if (iframeRef.current && iframeRef.current.contentWindow) {
                    iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                }
            } else {
                if (videoRef.current) {
                    videoRef.current.pause();
                    setIsPlaying(false);
                }
                if (iframeRef.current && iframeRef.current.contentWindow) {
                    iframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                }
            }
        }, { threshold: 0.3, rootMargin: '0px' });

        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [video.id]);

    useEffect(() => {
        if (isActive) {
            if (videoRef.current) {
                videoRef.current.play().catch(e => console.log("Autoplay prevented:", e));
                setIsPlaying(true);
            }
            if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
            }
        } else {
            if (videoRef.current) {
                videoRef.current.pause();
                setIsPlaying(false);
            }
            if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            }
        }
    }, [isActive]);

    const handleLike = async () => {
        if (!video.id) return;
        const newLiked = !liked;
        setLiked(newLiked);
        try {
            const data = await likeVideo(video.id, newLiked ? 'like' : 'unlike');
            setLikeCount(data.likes);
        } catch (err) {
            setLiked(!newLiked);
        }
    };

    const handleSave = async () => {
        if (!video.id) return;
        const newSaved = !saved;
        setSaved(newSaved);
        try {
            await saveVideo(video.id, newSaved ? 'save' : 'unsave');
        } catch (err) {
            setSaved(!newSaved);
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

    const handlePostComment = async () => {
        if (!commentName.trim() || !commentText.trim() || !video.id) return;
        setPosting(true);
        try {
            const data = await addComment(video.id, commentName.trim(), commentText.trim());
            setComments(prev => [data, ...prev]);
            setCommentName('');
            setCommentText('');
        } finally {
            setPosting(false);
        }
    };

    const handleToggleFollow = async () => {
        const token = localStorage.getItem('token');
        if (!token || !video.creator) return;
        const newFollowing = !following;
        setFollowing(newFollowing);
        try {
            await toggleFollow(token, video.creator_id || video.creator);
        } catch (err) {
            setFollowing(!newFollowing);
        }
    };

    if (isMobile) {
        return (
            <div ref={containerRef} style={{ width: '100vw', height: '100dvh', scrollSnapAlign: 'start', position: 'relative', background: '#000', overflow: 'hidden' }}>
                {youtubeUrl ? (
                    <iframe ref={iframeRef} width="100%" height="100%" src={youtubeUrl} title={video.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ pointerEvents: isActive ? 'auto' : 'none' }}></iframe>
                ) : (
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        playsInline
                        loop
                        muted
                        poster={video.img_url || video.img}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onClick={togglePlay}
                    />
                )}

                {/* Back / Close button */}
                <button onClick={onClose} style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, cursor: 'pointer', backdropFilter: 'blur(5px)' }}>
                    <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                </button>

                {/* Right side controls (Instagram style) */}
                <div style={{ position: 'absolute', right: '12px', bottom: '100px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', zIndex: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <button onClick={handleLike} style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)', border: 'none', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <svg width="24" height="24" fill={liked ? '#ff3d00' : 'none'} stroke={liked ? '#ff3d00' : 'white'} strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                        </button>
                        <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{formatCount(likeCount)}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <button onClick={() => setShowComments(!showComments)} style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)', border: 'none', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                        </button>
                        <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{formatCount(comments.length)}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <button onClick={handleSave} style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)', border: 'none', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <svg width="24" height="24" fill={saved ? '#ff3d00' : 'none'} stroke={saved ? '#ff3d00' : 'white'} strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                        </button>
                        <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>Save</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <button style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)', border: 'none', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                        </button>
                        <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>Share</span>
                    </div>
                </div>

                {/* Bottom info section */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 80px 30px 20px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', zIndex: 5, pointerEvents: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ width: '38px', height: '38px', background: '#ff3d00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                            {(video.creator_name || String(video.creator || 'U'))[0]}
                        </div>
                        <span style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                            {String(video.creator_name || video.creator || 'Creator')}
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleToggleFollow(); }}
                            style={{
                                background: following ? 'rgba(255,255,255,0.1)' : 'transparent',
                                border: '1px solid #fff',
                                borderRadius: '4px',
                                color: '#fff',
                                padding: '2px 8px',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                pointerEvents: 'auto'
                            }}
                        >
                            {following ? 'Following' : 'Follow'}
                        </button>
                    </div>
                    <p style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '500', margin: 0, textShadow: '0 1px 3px rgba(0,0,0,0.8)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {video.title}
                    </p>
                </div>

                {/* Mobile Comments Drawer overlay */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60vh', background: 'var(--bg-primary)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 20, transform: showComments ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.3s cubic-bezier(0.15, 0.85, 0.35, 1)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Comments ({comments.length})</h3>
                        <button onClick={() => setShowComments(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {comments.map((c, i) => (
                            <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '14px' }}>
                                <div style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg, #ff6a00, #ff3d00)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '0.8rem' }}>
                                    {(c.user_name || 'A')[0]}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)', marginRight: '8px' }}>{c.user_name || c.name}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Just now'}</span>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>{c.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
                        <input type="text" placeholder="Add comment..." value={commentText} onChange={e => setCommentText(e.target.value)} style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '20px', color: 'var(--text-primary)', outline: 'none' }} />
                        <button onClick={() => { handlePostComment(); setCommentName('User'); }} style={{ background: '#ff3d00', color: '#fff', border: 'none', borderRadius: '20px', padding: '0 20px', fontWeight: 'bold' }}>Post</button>
                    </div>
                </div>
            </div>
        );
    }

    // DESKTOP original layout approach preserved
    return (
        <div ref={containerRef} style={{ width: '100%', scrollSnapAlign: 'start', display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-primary)', borderRadius: '24px', width: '100%', maxWidth: '600px', border: '1px solid var(--border)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                {/* ── Video Player ── */}
                <div className="video-player-wrap" style={{ position: 'relative', width: '100%', background: '#000', overflow: 'hidden', aspectRatio: '16/9' }}>
                    {youtubeUrl ? (
                        <iframe ref={iframeRef} width="100%" height="100%" src={youtubeUrl} title={video.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                src={videoSrc}
                                playsInline
                                loop
                                muted
                                poster={video.img_url || video.img}
                                onClick={togglePlay}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                            />
                            {/* Play/Pause overlay center button */}
                            <div className="video-play-overlay" onClick={togglePlay} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: isPlaying ? 0 : 1, transition: 'opacity 0.2s', background: isPlaying ? 'transparent' : 'rgba(0,0,0,0.3)' }}>
                                {!isPlaying && (
                                    <div style={{ width: '60px', height: '60px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', border: '2px solid rgba(255,255,255,0.3)' }}>
                                        <svg width="22" height="22" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                    <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '12px', width: '34px', height: '34px', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', zIndex: 2 }}>✕</button>
                </div>

                {/* ── Content below video ── */}
                <div style={{ padding: '20px 20px 0' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.4 }}>{video.title}</h2>

                    {/* Views / Likes / Comment / Follow Toggle  */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                            <div style={{ width: '28px', height: '28px', background: '#ff3d00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '12px', marginRight: '6px' }}>
                                {(video.creator_name || String(video.creator || 'U'))[0]}
                            </div>
                            <span style={{ fontWeight: 800, color: 'var(--text-primary)', marginRight: '8px' }}>
                                {String(video.creator_name || video.creator || 'Creator')}
                            </span>
                            <button
                                onClick={handleToggleFollow}
                                style={{
                                    background: following ? 'var(--bg-secondary)' : '#ff3d00',
                                    border: 'none',
                                    borderRadius: '14px',
                                    color: following ? 'var(--text-primary)' : '#fff',
                                    padding: '4px 12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    marginRight: '12px'
                                }}
                            >
                                {following ? 'Following' : 'Follow'}
                            </button>
                            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            <span>{video.views || '1.2K'} views</span>
                        </div>
                        <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: liked ? 'rgba(255,61,0,0.12)' : 'var(--bg-secondary)', border: liked ? '1px solid rgba(255,61,0,0.4)' : '1px solid var(--border)', borderRadius: '20px', padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: liked ? '#ff3d00' : 'var(--text-secondary)' }}>
                            <svg width="15" height="15" fill={liked ? '#ff3d00' : 'none'} stroke={liked ? '#ff3d00' : 'currentColor'} strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            {formatCount(likeCount)}
                        </button>

                        <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: saved ? 'rgba(255,61,0,0.12)' : 'var(--bg-secondary)', border: saved ? '1px solid rgba(255,61,0,0.4)' : '1px solid var(--border)', borderRadius: '20px', padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: saved ? '#ff3d00' : 'var(--text-secondary)' }}>
                            <svg width="15" height="15" fill={saved ? '#ff3d00' : 'none'} stroke={saved ? '#ff3d00' : 'currentColor'} strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                            {saved ? 'Saved' : 'Save'}
                        </button>
                        <button onClick={() => setShowComments(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: showComments ? 'rgba(255,61,0,0.12)' : 'var(--bg-secondary)', border: showComments ? '1px solid rgba(255,61,0,0.4)' : '1px solid var(--border)', borderRadius: '20px', padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: showComments ? '#ff3d00' : 'var(--text-secondary)' }}>
                            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            {comments.length}
                        </button>
                    </div>

                    {showComments && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Comments</h3>
                            </div>
                            <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '16px', marginBottom: '20px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input type="text" placeholder="Your name..." value={commentName} onChange={e => setCommentName(e.target.value)} style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    <textarea placeholder="Share your thoughts..." value={commentText} onChange={e => setCommentText(e.target.value)} rows={2} style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', resize: 'none' }} />
                                </div>
                                <button onClick={handlePostComment} disabled={!commentName.trim() || !commentText.trim()} style={{ width: '100%', padding: '10px', marginTop: '10px', background: (!commentName.trim() || !commentText.trim()) ? 'var(--bg-tertiary)' : '#ff3d00', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>
                                    Post
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px' }}>
                                {comments.map((c, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '12px', padding: '14px', background: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--border)' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{c.user_name || c.name}</span>
                                            </div>
                                            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>{c.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const VideoModal = ({ video, onClose, startWithComments = false }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [feedList, setFeedList] = useState([video]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Load feed
        getVideoFeed().then(res => {
            // Filter out the video we already show to avoid immediate duplication
            const otherVideos = res.filter(v => v.id !== video.id);
            setFeedList([video, ...otherVideos]);
        }).catch(err => {
            console.error(err);
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            document.body.style.overflow = '';
        };
    }, [video]);

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    if (!video) return null;

    if (isMobile) {
        return (
            <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 9999, height: '100dvh', width: '100vw', overflowY: 'scroll', scrollSnapType: 'y mandatory', scrollbarWidth: 'none' }}>
                <style>{`
                    ::-webkit-scrollbar { display: none; }
                `}</style>
                {feedList.map((item, idx) => (
                    <FeedVideoItem key={idx + '-' + item.id} video={item} onClose={onClose} startWithComments={startWithComments} isMobile={true} />
                ))}
            </div>
        );
    }

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
            <FeedVideoItem video={video} onClose={onClose} startWithComments={startWithComments} isMobile={false} />
        </div>
    );
};

export default VideoModal;
