import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoModal from '../components/VideoModal';
import { getProfile, saveVideo } from '../api';

const TABS = ['My Videos', 'Saved', 'Liked', 'History'];

const Profile = ({ onShare, authUser }) => {
    const [activeTab, setActiveTab] = useState('My Videos');
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total_videos: 0,
        total_likes: 0,
        followers_count: 0,
        following_count: 0,
        my_videos: [],
        saved_videos: [],
        liked_videos: [],
    });
    const [profile, setProfile] = useState({
        name: authUser?.username || 'User',
        handle: authUser?.username ? `@${authUser.username}` : '@user',
        bio: 'Comedy Lover\nWatching laughs daily'
    });
    const [editForm, setEditForm] = useState({ ...profile });
    const navigate = useNavigate();

    // Fetch real profile data from backend
    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const data = await getProfile(token);
                setStats(data);
                setProfile({
                    name: data.display_name,
                    handle: `@${data.username}`,
                    bio: data.bio
                });
                setEditForm({
                    name: data.display_name,
                    handle: `@${data.username}`,
                    bio: data.bio
                });
            } catch (err) {
                console.error("Failed to fetch profile", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [authUser]);

    const handleSaveProfile = () => {
        setProfile({ ...editForm });
        setShowEditModal(false);
        // In a real app, you'd also call an API to update the backend profile here
    };

    const handleShareProfile = () => {
        if (onShare) {
            onShare({
                type: 'profile',
                title: profile.name,
                handle: profile.handle
            });
        }
    };

    const renderTabContent = () => {
        if (loading) return <div className="profile-empty-state"><div className="spinner-small"></div><p>Loading your content...</p></div>;

        if (activeTab === 'My Videos') {
            const vids = stats.my_videos || [];
            return vids.length === 0 ? (
                <div className="profile-empty-state">
                    <div style={{ fontSize: '3rem', marginBottom: '10px', opacity: 0.4 }}>[Video]</div>
                    <p>You haven't uploaded any videos yet.</p>
                    <button className="auth-btn" style={{ width: 'auto', padding: '10px 24px', marginTop: '12px' }} onClick={() => navigate('/upload')}>
                        Upload your first video
                    </button>
                </div>
            ) : (
                <div className="profile-video-grid">
                    {vids.map(v => <ProfileVideoCard key={v.id} video={v} showStats onPlay={() => setSelectedVideo(v)} />)}
                </div>
            );
        }
        if (activeTab === 'Saved') {
            const vids = stats.saved_videos || [];
            return vids.length === 0 ? (
                <div className="profile-empty-state">
                    <div style={{ fontSize: '3rem', marginBottom: '10px', opacity: 0.4 }}>[Saved]</div>
                    <p>You haven't saved any videos yet.</p>
                    <button className="auth-btn" style={{ width: 'auto', padding: '10px 24px', marginTop: '12px' }} onClick={() => navigate('/explore')}>
                        Explore Videos
                    </button>
                </div>
            ) : (
                <div className="profile-video-grid">
                    {vids.map(v => <ProfileVideoCard key={v.id} video={v} onPlay={() => setSelectedVideo(v)} />)}
                </div>
            );
        }
        if (activeTab === 'Liked') {
            const vids = stats.liked_videos || [];
            return vids.length === 0 ? (
                <div className="profile-empty-state">
                    <div style={{ fontSize: '3rem', marginBottom: '10px', opacity: 0.4 }}>[Liked]</div>
                    <p>No liked videos yet.</p>
                </div>
            ) : (
                <div className="profile-video-grid">
                    {vids.map(v => <ProfileVideoCard key={v.id} video={v} onPlay={() => setSelectedVideo(v)} />)}
                </div>
            );
        }
        if (activeTab === 'History') {
            const vids = stats.watch_history || [];
            return vids.length === 0 ? (
                <div className="profile-empty-state">
                    <div style={{ fontSize: '3rem', marginBottom: '10px', opacity: 0.4 }}>[History]</div>
                    <p>Your watch history is empty.</p>
                </div>
            ) : (
                <div className="profile-video-grid">
                    {vids.map(v => <ProfileVideoCard key={v.id} video={v} />)}
                </div>
            );
        }
    };

    const formatCount = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num;
    };

    return (
        <div className="profile-full-page" style={{ paddingBottom: '110px' }}>

            {/* Enhanced Cover Banner */}
            <div className="profile-cover-banner">
                <div className="pcb-blob pcb-blob-1"></div>
                <div className="pcb-blob pcb-blob-2"></div>
                <div className="pcb-blob pcb-blob-3"></div>

                <div className="pcb-emojis">
                    {['\u{1F602}', '\u{1F3A4}', '\u{1F525}', '\u{1F602}', '\u{1F3AD}', '\u{1F602}', '\u{1F4AB}', '\u{1F3A4}', '\u{1F602}', '\u{1F525}', '\u{1F602}'].map((e, i) => (
                        <span key={i} className="pcb-emoji" style={{ animationDelay: `${i * 0.3}s`, fontSize: `${1.2 + (i % 3) * 0.4}rem` }}>{e}</span>
                    ))}
                </div>

                <div className="pcb-dots">
                    {[...Array(18)].map((_, i) => (
                        <div key={i} className="pcb-dot" style={{ left: `${(i * 17) % 100}%`, animationDelay: `${i * 0.15}s` }}></div>
                    ))}
                </div>

                <div className="pcb-fade-bottom"></div>
            </div>

            {/* Identity Section */}
            <div className="profile-identity-section">

                <div className="profile-top-row">
                    <div className="profile-avatar-wrapper">
                        <div className="profile-avatar-ring">
                            <div className="profile-avatar-xl">{'\u{1F464}'}</div>
                        </div>
                        <div className="profile-online-dot"></div>
                    </div>

                    <div className="profile-top-btns">
                        <button className="auth-btn profile-edit-btn" onClick={() => setShowEditModal(true)}>Edit Profile</button>
                    </div>
                </div>

                <div className="profile-info-block">
                    <div className="profile-name-row">
                        <h2 className="profile-name" style={{ color: 'var(--text-primary)' }}>{profile.name}</h2>
                        <span className="profile-verify-tick" title="Verified Creator">✓</span>
                        <span className="profile-creator-badge">Creator</span>
                    </div>
                    <div className="profile-handle-text" style={{ color: 'var(--text-secondary)' }}>{profile.handle}</div>
                    <div className="profile-bio-text">
                        {profile.bio.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                    </div>

                    {/* Real follower micro stats */}
                    <div className="profile-inline-stats" style={{ color: 'var(--text-secondary)' }}>
                        <span><strong style={{ color: 'var(--text-primary)' }}>{formatCount(stats.followers_count)}</strong> Followers</span>
                        <span className="pis-dot">·</span>
                        <span><strong style={{ color: 'var(--text-primary)' }}>{formatCount(stats.following_count)}</strong> Following</span>
                    </div>

                    <button className="profile-share-text-btn" onClick={handleShareProfile}>Share profile</button>
                </div>
            </div>

            {/* Real Stats Bar */}
            <div className="profile-stats-bar" style={{ marginBottom: '1.5rem' }}>
                <div className="profile-stat-item">
                    <span className="profile-stat-value" style={{ color: 'var(--text-primary)' }}>{formatCount(stats.total_videos)}</span>
                    <span className="profile-stat-label" style={{ color: 'var(--text-secondary)' }}>Videos</span>
                </div>
                <div className="profile-stat-divider" style={{ background: 'var(--border)' }}></div>
                <div className="profile-stat-item">
                    <span className="profile-stat-value" style={{ color: 'var(--text-primary)' }}>{formatCount(stats.followers_count)}</span>
                    <span className="profile-stat-label" style={{ color: 'var(--text-secondary)' }}>Followers</span>
                </div>
                <div className="profile-stat-divider" style={{ background: 'var(--border)' }}></div>
                <div className="profile-stat-item">
                    <span className="profile-stat-value" style={{ color: 'var(--text-primary)' }}>{formatCount(stats.following_count)}</span>
                    <span className="profile-stat-label" style={{ color: 'var(--text-secondary)' }}>Following</span>
                </div>
                <div className="profile-stat-divider" style={{ background: 'var(--border)' }}></div>
                <div className="profile-stat-item">
                    <span className="profile-stat-value" style={{ color: 'var(--text-primary)' }}>{formatCount(stats.total_likes)}</span>
                    <span className="profile-stat-label" style={{ color: 'var(--text-secondary)' }}>Total Likes</span>
                </div>
            </div>

            {/* Subscription Management */}
            {(() => {
                const stored = localStorage.getItem('activePlan');
                if (!stored) return null;
                try {
                    const plan = JSON.parse(stored);
                    const planColors = { starter: '#38bdf8', growth: '#ff6b00', pro: '#a855f7' };
                    const color = planColors[plan.planId] || '#ff6b00';
                    return (
                        <div style={{
                            margin: '0 1.5rem 2rem',
                            background: `${color}12`,
                            border: `1px solid ${color}33`,
                            borderRadius: '20px',
                            padding: '1.25rem 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            animation: 'fadeIn 0.5s ease'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{
                                    width: '50px', height: '50px', background: color, borderRadius: '14px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                                    boxShadow: `0 8px 20px ${color}44`
                                }}>
                                    {plan.planId === 'starter' ? 'Starter' : plan.planId === 'growth' ? 'Growth' : 'Pro'}
                                </div>
                                <div>
                                    <div style={{ color: color, fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Active Plan</div>
                                    <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>{plan.planName} Tier</div>
                                    <div style={{ color: '#888', fontSize: '0.75rem', marginTop: '2px' }}>Registered: {plan.whatsappNumber}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to cancel your subscription?')) {
                                        localStorage.removeItem('activePlan');
                                        window.location.reload();
                                    }
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#ff4d4d',
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,77,77,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                            >
                                Cancel Plan
                            </button>
                        </div>
                    );
                } catch { return null; }
            })()}

            {/* Tabs */}
            <div className="profile-tabs-bar">
                {TABS.map(tab => (
                    <div key={tab} className={`profile-tab-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                        {tab}
                    </div>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ padding: '0 1.5rem' }}>
                {renderTabContent()}
            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="profile-modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="profile-modal-card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: '1.25rem' }}>Edit Profile</h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-secondary)', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >x</button>
                        </div>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div className="profile-avatar-xl" style={{ margin: '0 auto 12px', cursor: 'pointer', border: '3px solid rgba(255,107,0,0.3)', background: '#1c1d21' }}>{'\u{1F464}'}</div>
                            <p style={{ color: '#ff6b00', fontSize: '0.88rem', fontWeight: 800, cursor: 'pointer' }}>Change Profile Photo</p>
                        </div>
                        <div className="input-group">
                            <label style={{ fontSize: '0.72rem', color: '#888', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', display: 'block' }}>Full Name</label>
                            <input type="text" className="std-input" placeholder="Display name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label style={{ fontSize: '0.72rem', color: '#888', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', display: 'block' }}>Username</label>
                            <input type="text" className="std-input" placeholder="@handle" value={editForm.handle} onChange={e => setEditForm({ ...editForm, handle: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label style={{ fontSize: '0.72rem', color: '#888', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', display: 'block' }}>Bio</label>
                            <textarea className="std-input" rows="3" style={{ resize: 'none', paddingTop: '12px' }} value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })}></textarea>
                        </div>
                        <button className="auth-btn" style={{ marginTop: '20px', height: '54px', fontSize: '1rem' }} onClick={handleSaveProfile}>Save Changes</button>
                    </div>
                </div>
            )}

            {selectedVideo && <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
        </div>
    );
};

const ProfileVideoCard = ({ video, showStats, onPlay }) => {
    const [hovered, setHovered] = useState(false);
    const [saved, setSaved] = useState(video?.is_saved || false);

    const handleSave = async (e) => {
        e.stopPropagation();
        const prev = saved;
        setSaved(!prev);
        try {
            const res = await saveVideo(video.id, !prev ? 'save' : 'unsave');
            if (!res || res.error) setSaved(prev);
        } catch {
            setSaved(prev);
        }
    };

    return (
        <div className="profile-video-card" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={onPlay}>
            <div className="profile-video-thumb">
                <img src={video.img_url} alt={video.title} />

                <div
                    className={`card-save-btn-v2 ${saved ? 'active' : ''}`}
                    onClick={handleSave}
                    style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10, width: '28px', height: '28px' }}
                >
                    <svg fill={saved ? "white" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                </div>

                {hovered && (
                    <div className="profile-video-hover">
                        <button className="saved-action-btn play">Play</button>
                    </div>
                )}
            </div>
            <div className="profile-video-info">
                <div className="saved-card-title" style={{ fontSize: '0.82rem' }}>{video.title}</div>
                {showStats && (
                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.72rem', color: '#888', marginTop: '4px' }}>
                        <span>Views {video.views}</span>
                        <span>Likes {video.likes}</span>
                    </div>
                )}
                {!showStats && <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '4px' }}>{video.views} views</div>}
            </div>
        </div>
    );
};

export default Profile;



