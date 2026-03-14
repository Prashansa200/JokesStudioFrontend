import React, { useRef, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import VideoModal from '../components/VideoModal';
import ShareModal from '../components/ShareModal';
import LikeButton from '../components/LikeButton';
import { getPopularData, toggleFollow } from '../api';

const isDirectVideo = (url) => {
    if (!url) return false;
    return String(url).toLowerCase().match(/\.(mp4|webm|ogg|mov)$|^https:\/\/assets\.mixkit\.co/i);
};

const Popular = () => {
    const trendingRef = useRef(null);
    const standupRef = useRef(null);
    const memesRef = useRef(null);
    const skitsRef = useRef(null);
    const comediansRef = useRef(null);

    // Section refs for vertical scrolling
    const trendingSectionRef = useRef(null);
    const standupSectionRef = useRef(null);
    const memesSectionRef = useRef(null);
    const skitsSectionRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');
    const [showPopularComedians, setShowPopularComedians] = useState(false);

    const scrollToSection = (ref) => {
        if (ref && ref.current) {
            const container = document.querySelector('.main-container');
            if (!container) return;

            const headerHeight = 80; // Account for sticky header
            const elementPosition = ref.current.getBoundingClientRect().top;

            // On a custom scroll container, we add the current scrollTop of that container
            const offsetPosition = elementPosition + container.scrollTop - headerHeight;

            container.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [modalConfig, setModalConfig] = useState({ startWithComments: false });
    const [shareVideo, setShareVideo] = useState(null);

    const [trendingComedy, setTrendingComedy] = useState([]);
    const [standupComedy, setStandupComedy] = useState([]);
    const [viralMemes, setViralMemes] = useState([]);
    const [funnySkits, setFunnySkits] = useState([]);
    const [comediansData, setComediansData] = useState([]);

    useEffect(() => {
        getPopularData()
            .then(data => {
                setTrendingComedy(Array.isArray(data.trending) ? data.trending : []);
                setStandupComedy(Array.isArray(data.standup) ? data.standup : []);
                setViralMemes(Array.isArray(data.memes) ? data.memes : []);
                setFunnySkits(Array.isArray(data.skits) ? data.skits : []);
                if (data.popular_creators && data.popular_creators.length > 0) {
                    setComediansData(data.popular_creators);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch popular data", err);
                setLoading(false);
            });
    }, []);

    const openVideoModal = (video, options = {}) => {
        setSelectedVideo(video);
        setModalConfig({ startWithComments: !!options.startWithComments });
    };

    // Hover states for auto-scroll
    const [hovers, setHovers] = useState({
        trending: false,
        standup: false,
        memes: false,
        skits: false,
        comedians: false
    });

    const filters = ['All', 'Standup', 'Memes', 'Skits'];



    const location = useLocation();

    // Handle hash-based scrolling from top nav
    useEffect(() => {
        const hash = location.hash;
        if (hash) {
            // Give a tiny delay to ensure content is ready
            const timer = setTimeout(() => {
                const target = hash.replace('#', '').toLowerCase();
                if (target === 'all' || target === 'popular') {
                    setActiveFilter('All');
                    scrollToSection(trendingSectionRef);
                } else if (target === 'standup') {
                    setActiveFilter('Standup');
                    scrollToSection(standupSectionRef);
                } else if (target === 'memes') {
                    setActiveFilter('Memes');
                    scrollToSection(memesSectionRef);
                } else if (target === 'skits') {
                    setActiveFilter('Skits');
                    scrollToSection(skitsSectionRef);
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [location.hash]);

    // Helper for auto-scroll
    useEffect(() => {
        const setupScroll = (ref, isHovered, amount = 300) => {
            if (!ref.current || isHovered) return null;
            const interval = setInterval(() => {
                const container = ref.current;
                const max = container.scrollWidth - container.clientWidth;
                if (container.scrollLeft >= max - 10) {
                    container.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    container.scrollBy({ left: amount, behavior: 'smooth' });
                }
            }, 2000);
            return () => clearInterval(interval);
        };

        const cl1 = setupScroll(trendingRef, hovers.trending);
        const cl2 = setupScroll(standupRef, hovers.standup);
        const cl3 = setupScroll(memesRef, hovers.memes);
        const cl4 = setupScroll(skitsRef, hovers.skits);
        const cl5 = setupScroll(comediansRef, hovers.comedians, 200);

        return () => {
            if (cl1) cl1();
            if (cl2) cl2();
            if (cl3) cl3();
            if (cl4) cl4();
            if (cl5) cl5();
        };
    }, [hovers]);

    const handleLoadMore = () => {
        if (!showPopularComedians) {
            setLoading(true);
            setTimeout(() => {
                setLoading(false);
                setShowPopularComedians(true);
                setTimeout(() => {
                    comediansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
            }, 450);
            return;
        }
        setLoading(true);
        setTimeout(() => setLoading(false), 1500);
    };

    const handleCreatorFollow = async (creatorId, userId) => {
        console.log("Follow clicked for creator:", creatorId, "User ID:", userId);
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Please login to follow creators");
            return;
        }

        if (!userId) {
            alert("This creator is not currently linkable (no backend user)");
            return;
        }

        // Optimistic UI update
        const prevData = [...comediansData];
        setComediansData(prev => prev.map(c => {
            if (c.id === creatorId) {
                return { ...c, is_following: !c.is_following };
            }
            return c;
        }));

        try {
            const res = await toggleFollow(token, userId);
            if (res.error) {
                setComediansData(prevData);
                alert(res.error);
            } else if (res.status) {
                // Update with real count from backend
                setComediansData(prev => prev.map(c => {
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
            setComediansData(prevData);
            console.error("Follow failed", err);
        }
    };

    const renderVideoCard = (item, type = '') => (
        <div key={item.id} className="premium-card-v2" onClick={() => openVideoModal(item)}>
            <div className="card-media-wrap">
                {isDirectVideo(item.video_url || item.video) ? (
                    <video
                        src={item.video_url || item.video}
                        className="card-img"
                        muted playsInline loop
                        onMouseEnter={e => e.currentTarget.play()}
                        onMouseLeave={e => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                        }}
                        poster={item.img_url || item.img}
                    />
                ) : (
                    <img src={item.img_url || item.img} alt={item.title} className="card-img" />
                )}
                <div className="card-play-overlay">
                    <div className="play-icon-circle">
                        <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                </div>

                <div
                    className={`card-save-btn-v2 ${item.is_saved ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        // Call saveVideo API here
                        import('../api').then(m => m.saveVideo(item.id, item.is_saved ? 'unsave' : 'save'));
                        item.is_saved = !item.is_saved; // Optimistic update
                        e.currentTarget.classList.toggle('active');
                    }}
                    style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}
                >
                    <svg fill={item.is_saved ? "white" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                </div>
            </div>
            <div className="card-content-v2">
                <h3 className="card-title-v2">{item.title}</h3>
                <div className="card-footer-v2">
                    <div className="card-meta-row-v2">
                        {(item.creator_name || item.creator) && (
                            <div className="card-creator-v2">
                                <div className="creator-avatar-sm">{(item.creator_name || item.creator || 'U')[0]}</div>
                                <span>{item.creator_name || item.creator}</span>
                            </div>
                        )}
                        {item.trend_score !== undefined && (
                            <div className="card-trend-badge-v2">
                                <span>🔥</span>
                                <span>{item.trend_score}</span>
                            </div>
                        )}
                    </div>

                    <div className="card-divider-v2"></div>

                    <div className="card-actions-v2">
                        <LikeButton initialLikes={item.likes} itemId={item.id} />
                        <button
                            className="card-action-btn comment"
                            onClick={(e) => { e.stopPropagation(); openVideoModal(item, { startWithComments: true }); }}
                            title="Comments"
                        >
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            <span>{item.comment_count || 0}</span>
                        </button>
                        <button
                            className="card-action-btn share"
                            onClick={(e) => { e.stopPropagation(); setShareVideo(item); }}
                            title="Share"
                        >
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                <polyline points="16 6 12 2 8 6" />
                                <line x1="12" y1="2" x2="12" y2="15" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="main-content">
            <div className="popular-page-view" style={{ animation: 'fadeIn 0.5s ease' }}>
                <section className="row-section popular-page-section" style={{ marginTop: '2rem' }}>
                    <div className="page-header popular-page-header" style={{ marginBottom: '2rem' }}>
                        <h1 className="section-title popular-page-title" style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>🔥 Popular Comedy</h1>
                        <p className="popular-page-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Most watched comedy videos today</p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="popular-filters" style={{ display: 'flex', gap: '10px', marginBottom: '3.5rem', overflowX: 'auto', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                        {filters.map(filter => (
                            <button
                                key={filter}
                                className={`popular-filter-btn ${activeFilter === filter ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveFilter(filter);
                                    if (filter === 'All') scrollToSection(trendingSectionRef);
                                    if (filter === 'Standup') scrollToSection(standupSectionRef);
                                    if (filter === 'Memes') scrollToSection(memesSectionRef);
                                    if (filter === 'Skits') scrollToSection(skitsSectionRef);
                                }}
                                style={{
                                    padding: '12px 25px',
                                    background: activeFilter === filter ? '#ff3d00' : 'var(--bg-tertiary)',
                                    color: activeFilter === filter ? '#fff' : 'var(--text-primary)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.3s'
                                }}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    {/* 🔥 Trending Comedy Videos */}
                    <div
                        className="section-wrapper popular-section-wrapper"
                        id="trending"
                        ref={trendingSectionRef}
                        onMouseEnter={() => setHovers({ ...hovers, trending: true })}
                        onMouseLeave={() => setHovers({ ...hovers, trending: false })}
                    >
                        <div className="video-row-header">
                            <h2 className="section-title">🔥 Trending Now</h2>
                            <div className="row-nav">
                                <button className="row-arrow" onClick={() => trendingRef.current?.scrollBy({ left: -260, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                                <button className="row-arrow" onClick={() => trendingRef.current?.scrollBy({ left: 260, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                            </div>
                        </div>
                        <div className="poster-grid" ref={trendingRef} style={{ gap: '2rem' }}>
                            {trendingComedy.map(item => renderVideoCard(item))}
                        </div>
                    </div>

                    {/* 🎤 Popular Standup Comedy */}
                    <div
                        className="section-wrapper popular-section-wrapper" style={{ marginTop: '4rem' }}
                        id="standup"
                        ref={standupSectionRef}
                        onMouseEnter={() => setHovers({ ...hovers, standup: true })}
                        onMouseLeave={() => setHovers({ ...hovers, standup: false })}
                    >
                        <div className="video-row-header">
                            <h2 className="section-title">🎤 Standup Comedy</h2>
                            <div className="row-nav">
                                <button className="row-arrow" onClick={() => standupRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                                <button className="row-arrow" onClick={() => standupRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                            </div>
                        </div>
                        <div className="poster-grid" ref={standupRef} style={{ gap: '2rem' }}>
                            {standupComedy.map(item => renderVideoCard(item, 'standup'))}
                        </div>
                    </div>

                    {/* 😂 Viral Meme Videos */}
                    <div
                        className="section-wrapper popular-section-wrapper" style={{ marginTop: '4rem' }}
                        id="memes"
                        ref={memesSectionRef}
                        onMouseEnter={() => setHovers({ ...hovers, memes: true })}
                        onMouseLeave={() => setHovers({ ...hovers, memes: false })}
                    >
                        <div className="video-row-header">
                            <h2 className="section-title">😂 Viral Memes</h2>
                            <div className="row-nav">
                                <button className="row-arrow" onClick={() => memesRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                                <button className="row-arrow" onClick={() => memesRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                            </div>
                        </div>
                        <div className="poster-grid" ref={memesRef} style={{ gap: '2rem' }}>
                            {viralMemes.map(item => renderVideoCard(item))}
                        </div>
                    </div>

                    {/* 🎭 Comedy Skits */}
                    <div
                        className="section-wrapper popular-section-wrapper" style={{ marginTop: '4rem' }}
                        id="skits"
                        ref={skitsSectionRef}
                        onMouseEnter={() => setHovers({ ...hovers, skits: true })}
                        onMouseLeave={() => setHovers({ ...hovers, skits: false })}
                    >
                        <div className="video-row-header">
                            <h2 className="section-title">🎭 Funny Skits</h2>
                            <div className="row-nav">
                                <button className="row-arrow" onClick={() => skitsRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                                <button className="row-arrow" onClick={() => skitsRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                            </div>
                        </div>
                        <div className="poster-grid" ref={skitsRef} style={{ gap: '2rem' }}>
                            {funnySkits.map(item => renderVideoCard(item))}
                        </div>
                    </div>

                    {/* ⭐ Popular Creators */}
                    {showPopularComedians && (
                        <div
                            className="section-wrapper popular-section-wrapper" style={{ marginTop: '4rem' }}
                            onMouseEnter={() => setHovers({ ...hovers, comedians: true })}
                            onMouseLeave={() => setHovers({ ...hovers, comedians: false })}
                        >
                        <div className="video-row-header">
                            <h2 className="section-title">⭐ Popular Comedians</h2>
                            <div className="row-nav">
                                <button className="row-arrow" onClick={() => comediansRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                                <button className="row-arrow" onClick={() => comediansRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                            </div>
                        </div>
                        <div className="poster-grid popular-comedians-grid" ref={comediansRef} style={{ gap: '2rem', paddingBottom: '1rem' }}>
                            {comediansData.map(item => (
                                <div key={item.id} className="creator-card popular-creator-card" style={{ flex: '0 0 160px', textAlign: 'center', background: 'var(--bg-secondary)', padding: '15px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                                    <img className="popular-creator-avatar" src={item.img_url || item.img} alt={item.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ff3d00', marginBottom: '10px' }} />
                                    <div className="popular-creator-name" style={{ fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px', fontSize: '0.95rem' }}>{item.name}</div>
                                    <div className="popular-creator-meta" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>{item.followers || item.real_followers_count} Followers</div>
                                    <button
                                        className="popular-follow-btn"
                                        onClick={() => handleCreatorFollow(item.id, item.user)}
                                        style={{
                                            background: item.is_following ? 'var(--bg-tertiary)' : '#ff3d00',
                                            color: item.is_following ? 'var(--text-primary)' : '#fff',
                                            border: 'none',
                                            padding: '8px 25px',
                                            borderRadius: '20px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            width: '100%'
                                        }}
                                    >
                                        {item.is_following ? 'Following' : 'Follow'}
                                    </button>
                                </div>
                            ))}
                        </div>
                        </div>
                    )}

                    {/* Load More */}
                    {!showPopularComedians && (
                        <div style={{ marginTop: '2rem', marginBottom: '1rem', textAlign: 'center' }}>
                            <button onClick={handleLoadMore} className="load-more-global">
                                {loading ? "Loading Content..." : "Load More Videos"}
                            </button>
                        </div>
                    )}
                </section>

                {selectedVideo && <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} startWithComments={modalConfig.startWithComments} />}
                {shareVideo && <ShareModal video={shareVideo} onClose={() => setShareVideo(null)} />}
            </div>
        </div>
    );
};

export default Popular;

