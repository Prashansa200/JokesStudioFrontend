import React, { useState, useEffect } from 'react';

const platforms = [
    {
        name: 'WhatsApp',
        color: '#25D366',
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
        ),
        action: (url, title) => window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, '_blank')
    },
    {
        name: 'Gmail',
        color: '#EA4335',
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
            </svg>
        ),
        action: (url, title) => window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`, '_blank')
    },
    {
        name: 'Facebook',
        color: '#1877F2',
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
        ),
        action: (url) => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
    },
    {
        name: 'Twitter / X',
        color: '#000000',
        icon: (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
        action: (url, title) => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank')
    },
    {
        name: 'LinkedIn',
        color: '#0A66C2',
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
        ),
        action: (url) => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
    },
    {
        name: 'Telegram',
        color: '#26A5E4',
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
        ),
        action: (url, title) => window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank')
    },
];

const ShareModal = ({ video, onClose }) => {
    const [copied, setCopied] = useState(false);
    const shareUrl = `https://laughloop.com/watch/${video?.id || '1'}`;
    const shareTitle = video?.title || 'Check this out on Jokes Studio!';

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    if (!video) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(8px)',
                zIndex: 9000,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                animation: 'fadeIn 0.2s ease',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '28px 28px 0 0',
                    width: '100%',
                    maxWidth: '560px',
                    padding: '0 0 40px',
                    border: '1px solid var(--border)',
                    borderBottom: 'none',
                    animation: 'slideUp 0.35s cubic-bezier(0.15, 0.85, 0.35, 1)',
                }}
            >
                {/* Drag Handle */}
                <div style={{ width: '40px', height: '5px', background: 'var(--border)', borderRadius: '10px', margin: '14px auto 0' }} />

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.1rem' }}>
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                        Share link
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '1rem', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    >✕</button>
                </div>

                {/* URL Bar */}
                <div style={{ margin: '0 20px 24px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--bg-tertiary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="18" height="18" fill="none" stroke="var(--text-secondary)" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shareTitle}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shareUrl}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        {/* Copy Button */}
                        <button
                            onClick={handleCopy}
                            title={copied ? 'Copied!' : 'Copy link'}
                            style={{ width: '36px', height: '36px', background: copied ? 'rgba(52,211,153,0.15)' : 'var(--bg-tertiary)', border: `1px solid ${copied ? 'rgba(52,211,153,0.5)' : 'var(--border)'}`, borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', color: copied ? '#34d399' : 'var(--text-secondary)' }}
                        >
                            {copied ? (
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                            ) : (
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Section Label */}
                <div style={{ padding: '0 20px 16px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Share using
                </div>

                {/* Platform Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', padding: '0 20px' }}>
                    {platforms.map(p => (
                        <button
                            key={p.name}
                            onClick={() => p.action(shareUrl, shareTitle)}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 4px', borderRadius: '14px', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                            <div style={{ width: '52px', height: '52px', background: p.color, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${p.color}40`, transition: 'transform 0.15s', flexShrink: 0 }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                {p.icon}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>{p.name}</span>
                        </button>
                    ))}
                    {/* Native Share API button */}
                    {navigator.share && (
                        <button
                            onClick={() => navigator.share({ title: shareTitle, url: shareUrl }).catch(() => { })}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 4px', borderRadius: '14px', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                            <div style={{ width: '52px', height: '52px', background: '#6366f1', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
                                <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                </svg>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textAlign: 'center' }}>More</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareModal;

