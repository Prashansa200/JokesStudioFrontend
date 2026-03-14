import React, { useRef, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import VideoModal from '../components/VideoModal';
import LikeButton from '../components/LikeButton';
import ShareModal from '../components/ShareModal';
import { getMemesData, saveVideo, toggleFollow } from '../api';

const isDirectVideo = (url) => {
    if (!url) return false;
    return String(url).toLowerCase().match(/\.(mp4|webm|ogg|mov)$|^https:\/\/assets\.mixkit\.co/i);
};

const Meme = ({ onShare }) => {
    const trendingRef = useRef(null);
    const viralRef = useRef(null);
    const reactionRef = useRef(null);
    const animalRef = useRef(null);
    const creatorsRef = useRef(null);
    const categoriesRef = useRef(null);

    const [activeTimeFilter, setActiveTimeFilter] = useState('All Time');
    const [loading, setLoading] = useState(false);
    const [showCategories, setShowCategories] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [modalConfig, setModalConfig] = useState({ startWithComments: false });
    const [shareVideo, setShareVideo] = useState(null);

    // States for dynamic data
    const [trendingMemes, setTrendingMemes] = useState([]);
    const [viralMemes, setViralMemes] = useState([]);
    const [reactionMemes, setReactionMemes] = useState([]);
    const [animalMemes, setAnimalMemes] = useState([]);
    const [creators, setCreators] = useState([]);

    const openVideoModal = (video, options = {}) => {
        setSelectedVideo(video);
        setModalConfig({ startWithComments: !!options.startWithComments });
    };

    // Hover states for auto-scroll
    const [hovers, setHovers] = useState({
        trending: false,
        viral: false,
        reaction: false,
        animal: false,
        creators: false,
        categories: false
    });

    const timeFilters = ['Today', 'This Week', 'This Month', 'All Time'];

    // Fetch dynamic data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsInitialLoading(true);
                const data = await getMemesData();
                setTrendingMemes(Array.isArray(data.trending) ? data.trending : []);
                setViralMemes(Array.isArray(data.viral) ? data.viral : []);
                setReactionMemes(Array.isArray(data.reaction) ? data.reaction : []);
                setAnimalMemes(Array.isArray(data.animal) ? data.animal : []);
                if (data.creators && data.creators.length > 0) setCreators(data.creators);
            } catch (error) {
                console.error("Error fetching memes:", error);
            } finally {
                setIsInitialLoading(false);
            }
        };
        fetchData();
    }, []);

    const categories = [
        { id: 1, name: 'Office Memes', img: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=400&auto=format&fit=crop' },
        { id: 2, name: 'Student Memes', img: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=400&auto=format&fit=crop' },
        { id: 3, name: 'Relationship Memes', img: 'https://images.unsplash.com/photo-1511733351957-2309f4d715a2?q=80&w=400&auto=format&fit=crop' },
        { id: 4, name: 'Tech Memes', img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=400&auto=format&fit=crop' },
        { id: 5, name: 'Family Memes', img: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=400&auto=format&fit=crop' },
        { id: 6, name: 'Animal Memes', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=400&auto=format&fit=crop' },
    ];

    // Auto-scroll logic
    useEffect(() => {
        const setupScroll = (ref, active, amount = 300) => {
            if (!ref.current || active) return null;
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
        const cl2 = setupScroll(viralRef, hovers.viral);
        const cl3 = setupScroll(reactionRef, hovers.reaction, 250);
        const cl4 = setupScroll(animalRef, hovers.animal);
        const cl5 = setupScroll(creatorsRef, hovers.creators, 200);
        const cl6 = setupScroll(categoriesRef, hovers.categories, 240);

        return () => {
            [cl1, cl2, cl3, cl4, cl5, cl6].forEach(c => c && c());
        };
    }, [hovers, trendingMemes, viralMemes, reactionMemes, animalMemes, creators]);

    const handleLoadMore = () => {
        if (showCategories) return;
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setShowCategories(true);
            setTimeout(() => {
                categoriesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
        }, 450);
    };

    const handleRandomMeme = () => {
        const allMemes = [...trendingMemes, ...viralMemes, ...reactionMemes, ...animalMemes];
        const random = allMemes[Math.floor(Math.random() * allMemes.length)];
        openVideoModal(random);
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

        const prevData = [...creators];
        setCreators(prev => prev.map(c => {
            if (c.id === creatorId) {
                return { ...c, is_following: !c.is_following };
            }
            return c;
        }));

        try {
            const res = await toggleFollow(token, userId);
            if (res.error) {
                setCreators(prevData);
                alert(res.error);
            } else if (res.status) {
                setCreators(prev => prev.map(c => {
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
            setCreators(prevData);
            console.error("Follow failed", err);
        }
    };

    const location = useLocation();

    // Fix scrolling for hashes if reached directly
    useEffect(() => {
        const hash = location.hash;
        if (hash) {
            const container = document.querySelector('.main-container');
            const target = document.getElementById(hash.replace('#', ''));
            if (container && target) {
                const headerHeight = 80;
                const offsetPosition = target.getBoundingClientRect().top + container.scrollTop - headerHeight;
                container.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        }
    }, [location.hash]);

    const renderVideoCard = (item, type = '') => (
        <div key={item.id} className={`premium-card-v2 meme-video-card ${type ? `meme-video-${type}` : ''}`} onClick={() => openVideoModal(item)}>
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
                        poster={item.img_url}
                    />
                ) : (
                    <img src={item.img_url} alt={item.title} className="card-img" />
                )}

                {type === 'reaction' && (
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', display: 'flex', alignItems: 'flex-end', padding: '15px', pointerEvents: 'none' }}>
                        <span style={{ color: '#fff', fontWeight: '800', fontSize: '0.9rem' }}>{item.title}</span>
                    </div>
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
                        saveVideo(item.id, item.is_saved ? 'unsave' : 'save');
                        item.is_saved = !item.is_saved;
                        e.currentTarget.classList.toggle('active');
                    }}
                    style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}
                >
                    <svg fill={item.is_saved ? "white" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                </div>

                {type === 'trending' && <div className="card-badge-v2">TOP MEME</div>}
            </div>

            {type !== 'reaction' && (
                <div className="card-content-v2">
                    <h3 className="card-title-v2">{type === 'trending' ? `😂 ${item.title}` : item.title}</h3>
                    <div className="card-footer-v2">
                        <div className="card-meta-row-v2">
                            {item.creator_name && (
                                <div className="card-creator-v2">
                                    <div className="creator-avatar-sm">{(item.creator_name || 'U')[0]}</div>
                                    <span>{item.creator_name}</span>
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
            )}
        </div>
    );

    return (
        <div className="main-content">
            <div className="popular-page-view meme-page-view" style={{ animation: 'fadeIn 0.5s ease' }}>
                {isInitialLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                        <div className="nh-spinner"></div>
                        <span style={{ marginTop: '15px', color: 'var(--text-secondary)', fontWeight: '600' }}>Loading memes...</span>
                    </div>
                ) : (
                    <section className="row-section meme-page-section" style={{ marginTop: '2rem' }}>
                        {/* 1️⃣ Page Title Section */}
                        <div className="page-header meme-page-header" style={{ marginBottom: '2rem', position: 'relative' }}>
                            <h1 className="section-title" style={{ fontSize: '1.8rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>😂 Meme Hub</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.5rem' }}>The funniest meme videos on the internet</p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
                                    {timeFilters.map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => setActiveTimeFilter(filter)}
                                            style={{
                                                padding: '10px 24px',
                                                borderRadius: '30px',
                                                background: activeTimeFilter === filter ? '#ff3d00' : 'var(--bg-tertiary)',
                                                color: activeTimeFilter === filter ? '#fff' : 'var(--text-secondary)',
                                                border: 'none',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s'
                                            }}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={handleRandomMeme}
                                    style={{
                                        background: 'linear-gradient(45deg, #ff3d00, #ff9100)',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '12px 25px',
                                        borderRadius: '12px',
                                        fontWeight: '900',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        boxShadow: '0 4px 15px rgba(255, 61, 0, 0.3)'
                                    }}
                                >
                                    <span>🎲</span> Random Meme
                                </button>
                            </div>
                        </div>

                        {/* 🔥 Trending Memes Section */}
                        <div
                            className="section-wrapper meme-section-wrapper"
                            onMouseEnter={() => setHovers({ ...hovers, trending: true })}
                            onMouseLeave={() => setHovers({ ...hovers, trending: false })}
                        >
                            <div className="video-row-header">
                                <h2 className="section-title">🔥 Trending Memes</h2>
                                <div className="row-nav">
                                    <button className="row-arrow" onClick={() => trendingRef.current?.scrollBy({ left: -260, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                                    <button className="row-arrow" onClick={() => trendingRef.current?.scrollBy({ left: 260, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                                </div>
                            </div>
                            <div className="poster-grid meme-video-grid" ref={trendingRef} style={{ gap: '2rem' }}>
                                {trendingMemes.map(item => renderVideoCard(item, 'trending'))}
                            </div>
                        </div>

                        {/* 📈 Viral Meme Videos */}
                        <div
                            className="section-wrapper meme-section-wrapper" style={{ marginTop: '4rem' }}
                            onMouseEnter={() => setHovers({ ...hovers, viral: true })}
                            onMouseLeave={() => setHovers({ ...hovers, viral: false })}
                        >
                            <div className="video-row-header">
                                <h2 className="section-title">📈 Viral Meme Videos</h2>
                                <div className="row-nav">
                                    <button className="row-arrow" onClick={() => viralRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                                    <button className="row-arrow" onClick={() => viralRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                                </div>
                            </div>
                            <div className="poster-grid meme-video-grid" ref={viralRef} style={{ gap: '2rem' }}>
                                {viralMemes.map(item => renderVideoCard(item, 'viral'))}
                            </div>
                        </div>

                        {/* 🎭 Reaction Memes */}
                        <div
                            className="section-wrapper meme-section-wrapper" style={{ marginTop: '4rem' }}
                            onMouseEnter={() => setHovers({ ...hovers, reaction: true })}
                            onMouseLeave={() => setHovers({ ...hovers, reaction: false })}
                        >
                            <div className="video-row-header">
                                <h2 className="section-title">🎭 Reaction Memes</h2>
                                <div className="row-nav">
                                    <button className="row-arrow" onClick={() => reactionRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                                    <button className="row-arrow" onClick={() => reactionRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                                </div>
                            </div>
                            <div className="poster-grid meme-video-grid meme-reaction-grid" ref={reactionRef} style={{ gap: '1.5rem' }}>
                                {reactionMemes.map(item => renderVideoCard(item, 'reaction'))}
                            </div>
                        </div>

                        {/* 🐶 Funny Animal Memes */}
                        <div
                            className="section-wrapper meme-section-wrapper" style={{ marginTop: '4rem' }}
                            onMouseEnter={() => setHovers({ ...hovers, animal: true })}
                            onMouseLeave={() => setHovers({ ...hovers, animal: false })}
                        >
                            <div className="video-row-header">
                                <h2 className="section-title">🐶 Funny Animal Memes</h2>
                                <div className="row-nav">
                                    <button className="row-arrow" onClick={() => animalRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                                    <button className="row-arrow" onClick={() => animalRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                                </div>
                            </div>
                            <div className="poster-grid meme-video-grid" ref={animalRef} style={{ gap: '2rem' }}>
                                {animalMemes.map(item => renderVideoCard(item))}
                            </div>
                        </div>

                        {/* ⭐ Popular Meme Creators */}
                        <div
                            className="section-wrapper meme-section-wrapper" style={{ marginTop: '4rem' }}
                            onMouseEnter={() => setHovers({ ...hovers, creators: true })}
                            onMouseLeave={() => setHovers({ ...hovers, creators: false })}
                        >
                            <div className="video-row-header">
                                <h2 className="section-title">⭐ Popular Meme Creators</h2>
                                <div className="row-nav">
                                    <button className="row-arrow" onClick={() => creatorsRef.current?.scrollBy({ left: -180, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                                    <button className="row-arrow" onClick={() => creatorsRef.current?.scrollBy({ left: 180, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                                </div>
                            </div>
                            <div className="poster-grid meme-creators-grid" ref={creatorsRef} style={{ gap: '2rem', paddingBottom: '1rem' }}>
                                {creators.map(item => (
                                    <div key={item.id} className="creator-card meme-creator-card" style={{ flex: '0 0 180px', textAlign: 'center', background: 'var(--bg-secondary)', padding: '15px', borderRadius: '25px', border: '1px solid var(--border)' }}>
                                        <img className="meme-creator-avatar" src={item.img_url} alt={item.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ff3d00', marginBottom: '12px' }} />
                                        <div className="meme-creator-name" style={{ fontWeight: '900', color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '4px' }}>{item.name}</div>
                                        <div className="meme-creator-meta" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>{item.real_followers_count ?? item.followers} Followers</div>
                                        <button
                                            className="meme-follow-btn"
                                            onClick={() => handleCreatorFollow(item.id, item.user)}
                                            style={{
                                                background: item.is_following ? 'var(--bg-tertiary)' : '#ff3d00',
                                                color: item.is_following ? 'var(--text-primary)' : '#fff',
                                                border: 'none',
                                                padding: '10px 0',
                                                width: '100%',
                                                borderRadius: '30px',
                                                fontWeight: '900',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            {item.is_following ? 'Following' : 'Follow'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 🎭 Meme Categories */}
                        <div
                            className="section-wrapper meme-section-wrapper" style={{ marginTop: '4rem', display: showCategories ? 'block' : 'none' }}
                            onMouseEnter={() => setHovers({ ...hovers, categories: true })}
                            onMouseLeave={() => setHovers({ ...hovers, categories: false })}
                        >
                            <div className="video-row-header">
                                <h2 className="section-title">🎭 Meme Categories</h2>
                                <div className="row-nav">
                                    <button className="row-arrow" onClick={() => categoriesRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                                    <button className="row-arrow" onClick={() => categoriesRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                                </div>
                            </div>
                            <div className="poster-grid meme-categories-grid" ref={categoriesRef} style={{ gap: '1.5rem' }}>
                                {categories.map(cat => (
                                    <div
                                        key={cat.id}
                                        className="poster-card meme-category-card"
                                        style={{ position: 'relative', flex: '0 0 220px', height: '120px', borderRadius: '24px', cursor: 'pointer', overflow: 'hidden', border: '1px solid #333' }}
                                        onClick={() => document.querySelector('.main-container')?.scrollTo({ top: 0, behavior: 'smooth' })}
                                    >
                                        <img src={cat.img} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} alt={cat.name} />
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '10px' }}>
                                            <span style={{ fontWeight: '900', fontSize: '0.95rem', color: '#fff', textTransform: 'uppercase' }}>{cat.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 9️⃣ Load More Section */}
                        {!showCategories && (
                            <div style={{ marginTop: '4rem', textAlign: 'center' }}>
                                <button
                                    onClick={handleLoadMore}
                                    className="load-more-global"
                                >
                                    {loading ? "Refreshing Hub..." : "Load More Memes"}
                                </button>
                            </div>
                        )}
                    </section>
                )}

                {selectedVideo && <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} startWithComments={modalConfig.startWithComments} />}
                {shareVideo && <ShareModal video={shareVideo} onClose={() => setShareVideo(null)} />}
            </div>
        </div>
    );
};

export default Meme;

