import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const initialSavedVideos = [];

const continueWatching = [];

const TABS = ['All', 'Standup', 'Memes', 'Skits'];
const SORT_OPTIONS = ['Recently Saved', 'Most Liked', 'Recently Watched'];

const Saved = () => {
    const [savedVideos, setSavedVideos] = useState(initialSavedVideos);
    const [activeTab, setActiveTab] = useState('All');
    const [hoveredId, setHoveredId] = useState(null);
    const [sortBy, setSortBy] = useState('Recently Saved');
    const navigate = useNavigate();

    const filtered = activeTab === 'All'
        ? savedVideos
        : savedVideos.filter(v => v.category === activeTab);

    const handleRemove = (id) => {
        setSavedVideos(prev => prev.filter(v => v.id !== id));
    };

    return (
        <div className="saved-page" style={{ padding: '0 1.5rem', marginTop: '1.5rem', animation: 'fadeIn 0.5s ease', paddingBottom: '110px' }}>

            {/* Page Header */}
            <div className="saved-page-header">
                <div>
                    <h2 className="section-title" style={{ marginBottom: '4px', color: 'var(--text-primary)' }}>🔖 Saved Videos</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500', margin: 0 }}>
                        All the videos you bookmarked in one place
                    </p>
                </div>
                <div className="saved-sort-dropdown">
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        style={{
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            padding: '8px 14px',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            fontWeight: '600',
                            outline: 'none'
                        }}
                    >
                        {SORT_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="saved-filter-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        className={`saved-filter-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Empty State */}
            {filtered.length === 0 ? (
                <div className="saved-empty-state">
                    <div style={{ fontSize: '4rem', marginBottom: '12px', opacity: 0.5 }}>🔖</div>
                    <h3 style={{ color: 'var(--text-primary)', fontWeight: 900, marginBottom: '8px' }}>No saved videos yet</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                        Start saving your favorite comedy videos<br />so you can watch them later.
                    </p>
                    <button
                        className="auth-btn"
                        style={{ padding: '12px 32px', width: 'auto', fontSize: '0.95rem' }}
                        onClick={() => navigate('/explore')}
                    >
                        Explore Videos
                    </button>
                </div>
            ) : (
                <div className="saved-videos-grid">
                    {filtered.map(video => (
                        <div
                            key={video.id}
                            className="saved-video-card"
                            onMouseEnter={() => setHoveredId(video.id)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                            <div className="saved-thumb-wrap">
                                <img src={video.img} alt={video.title} className="saved-thumb-img" />

                                {/* Hover Overlay */}
                                <div className={`saved-thumb-overlay ${hoveredId === video.id ? 'visible' : ''}`}>
                                    <button className="saved-action-btn play">▶ Play</button>
                                    <button className="saved-action-btn remove" onClick={() => handleRemove(video.id)}>
                                        ❌ Remove
                                    </button>
                                </div>
                            </div>

                            <div className="saved-card-info">
                                <div className="saved-card-title">{video.title}</div>
                                <div className="saved-card-creator">👤 {video.creator}</div>
                                <div className="saved-card-stats">
                                    <span>❤️ {video.likes}</span>
                                    <span>💬 {video.comments}</span>
                                    <span className="saved-category-badge">{video.category}</span>
                                </div>
                            </div>

                            {/* Bookmark remove icon */}
                            <button
                                className="card-save-btn-v2 active"
                                onClick={() => handleRemove(video.id)}
                                title="Remove from saved"
                                style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}
                            >
                                <svg fill="white" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Continue Watching */}
            {filtered.length > 0 && (
                <div style={{ marginTop: '2.5rem' }}>
                    <h3 className="section-title" style={{ fontSize: '1.1rem', marginBottom: '16px' }}>▶ Continue Watching</h3>
                    <div className="continue-watching-list">
                        {continueWatching.map(v => (
                            <div key={v.id} className="continue-watching-card">
                                <div className="cw-thumb">
                                    <img src={v.img} alt={v.title} />
                                    <div className="cw-play">▶</div>
                                    {/* Progress bar */}
                                    <div className="cw-progress-bar">
                                        <div className="cw-progress-fill" style={{ width: `${v.progress}%` }}></div>
                                    </div>
                                </div>
                                <div className="cw-info">
                                    <div className="cw-title">{v.title}</div>
                                    <div className="cw-progress-text">{v.progress}% watched</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Saved;

