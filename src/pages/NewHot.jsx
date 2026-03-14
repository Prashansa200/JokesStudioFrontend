import React, { useRef, useState, useEffect } from 'react';
import LikeButton from '../components/LikeButton';
import { getNewHotData, saveVideo, toggleFollow } from '../api';
import VideoModal from '../components/VideoModal';

const NewHot = () => {
    const risingRef = useRef(null);
    const latestRef = useRef(null);
    const creatorsRef = useRef(null);
    const picksRef = useRef(null);
    const tagsRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [showHashtags, setShowHashtags] = useState(false);
    const [selectedTag, setSelectedTag] = useState('');

    // Dynamic data states
    const [risingVideos, setRisingVideos] = useState([]);
    const [latestUploads, setLatestUploads] = useState([]);
    const [genericCreators, setGenericCreators] = useState([]);
    const [editorsPicks, setEditorsPicks] = useState([]);

    const [isRisingHovered, setIsRisingHovered] = useState(false);
    const [isLatestHovered, setIsLatestHovered] = useState(false);
    const [isCreatorsHovered, setIsCreatorsHovered] = useState(false);
    const [isPicksHovered, setIsPicksHovered] = useState(false);

    const [selectedVideo, setSelectedVideo] = useState(null);
    const [modalConfig, setModalConfig] = useState({ startWithComments: false });

    const openVideoModal = (video, options = {}) => {
        setSelectedVideo(video);
        setModalConfig({ startWithComments: !!options.startWithComments });
    };

    useEffect(() => {
        const fetchNewHot = async () => {
            try {
                setIsInitialLoading(true);
                const data = await getNewHotData();
                setRisingVideos(Array.isArray(data.rising) ? data.rising : []);
                setLatestUploads(Array.isArray(data.latest) ? data.latest : []);
                setEditorsPicks(Array.isArray(data.picks) ? data.picks : []);
                if (data.creators && data.creators.length > 0) setGenericCreators(data.creators);
            } catch (error) {
                console.error("Error fetching new & hot data:", error);
            } finally {
                setIsInitialLoading(false);
            }
        };
        fetchNewHot();
    }, []);

    const tags = ["#officejokes", "#indianparents", "#relationshipmemes", "#engineerlife", "#collegefun", "#gymfails", "#startupjokes", "#monsoonvibe"];
    const tagKeywords = {
        '#officejokes': ['office', 'work', 'meeting', 'boss', 'corporate'],
        '#indianparents': ['parent', 'indian parent', 'mom', 'dad', 'family'],
        '#relationshipmemes': ['relationship', 'dating', 'couple', 'love', 'breakup'],
        '#engineerlife': ['engineer', 'coding', 'developer', 'tech', 'interview'],
        '#collegefun': ['college', 'campus', 'student', 'hostel', 'classroom'],
        '#gymfails': ['gym', 'workout', 'fitness', 'trainer', 'fails'],
        '#startupjokes': ['startup', 'founder', 'business', 'pitch', 'entrepreneur'],
        '#monsoonvibe': ['rain', 'monsoon', 'umbrella', 'weather', 'season']
    };

    const matchesSelectedTag = (video) => {
        if (!selectedTag) return true;
        const raw = [
            video?.title,
            video?.creator_name,
            video?.description,
            video?.section,
            Array.isArray(video?.tags) ? video.tags.join(' ') : video?.tags
        ].filter(Boolean).join(' ').toLowerCase();
        const keywords = tagKeywords[selectedTag] || [selectedTag.replace('#', '')];
        return keywords.some(k => raw.includes(k));
    };

    const filteredRisingVideos = risingVideos.filter(matchesSelectedTag);
    const filteredLatestUploads = latestUploads.filter(matchesSelectedTag);
    const filteredEditorsPicks = editorsPicks.filter(matchesSelectedTag);

    // Auto-scroll logic helper
    useEffect(() => {
        const setupAutoScroll = (ref, isHovered, scrollAmount = 300) => {
            if (!ref.current || isHovered) return null;
            const interval = setInterval(() => {
                const container = ref.current;
                const maxScroll = container.scrollWidth - container.clientWidth;
                if (container.scrollLeft >= maxScroll - 10) {
                    container.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                }
            }, 2000);
            return () => clearInterval(interval);
        };

        const cleanupRising = setupAutoScroll(risingRef, isRisingHovered);
        const cleanupLatest = setupAutoScroll(latestRef, isLatestHovered);
        const cleanupCreators = setupAutoScroll(creatorsRef, isCreatorsHovered, 200);
        const cleanupPicks = setupAutoScroll(picksRef, isPicksHovered, 350);

        return () => {
            if (cleanupRising) cleanupRising();
            if (cleanupLatest) cleanupLatest();
            if (cleanupCreators) cleanupCreators();
            if (cleanupPicks) cleanupPicks();
        };
    }, [isRisingHovered, isLatestHovered, isCreatorsHovered, isPicksHovered]);

    const handleLoadMore = () => {
        if (!showHashtags) {
            setLoading(true);
            setTimeout(() => {
                setLoading(false);
                setShowHashtags(true);
                setTimeout(() => {
                    tagsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
            }, 450);
            return;
        }
        setLoading(true);
        setTimeout(() => setLoading(false), 1500);
    };

    const handleCreatorFollow = async (creatorId, userId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Please login to follow creators");
            return;
        }

        if (!userId) {
            alert("This creator is not currently linkable (no backend user)");
            return;
        }

        const prevData = [...genericCreators];
        setGenericCreators(prev => prev.map(c => {
            if (c.id === creatorId) {
                return { ...c, is_following: !c.is_following };
            }
            return c;
        }));

        try {
            const res = await toggleFollow(token, userId);
            if (res.error) {
                setGenericCreators(prevData);
                alert(res.error);
            } else if (res.status) {
                setGenericCreators(prev => prev.map(c => {
                    if (c.id === creatorId) {
                        return {
                            ...c,
                            is_following: res.status === 'followed',
                            real_followers_count: res.followers_count
                        };
                    }
                    return c;
                }));
            }
        } catch (err) {
            setGenericCreators(prevData);
            console.error("Follow failed", err);
        }
    };

    return (
        <div className="main-content">
            <div className="popular-page-view" style={{ animation: 'fadeIn 0.5s ease' }}>
                {isInitialLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                        <div className="nh-spinner"></div>
                        <span style={{ marginTop: '15px', color: 'var(--text-secondary)', fontWeight: '600' }}>Discovering what's hot...</span>
                    </div>
                ) : (
                    <section className="row-section" style={{ marginTop: '2rem' }}>
                        <div className="page-header-premium" style={{ marginBottom: '3rem' }}>
                            <div className="premium-accent-bar"></div>
                            <div>
                                <h1 className="premium-page-title" style={{ color: 'var(--text-primary)' }}>🔥 New & Hot</h1>
                                <p className="premium-page-subtitle" style={{ color: 'var(--text-secondary)' }}>Fresh comedy videos that are trending right now</p>
                            </div>
                        </div>

                        {/* 🚀 Rising Viral Videos */}
                        <div className="section-wrapper" onMouseEnter={() => setIsRisingHovered(true)} onMouseLeave={() => setIsRisingHovered(false)}>
                            <div className="video-row-header">
                                <h2 className="section-title">🚀 Rising Viral Videos</h2>
                                <div className="row-nav">
                                    <button className="row-arrow" onClick={() => risingRef.current?.scrollBy({ left: -260, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                                    <button className="row-arrow" onClick={() => risingRef.current?.scrollBy({ left: 260, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                                </div>
                            </div>
                            <div className="poster-grid" ref={risingRef} style={{ gap: '2rem' }}>
                                {filteredRisingVideos.map(item => (
                                    <div key={item.id} className="nh-video-card" onClick={() => openVideoModal(item)} style={{ cursor: 'pointer' }}>
                                        <div className="nh-thumb-wrapper">
                                            <img src={item.img_url} alt={item.title} />
                                            <div className="nh-badge">🔥 Trending</div>

                                            <div
                                                className={`card-save-btn-v2 ${item.is_saved ? 'active' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    saveVideo(item.id, item.is_saved ? 'unsave' : 'save');
                                                    item.is_saved = !item.is_saved;
                                                    e.currentTarget.classList.toggle('active');
                                                }}
                                                style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, width: '30px', height: '30px' }}
                                            >
                                                <svg fill={item.is_saved ? "white" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="nh-card-content">
                                            <div className="nh-title">{item.title}</div>
                                            <div className="nh-creator-row">
                                                <div className="nh-avatar">{(item.creator_name || 'U')[0]}</div>
                                                <span className="nh-creator-name">{item.creator_name}</span>
                                            </div>
                                            <div className="nh-divider"></div>
                                            <div className="nh-meta-row">
                                                <LikeButton initialLikes={item.likes} itemId={item.id} />
                                                <div className="nh-meta-item">💬 {item.comment_count || 0}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 🆕 Latest Uploads */}
                        <div className="section-wrapper" style={{ marginTop: '4rem' }} onMouseEnter={() => setIsLatestHovered(true)} onMouseLeave={() => setIsLatestHovered(false)}>
                            <div className="video-row-header">
                                <h2 className="section-title">🆕 Latest Uploads</h2>
                                <div className="row-nav">
                                    <button className="row-arrow" onClick={() => latestRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                                    <button className="row-arrow" onClick={() => latestRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                                </div>
                            </div>
                            <div className="poster-grid" ref={latestRef} style={{ gap: '2rem' }}>
                                {filteredLatestUploads.map(item => (
                                    <div key={item.id} className="nh-video-card" onClick={() => openVideoModal(item)} style={{ cursor: 'pointer' }}>
                                        <div className="nh-thumb-wrapper">
                                            <img src={item.img_url} alt={item.title} />
                                            <div className="nh-badge" style={{ background: 'linear-gradient(135deg, #0cebeb, #20e3b2)' }}>NEW</div>

                                            <div
                                                className={`card-save-btn-v2 ${item.is_saved ? 'active' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    saveVideo(item.id, item.is_saved ? 'unsave' : 'save');
                                                    item.is_saved = !item.is_saved;
                                                    e.currentTarget.classList.toggle('active');
                                                }}
                                                style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, width: '30px', height: '30px' }}
                                            >
                                                <svg fill={item.is_saved ? "white" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="nh-card-content">
                                            <div className="nh-title">{item.title}</div>
                                            <div className="nh-creator-row">
                                                <div className="nh-avatar">{(item.creator_name || 'U')[0]}</div>
                                                <span className="nh-creator-name">{item.creator_name}</span>
                                            </div>
                                            <div className="nh-divider"></div>
                                            <div className="nh-time">⏱ {item.time || 'Recently'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ⭐ New Comedy Creators */}
                        <div className="section-wrapper" style={{ marginTop: '4rem' }} onMouseEnter={() => setIsCreatorsHovered(true)} onMouseLeave={() => setIsCreatorsHovered(false)}>
                            <div className="video-row-header">
                                <h2 className="section-title">⭐ New Comedy Creators</h2>
                                <div className="row-nav">
                                    <button className="row-arrow" onClick={() => creatorsRef.current?.scrollBy({ left: -180, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                                    <button className="row-arrow" onClick={() => creatorsRef.current?.scrollBy({ left: 180, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                                </div>
                            </div>
                            <div className="poster-grid newhot-creators-grid" ref={creatorsRef} style={{ gap: '1.5rem', paddingBottom: '1rem' }}>
                                {genericCreators.map(item => (
                                    <div key={item.id} className="nh-creator-card">
                                        <img src={item.img_url} alt={item.name} className="nh-creator-img" />
                                        <div className="nh-creator-name-bold">{item.name}</div>
                                        <button
                                            className="nh-follow-btn"
                                            onClick={() => handleCreatorFollow(item.id, item.user)}
                                            style={{
                                                background: item.is_following ? 'var(--bg-tertiary)' : '#ff3d00',
                                                color: item.is_following ? 'var(--text-primary)' : '#fff'
                                            }}
                                        >
                                            {item.is_following ? 'Following' : 'Follow'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 🎯 Editor's Picks */}
                        <div className="section-wrapper" style={{ marginTop: '4rem' }} onMouseEnter={() => setIsPicksHovered(true)} onMouseLeave={() => setIsPicksHovered(false)}>
                            <div className="video-row-header">
                                <h2 className="section-title">🎯 Editor's Picks</h2>
                                <div className="row-nav">
                                    <button className="row-arrow" onClick={() => picksRef.current?.scrollBy({ left: -280, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                                    <button className="row-arrow" onClick={() => picksRef.current?.scrollBy({ left: 280, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                                </div>
                            </div>
                            <div className="poster-grid" ref={picksRef} style={{ gap: '2rem' }}>
                                {filteredEditorsPicks.map(item => (
                                    <div key={item.id} className="nh-video-card" style={{ flex: '0 0 280px', cursor: 'pointer' }} onClick={() => openVideoModal(item)}>
                                        <div className="nh-thumb-wrapper">
                                            <img src={item.img_url} alt={item.title} />
                                            <div className="nh-badge" style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#000' }}>⭐ Pick</div>

                                            <div
                                                className={`card-save-btn-v2 ${item.is_saved ? 'active' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    saveVideo(item.id, item.is_saved ? 'unsave' : 'save');
                                                    item.is_saved = !item.is_saved;
                                                    e.currentTarget.classList.toggle('active');
                                                }}
                                                style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, width: '30px', height: '30px' }}
                                            >
                                                <svg fill={item.is_saved ? "white" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="nh-card-content">
                                            <div className="nh-title" style={{ fontSize: '1.1rem' }}>{item.title}</div>
                                            <div className="nh-creator-row">
                                                <div className="nh-avatar">{(item.creator_name || 'U')[0]}</div>
                                                <span className="nh-creator-name">{item.creator_name}</span>
                                                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#444' }}></div>
                                                <span style={{ color: '#ff9100', fontSize: '0.8rem', fontWeight: 'bold' }}>Editor's Choice</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selectedTag && filteredRisingVideos.length === 0 && filteredLatestUploads.length === 0 && filteredEditorsPicks.length === 0 && (
                            <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: '600' }}>
                                No videos found for <span style={{ color: '#ff6b00' }}>{selectedTag}</span>. Try another hashtag.
                            </div>
                        )}

                        <div style={{ marginTop: showHashtags ? '2rem' : '3rem' }}>
                            <div
                                ref={tagsRef}
                                className="trending-tags-scroller newhot-tags-wrap"
                                style={{ marginBottom: '1.25rem', display: showHashtags ? 'block' : 'none' }}
                            >
                                <div className="newhot-tags-row" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
                                    {tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="newhot-tag-chip"
                                            onClick={() => setSelectedTag(prev => prev === tag ? '' : tag)}
                                            style={{
                                                padding: '10px 20px',
                                                borderRadius: '50px',
                                                background: selectedTag === tag ? 'rgba(255,61,0,0.18)' : 'var(--bg-tertiary)',
                                                color: selectedTag === tag ? '#ff6b00' : 'var(--text-primary)',
                                                fontSize: '0.9rem',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                border: selectedTag === tag ? '1px solid #ff6b00' : '1px solid var(--border)',
                                                whiteSpace: 'nowrap',
                                                transition: 'all 0.3s'
                                            }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Bottom Load More */}
                            {!showHashtags && (
                                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                                    <button
                                        onClick={handleLoadMore}
                                        className="load-more-global"
                                    >
                                        {loading ? "Loading..." : "Load More Videos"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                <style>{`
        .nh-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--border);
            border-top: 4px solid var(--accent);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
                {selectedVideo && <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} startWithComments={modalConfig.startWithComments} />}
            </div>
        </div>
    );
};

export default NewHot;
