import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import VideoModal from '../components/VideoModal';
import ShareModal from '../components/ShareModal';
import LikeButton from '../components/LikeButton';
import { getStandupData, saveVideo, toggleFollow } from '../api';

const Standup = () => {
    const trendingRef = useRef(null);
    const comediansRef = useRef(null);
    const latestRef = useRef(null);
    const categoriesRef = useRef(null);

    const [activeTimeFilter, setActiveTimeFilter] = useState('All Time');
    const [activeTab, setActiveTab] = useState('All');
    const [loading, setLoading] = useState(false);
    const [showCategories, setShowCategories] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [shareVideo, setShareVideo] = useState(null);

    // Hover states for auto-scroll
    const [hovers, setHovers] = useState({
        trending: false,
        comedians: false,
        latest: false,
        categories: false
    });

    const timeFilters = ['Today', 'This Week', 'This Month', 'All Time'];
    const tabs = ['All', 'Trending', 'New', 'Short Clips', 'Full Shows'];

    const [featured, setFeatured] = useState(null);
    const [trendingStandup, setTrendingStandup] = useState([]);
    const [comedians, setComedians] = useState([]);
    const [latestClips, setLatestClips] = useState([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const categories = [
        { id: 1, name: 'Work & Office Comedy', img: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=400&h=400&auto=format&fit=crop' },
        { id: 2, name: 'Relationships Comedy', img: 'https://images.unsplash.com/photo-1511733351957-2309f4d715a2?q=80&w=400&h=400&auto=format&fit=crop' },
        { id: 3, name: 'College Life Comedy', img: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=400&h=400&auto=format&fit=crop' },
        { id: 4, name: 'Family Comedy', img: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=400&auto=format&fit=crop' },
        { id: 5, name: 'Travel Stories', img: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=400&auto=format&fit=crop' },
        { id: 6, name: 'Tech / Engineer Jokes', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400&auto=format&fit=crop' },
    ];

    const normalizeText = (value) => (typeof value === 'string' ? value.toLowerCase() : '');

    const parseDurationSeconds = (video) => {
        const direct = Number(video?.duration_seconds || video?.durationSeconds || video?.duration_sec);
        if (Number.isFinite(direct) && direct > 0) return direct;

        const durationText = normalizeText(video?.duration || video?.stats || '');
        const matchMin = durationText.match(/(\d+)\s*min/);
        if (matchMin) return Number(matchMin[1]) * 60;
        const matchSec = durationText.match(/(\d+)\s*sec/);
        if (matchSec) return Number(matchSec[1]);
        return null;
    };

    const getVideoDate = (video) => {
        const raw = video?.created_at || video?.createdAt || video?.uploaded_at || video?.published_at || video?.date;
        if (!raw) return null;
        const parsed = new Date(raw);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const matchesTimeFilter = (video) => {
        if (activeTimeFilter === 'All Time') return true;
        const date = getVideoDate(video);
        if (!date) return true;

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const dayMs = 24 * 60 * 60 * 1000;

        if (activeTimeFilter === 'Today') return diffMs <= dayMs;
        if (activeTimeFilter === 'This Week') return diffMs <= 7 * dayMs;
        if (activeTimeFilter === 'This Month') return diffMs <= 31 * dayMs;
        return true;
    };

    const matchesTabFilter = (video, sourceSection = '') => {
        if (activeTab === 'All') return true;

        const title = normalizeText(video?.title || '');
        const section = normalizeText(video?.section || sourceSection);
        const badge = normalizeText(video?.badge || '');
        const type = normalizeText(video?.type || video?.format || '');
        const durationSec = parseDurationSeconds(video);

        if (activeTab === 'Trending') {
            return (
                sourceSection === 'trending' ||
                section === 'trending' ||
                !!video?.is_trending ||
                title.includes('trending') ||
                badge.includes('trending')
            );
        }

        if (activeTab === 'New') {
            return (
                sourceSection === 'latest' ||
                section === 'latest' ||
                !!video?.is_new ||
                badge.includes('new') ||
                matchesTimeFilter(video)
            );
        }

        if (activeTab === 'Short Clips') {
            return (
                !!video?.is_short ||
                type.includes('short') ||
                type.includes('clip') ||
                title.includes('short') ||
                title.includes('clip') ||
                (Number.isFinite(durationSec) && durationSec <= 60)
            );
        }

        if (activeTab === 'Full Shows') {
            return (
                !!video?.is_full_show ||
                type.includes('full') ||
                type.includes('show') ||
                title.includes('full show') ||
                title.includes('special') ||
                (Number.isFinite(durationSec) && durationSec > 60)
            );
        }

        return true;
    };

    const filteredFeatured = useMemo(() => {
        if (!featured) return null;
        return matchesTimeFilter(featured) && matchesTabFilter(featured, 'featured') ? featured : null;
    }, [featured, activeTimeFilter, activeTab]);

    const filteredTrendingStandup = useMemo(() => {
        return trendingStandup.filter((item) => matchesTimeFilter(item) && matchesTabFilter(item, 'trending'));
    }, [trendingStandup, activeTimeFilter, activeTab]);

    const filteredLatestClips = useMemo(() => {
        return latestClips.filter((item) => matchesTimeFilter(item) && matchesTabFilter(item, 'latest'));
    }, [latestClips, activeTimeFilter, activeTab]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getStandupData();
                if (data.featured) setFeatured(data.featured);
                setTrendingStandup(Array.isArray(data.trending) ? data.trending : []);
                if (data.creators && data.creators.length > 0) setComedians(data.creators);
                setLatestClips(Array.isArray(data.latest) ? data.latest : []);

                setIsInitialLoading(false);
            } catch (err) {
                console.error("Failed to load standup data", err);
                setIsInitialLoading(false);
            }
        };
        fetchData();
    }, []);

    // Auto-scroll helper
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

        const c1 = setupScroll(trendingRef, hovers.trending);
        const c2 = setupScroll(comediansRef, hovers.comedians, 200);
        const c3 = setupScroll(latestRef, hovers.latest);
        const c4 = setupScroll(categoriesRef, hovers.categories, 240);

        return () => {
            if (c1) c1();
            if (c2) c2();
            if (c3) c3();
            if (c4) c4();
        };
    }, [hovers]);

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

        const prevData = [...comedians];
        setComedians(prev => prev.map(c => {
            if (c.id === creatorId) {
                return { ...c, is_following: !c.is_following };
            }
            return c;
        }));

        try {
            const res = await toggleFollow(token, userId);
            if (res.error) {
                setComedians(prevData);
                alert(res.error);
            } else if (res.status) {
                setComedians(prev => prev.map(c => {
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
            setComedians(prevData);
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

    return (
        <div className="main-content">
            <div className="popular-page-view standup-page-view" style={{ animation: 'fadeIn 0.5s ease' }}>
                {isInitialLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                        <div className="nh-spinner"></div>
                        <span style={{ marginLeft: '10px', color: 'var(--text-secondary)' }}>Curating standup gold...</span>
                    </div>
                ) : (
                    <section className="row-section standup-page-section" style={{ marginTop: '2rem' }}>
                        {/* 1️⃣ Page Title Section */}
                        <div className="page-header standup-page-header" style={{ marginBottom: '2rem' }}>
                            <h1 className="section-title standup-page-title" style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>🎤 Standup Comedy</h1>
                            <p className="standup-page-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Watch the best standup comedy performances</p>

                            <div className="standup-time-filters" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
                                {timeFilters.map(filter => (
                                    <button
                                        key={filter}
                                        className={`standup-time-btn ${activeTimeFilter === filter ? 'active' : ''}`}
                                        onClick={() => setActiveTimeFilter(filter)}
                                        style={{
                                            padding: '8px 20px',
                                            borderRadius: '20px',
                                            background: activeTimeFilter === filter ? 'rgba(255,61,0,0.2)' : 'var(--bg-tertiary)',
                                            color: activeTimeFilter === filter ? '#ff3d00' : 'var(--text-secondary)',
                                            border: activeTimeFilter === filter ? '1px solid #ff3d00' : '1px solid var(--border)',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Filters for Standup Page */}
                        <div className="standup-tabs" style={{ display: 'flex', gap: '15px', marginBottom: '3.5rem', overflowX: 'auto', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                            {tabs.map(tab => (
                                <button
                                    key={tab}
                                    className={`standup-tab-btn ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        padding: '12px 25px',
                                        background: activeTab === tab ? '#ff3d00' : 'transparent',
                                        color: activeTab === tab ? '#fff' : 'var(--text-primary)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Featured Standup Show */}
                        {filteredFeatured && (
                            <div className="standup-featured-wrap" style={{ marginBottom: '4rem' }}>
                                <div className="video-row-header">
                                    <h2 className="section-title">🎬 Featured Standup Show</h2>
                                </div>
                                <div
                                    className="standup-featured-card" style={{ position: 'relative', width: '100%', height: '450px', borderRadius: '24px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #333' }}
                                    onClick={() => setSelectedVideo(filteredFeatured)}
                                >
                                    <img src={filteredFeatured.img_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Featured" />
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '40px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                            <span style={{ background: '#ff3d00', color: '#fff', padding: '5px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>SPECIAL</span>
                                            <span style={{ color: '#ffb300' }}>⭐ {filteredFeatured.badge || 'New'}</span>
                                        </div>
                                        <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#fff', marginBottom: '10px' }}>{filteredFeatured.title}</h2>
                                        <div style={{ display: 'flex', gap: '20px', color: '#ccc', fontSize: '1.1rem', alignItems: 'center' }}>
                                            <span>👤 {filteredFeatured.creator_name}</span>
                                            <div style={{ width: '5px', height: '5px', background: '#555', borderRadius: '50%' }}></div>
                                            <span>⏱ {filteredFeatured.stats || '12 min'}</span>
                                            <div style={{ width: '5px', height: '5px', background: '#555', borderRadius: '50%' }}></div>
                                            <span style={{ color: '#ff3d00', fontWeight: 'bold' }}>🔥 {filteredFeatured.views} views</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Trending Standup Section */}
                        <div
                            className="section-wrapper standup-section-wrapper"
                            onMouseEnter={() => setHovers({ ...hovers, trending: true })}
                            onMouseLeave={() => setHovers({ ...hovers, trending: false })}
                        >
                            <div className="video-row-header">
                                <h2 className="section-title">🔥 Trending Standup</h2>
                                <div className="row-nav">
                                    <button className="row-arrow" onClick={() => trendingRef.current?.scrollBy({ left: -260, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                                    <button className="row-arrow" onClick={() => trendingRef.current?.scrollBy({ left: 260, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                                </div>
                            </div>
                            <div className="poster-grid standup-video-grid" ref={trendingRef} style={{ gap: '2rem' }}>
                                {filteredTrendingStandup.map(item => (
                                    <div key={item.id} className="poster-card standup-video-card" onClick={() => setSelectedVideo(item)} style={{ flex: '0 0 240px', height: 'auto', background: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden', aspectRatio: 'unset', border: '1px solid var(--border)', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                        <div style={{ position: 'relative', height: '140px', width: '100%' }}>
                                            <img src={item.img_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', color: '#fff' }}>LIVE</div>

                                            <div
                                                className={`card-save-btn-v2 ${item.is_saved ? 'active' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    saveVideo(item.id, item.is_saved ? 'unsave' : 'save');
                                                    item.is_saved = !item.is_saved;
                                                    e.currentTarget.classList.toggle('active');
                                                }}
                                                style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, width: '30px', height: '30px' }}
                                            >
                                                <svg fill={item.is_saved ? "white" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                                </svg>
                                            </div>
                                            <div className="card-play-overlay">
                                                <div className="play-icon-circle">
                                                    <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ padding: '15px' }}>
                                            <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '8px', color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.4rem' }}>{item.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>👤 {item.creator_name}</div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                    <LikeButton initialLikes={item.likes} itemId={item.id} />
                                                    <button
                                                        onClick={e => { e.stopPropagation(); setSelectedVideo(item); }}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', transition: 'background 0.2s' }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                    >
                                                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                                        {item.comment_count || 0}
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={e => { e.stopPropagation(); setShareVideo(item); }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: '#ff3d00', fontSize: '0.82rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', transition: 'background 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,61,0,0.08)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                >
                                                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                                                    Share
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredTrendingStandup.length === 0 && (
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', padding: '8px 0' }}>
                                        No trending standup videos for this filter.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Comedians Section */}
                        <div
                            className="section-wrapper standup-section-wrapper" style={{ marginTop: '4rem' }}
                            onMouseEnter={() => setHovers({ ...hovers, comedians: true })}
                            onMouseLeave={() => setHovers({ ...hovers, comedians: false })}
                        >
                            <div className="video-row-header">
                                <h2 className="section-title">⭐ Top Standup Comedians</h2>
                                <div className="row-nav">
                                    <button className="row-arrow" onClick={() => comediansRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                                    <button className="row-arrow" onClick={() => comediansRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                                </div>
                            </div>
                            <div className="poster-grid standup-comedians-grid" ref={comediansRef} style={{ gap: '2rem', paddingBottom: '1rem' }}>
                                {comedians.map(item => (
                                    <div key={item.id} className="creator-card standup-comedian-card" style={{ flex: '0 0 160px', textAlign: 'center', background: 'var(--bg-secondary)', padding: '15px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <img className="standup-comedian-avatar" src={item.img_url} alt={item.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ff3d00', marginBottom: '10px' }} />
                                            <div style={{ position: 'absolute', bottom: '15px', right: '5px', background: '#38bdf8', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-secondary)' }}>
                                                <svg width="10" height="10" fill="white" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
                                            </div>
                                        </div>
                                        <div className="standup-comedian-name" style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '4px' }}>{item.name}</div>
                                        <div className="standup-comedian-meta" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>{item.real_followers_count ?? item.followers} Followers</div>
                                        <button
                                            className="standup-follow-btn"
                                            onClick={() => handleCreatorFollow(item.id, item.user)}
                                            style={{
                                                background: item.is_following ? 'var(--bg-tertiary)' : '#ff3d00',
                                                color: item.is_following ? 'var(--text-primary)' : '#fff',
                                                border: 'none',
                                                padding: '10px 0',
                                                width: '100%',
                                                borderRadius: '30px',
                                                fontWeight: '800',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            {item.is_following ? 'Following' : 'Follow'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Latest Standup Clips */}
                        <div
                            className="section-wrapper standup-section-wrapper" style={{ marginTop: '4rem' }}
                            onMouseEnter={() => setHovers({ ...hovers, latest: true })}
                            onMouseLeave={() => setHovers({ ...hovers, latest: false })}
                        >
                            <div className="video-row-header">
                                <h2 className="section-title">🆕 Latest Standup Clips</h2>
                                <div className="row-nav">
                                    <button className="row-arrow" onClick={() => latestRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                                    <button className="row-arrow" onClick={() => latestRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                                </div>
                            </div>
                            <div className="poster-grid standup-video-grid" ref={latestRef} style={{ gap: '2rem' }}>
                                {filteredLatestClips.map(item => (
                                    <div key={item.id} className="poster-card standup-video-card" onClick={() => setSelectedVideo(item)} style={{ flex: '0 0 220px', height: 'auto', background: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden', aspectRatio: 'unset', border: '1px solid var(--border)', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                        <div style={{ position: 'relative', height: '125px', width: '100%' }}>
                                            <img src={item.img_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

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
                                            <div className="card-play-overlay">
                                                <div className="play-icon-circle">
                                                    <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ padding: '15px' }}>
                                            <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.2rem' }}>{item.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>👤 {item.creator_name}</div>
                                        </div>
                                    </div>
                                ))}
                                {filteredLatestClips.length === 0 && (
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', padding: '8px 0' }}>
                                        No latest standup clips for this filter.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Standup Categories */}
                        <div
                            className="section-wrapper standup-section-wrapper" style={{ marginTop: '4rem', display: showCategories ? 'block' : 'none' }}
                            onMouseEnter={() => setHovers({ ...hovers, categories: true })}
                            onMouseLeave={() => setHovers({ ...hovers, categories: false })}
                        >
                            <div className="video-row-header">
                                <h2 className="section-title">🎭 Standup Categories</h2>
                                <div className="row-nav">
                                    <button className="row-arrow" onClick={() => categoriesRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                                    <button className="row-arrow" onClick={() => categoriesRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                                </div>
                            </div>
                            <div className="poster-grid standup-categories-grid" ref={categoriesRef} style={{ gap: '1.5rem' }}>
                                {categories.map(cat => (
                                    <div
                                        key={cat.id}
                                        className="poster-card standup-category-card"
                                        style={{ position: 'relative', flex: '0 0 200px', height: '110px', borderRadius: '15px', cursor: 'pointer', overflow: 'hidden', border: '1px solid #333' }}
                                        onClick={() => document.querySelector('.main-container')?.scrollTo({ top: 0, behavior: 'smooth' })}
                                    >
                                        <img src={cat.img} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} alt={cat.name} />
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '15px' }}>
                                            <span style={{ fontWeight: '900', fontSize: '1rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>{cat.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Load More Section */}
                        <div style={{ marginTop: '4rem', textAlign: 'center' }}>
                            <button
                                onClick={handleLoadMore}
                                className="load-more-global"
                                disabled={showCategories}
                            >
                                {loading ? "Discovering More..." : (showCategories ? "More Shows Unlocked" : "Discover More Shows")}
                            </button>
                        </div>
                    </section>
                )}

                {selectedVideo && <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
                {shareVideo && <ShareModal video={shareVideo} onClose={() => setShareVideo(null)} />}
            </div>
        </div >
    );
};

export default Standup;


