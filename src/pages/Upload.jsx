import React, { useState, useEffect } from 'react';
import { submitVideoRequest, getCreators } from '../api';

const Upload = ({ isLoggedIn, authUser, partnerStatus, setPartnerStep }) => {
    const [creators, setCreators] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        stats: '',
        img_url: '',
        video_url: '',
        section: 'trending',
        page: 'home',
        badge: '',
        creator: '',
        manual_video: null
    });

    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [error, setError] = useState('');
    const [videoPreview, setVideoPreview] = useState(null);

    useEffect(() => {
        getCreators().then(data => {
            setCreators(data);
            if (authUser) {
                const myCreator = data.find(c => c.name.toLowerCase() === authUser.username.toLowerCase());
                if (myCreator) {
                    setFormData(prev => ({ ...prev, creator: String(myCreator.id) }));
                }
            }
        }).catch(console.error);
    }, [isLoggedIn, authUser]);

    const isVerifiedPartner = partnerStatus === 'completed';

    const filteredCreators = authUser
        ? creators.filter(c => c.name.toLowerCase() === authUser.username.toLowerCase())
        : [];

    const sectionChoices = [
        { id: 'hero', label: 'Hero Section' },
        { id: 'trending', label: 'Trending Now' },
        { id: 'standup', label: 'Standup Highlights' },
        { id: 'most_watched', label: 'Most Watched Today' },
        { id: 'memes', label: 'Viral Memes' },
        { id: 'skits', label: 'Comedy Skits' },
        { id: 'latest', label: 'Latest Clips' },
    ];

    const pageChoices = [
        { id: 'home', label: 'Home' },
        { id: 'popular', label: 'Popular' },
        { id: 'standup', label: 'Standup' },
        { id: 'memes', label: 'Memes' },
        { id: 'newhot', label: 'New & Hot' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title || !formData.img_url || (!formData.video_url && !formData.manual_video)) {
            setError('Please fill in required fields: Title, Thumbnail URL, and either a Video URL or Manual Video.');
            return;
        }

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== undefined) {
                    payload.append(key, formData[key]);
                }
            });
            await submitVideoRequest(token, payload);
            setUploadSuccess(true);
            setVideoPreview(null);
            setFormData({
                title: '', subtitle: '', stats: '', img_url: '', video_url: '',
                section: 'trending', page: 'home', badge: '', creator: '', manual_video: null
            });
        } catch (err) {
            setError(err.message || 'Failed to submit request');
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const supportedFormats = [
                'video/mp4', 'video/quicktime', 'video/x-msvideo',
                'video/x-ms-wmv', 'video/x-flv', 'video/webm', 'video/mpeg'
            ];
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const supportedExts = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mpeg', 'mpg'];

            if (!supportedFormats.includes(file.type) && !supportedExts.includes(fileExtension)) {
                setError(`❌ Invalid Format: "${fileExtension.toUpperCase()}" is not supported.`);
                e.target.value = null;
                return;
            }

            if (file.size > 500 * 1024 * 1024) {
                setError('❌ Size Limit Exceeded: Browser upload is capped at 500MB.');
                e.target.value = null;
                return;
            }

            setFormData({ ...formData, manual_video: file });
            setError('');

            // Create preview
            const reader = new FileReader();
            reader.onload = () => setVideoPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const renderSuccessModal = () => (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--header-bg)', backdropFilter: 'blur(20px)'
        }}>
            <div className="animate-celebration" style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: '40px', padding: '3.5rem 3rem',
                maxWidth: '500px', width: '90%', textAlign: 'center',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <div style={{
                    width: '100px', height: '100px', background: 'rgba(255,107,0,0.1)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '4rem', margin: '0 auto 2rem', border: '2px solid rgba(255,107,0,0.2)'
                }}>🚀</div>

                <h3 style={{ color: 'var(--text-primary)', fontSize: '2.2rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.5px' }}>
                    Sent for Review!
                </h3>

                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '1.05rem', marginBottom: '2.5rem' }}>
                    Congratulations! Your comedy masterpiece has been uploaded. Our team will verify the content guidelines and publish it globally within <strong>4-12 hours</strong>.
                </p>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                        onClick={() => { setUploadSuccess(false); window.location.href = '/'; }}
                        className="upload-btn-v3"
                        style={{ padding: '16px 20px', fontSize: '1rem' }}
                    >
                        🏠 Go to Feed
                    </button>
                    <button
                        onClick={() => setUploadSuccess(false)}
                        className="auth-btn"
                        style={{ flex: 1, padding: '14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                        Upload Another
                    </button>
                </div>
            </div>
        </div>
    );

    if (!isVerifiedPartner) {
        return (
            <div className="upload-page-view" style={{ padding: '0 1.5rem', marginTop: '1.5rem', minHeight: '75vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '440px', marginBottom: '2rem' }}>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2.5rem 1.5rem', backdropFilter: 'blur(10px)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1.2rem' }}>🔐</div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Creator Access Restricted</h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.8rem', fontSize: '0.85rem', lineHeight: 1.5 }}>
                            Only registered and verified Jokes Studio Partners can upload videos. Unlock your creator dashboard to start sharing comedy clips.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                        onClick={() => setPartnerStep(partnerStatus === 'pending' ? 'pending' : 'plans')}
                        className="auth-btn"
                        style={{ padding: '12px 30px', fontSize: '0.95rem', background: 'linear-gradient(135deg, #ff6b00, #a855f7)' }}
                    >
                        {partnerStatus === 'pending' ? '⏳ Check Status' : '🚀 Become a Partner'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="upload-page-view" style={{ padding: '0 1rem', marginTop: '1rem', animation: 'fadeIn 0.5s ease', minHeight: '80vh', paddingBottom: '2.5rem' }}>
            <div className="video-row-header" style={{ marginBottom: '1.2rem', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <h2 className="section-title" style={{ fontSize: '1.35rem', marginBottom: 0, color: 'var(--text-primary)' }}>📤 Submit Video Request</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Admin will review and publish within 12 hours.</p>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: `rgba(74, 222, 128, 0.08)`,
                    border: `1px solid rgba(74, 222, 128, 0.2)`,
                    borderRadius: '50px', padding: '5px 10px',
                    color: '#4ade80',
                    fontSize: '0.75rem', fontWeight: 700,
                }}>
                    ✨ Partner Active
                </div>
            </div>

            <div className="upload-container" style={{ maxWidth: '850px', margin: '0 auto' }}>
                {uploadSuccess && renderSuccessModal()}

                {error && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '0.8rem', marginBottom: '1.5rem', color: '#ef4444', fontSize: '0.9rem' }}>
                        ⚠️ {error}
                    </div>
                )}

                <form className="upload-card-v3" onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div className="input-group">
                            <label style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: '#ff6b00' }}>01</span> Video Title *
                            </label>
                            <input required type="text" className="std-input" placeholder="Give your masterpiece a name..." value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} style={{ fontSize: '0.95rem', padding: '12px 14px' }} />
                        </div>

                        <div className="input-group">
                            <label style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: '#ff6b00' }}>02</span> Subtitle / Short Description
                            </label>
                            <input type="text" className="std-input" placeholder="Brief context or credits..." value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} style={{ padding: '12px 14px', fontSize: '0.9rem' }} />
                        </div>

                        <div className="input-group">
                            <label style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: '#ff6b00' }}>03</span> Cover Thumbnail URL *
                            </label>
                            <input required type="url" className="std-input" placeholder="https://..." value={formData.img_url} onChange={e => setFormData({ ...formData, img_url: e.target.value })} style={{ padding: '12px 14px', fontSize: '0.9rem' }} />
                        </div>

                        <div className="input-group">
                            <label style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: '#ff6b00' }}>04</span> YouTube / Global Video Link {!formData.manual_video && '*'}
                            </label>
                            <input required={!formData.manual_video} type="text" className="std-input" placeholder="External link if not uploading manually..." value={formData.video_url} onChange={e => setFormData({ ...formData, video_url: e.target.value })} style={{ padding: '12px 14px', fontSize: '0.9rem' }} />
                        </div>

                        <div className="input-group">
                            <label style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: '#ff6b00' }}>05</span> Display Stats
                            </label>
                            <input type="text" className="std-input" placeholder="e.g. 100K Views • Trending" value={formData.stats} onChange={e => setFormData({ ...formData, stats: e.target.value })} style={{ padding: '12px 14px', fontSize: '0.9rem' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group">
                                <label style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px', display: 'block' }}>Target Page</label>
                                <select className="std-input" value={formData.page} onChange={e => setFormData({ ...formData, page: e.target.value })} style={{ padding: '12px', fontSize: '0.9rem' }}>
                                    {pageChoices.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px', display: 'block' }}>Section Placement</label>
                                <select className="std-input" value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })} style={{ padding: '12px', fontSize: '0.9rem' }}>
                                    {sectionChoices.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="input-group">
                            <label style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px', display: 'block' }}>Creator Profile</label>
                            <select className="std-input" value={formData.creator} onChange={e => setFormData({ ...formData, creator: e.target.value })} style={{ padding: '12px', fontSize: '0.9rem' }}>
                                <option value="">Select Category/Creator</option>
                                {filteredCreators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="input-group">
                            <label style={{ color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px', display: 'block' }}>Exclusive Badge (Optional)</label>
                            <input type="text" className="std-input" placeholder="e.g. MUST WATCH" value={formData.badge} onChange={e => setFormData({ ...formData, badge: e.target.value })} style={{ padding: '12px', fontSize: '0.9rem' }} />
                        </div>

                        <div style={{ flex: 1 }}></div>

                        <div className="manual-upload-trigger" style={{ marginTop: '0.5rem' }}>
                            <label
                                htmlFor="manual-video-input"
                                className={`custom-file-upload-v3 ${formData.manual_video ? 'has-file' : ''}`}
                                style={{ minHeight: videoPreview ? '200px' : '150px', padding: '1.5rem', background: 'var(--bg-primary)', border: '2px dashed var(--border)' }}
                            >
                                {videoPreview ? (
                                    <div style={{ width: '100%', textAlign: 'center' }}>
                                        <video src={videoPreview} style={{ width: '100%', maxHeight: '120px', borderRadius: '10px', background: '#000', marginBottom: '8px' }} controls />
                                        <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.8rem', margin: '2px 0' }}>{formData.manual_video.name}</p>
                                        <p style={{ color: '#4ade80', fontSize: '0.65rem', fontWeight: 700 }}>VERIFIED QUALITY • READY</p>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ width: '30px', height: '30px', background: 'var(--bg-tertiary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: '1rem', color: 'var(--text-primary)' }}>☁️</div>
                                        <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>Select manual video</p>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginTop: '4px' }}>Max: 500MB</p>
                                    </div>
                                )}
                                <input id="manual-video-input" type="file" style={{ display: 'none' }} onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>

                    <div className="criteria-full-width" style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.8rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ background: 'var(--bg-tertiary)', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>📋</span>
                                Submission Guidelines
                            </h3>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.5px', color: '#4ade80', background: 'rgba(74, 222, 128, 0.08)', padding: '4px 10px', borderRadius: '50px', border: '1px solid rgba(74, 222, 128, 0.15)' }}>
                                ELIGIBLE
                            </span>
                        </div>

                        <div className="criteria-grid-v3" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem' }}>
                            {[
                                { icon: '📦', title: 'Format', items: ['MP4, MOV', 'Max 256GB'] },
                                { icon: '📺', title: 'Quality', items: ['720p - 8K', '16:9 / 9:16'] },
                                { icon: '⚙️', title: 'Codec', items: ['H.264', '30/60 FPS'] },
                                { icon: '🖼️', title: 'Thumb', items: ['HD Jpeg', 'Max 2MB'] },
                            ].map((c, i) => (
                                <div key={i} className="criteria-card-v3" style={{ background: 'var(--bg-primary)', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    <h5 style={{ margin: '0 0 6px 0', fontSize: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span style={{ fontSize: '0.9rem' }}>{c.icon}</span> {c.title}
                                    </h5>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                                        {c.items.map((item, j) => <li key={j} style={{ marginBottom: '2px' }}>• {item}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ gridColumn: '1 / -1', marginTop: '0.8rem', textAlign: 'center' }}>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="upload-btn-v3"
                            style={{
                                opacity: uploading ? 0.7 : 1,
                                minWidth: '180px',
                                padding: '0.6rem 1.5rem',
                                fontSize: '0.85rem',
                                borderRadius: '50px',
                                background: 'linear-gradient(135deg, #ff6b00, #ff3d00)',
                                boxShadow: '0 8px 16px rgba(255,107,0,0.12)',
                                border: 'none',
                                color: '#fff',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {uploading ? (
                                <>
                                    <div className="spinner-small" style={{ width: '16px', height: '16px', borderTopColor: '#fff' }}></div>
                                    Processing...
                                </>
                            ) : (
                                <>🚀 Submit Request</>
                            )}
                        </button>
                        <p style={{ marginTop: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.65rem' }}>By submitting, you agree to Content Community Guidelines.</p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Upload;
