import React, { useState, useEffect } from 'react';
import { likeVideo } from '../api';

/**
 * LikeButton - Reusable like/unlike toggle button with backend sync
 */
const LikeButton = ({ initialLikes = 0, itemId, size = 'sm' }) => {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        setLikeCount(parseCount(initialLikes));
    }, [initialLikes]);

    // Parse string likes like "12K" to number
    function parseCount(val) {
        if (typeof val === 'number') return val;
        const str = String(val).trim();
        if (str.endsWith('K')) return parseFloat(str) * 1000;
        if (str.endsWith('M')) return parseFloat(str) * 1000000;
        return parseInt(str) || 0;
    }

    const formatCount = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return String(num);
    };

    const handleLike = async (e) => {
        e.stopPropagation();
        if (!itemId) return;

        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
        setAnimating(true);
        setTimeout(() => setAnimating(false), 400);

        try {
            const data = await likeVideo(itemId, newLiked ? 'like' : 'unlike');
            if (data && data.likes !== undefined) {
                setLikeCount(data.likes);
            }
        } catch (err) {
            console.error("Like failed", err);
            // Revert state on error
            setLiked(!newLiked);
            setLikeCount(prev => !newLiked ? prev + 1 : Math.max(0, prev - 1));
        }
    };

    const iconSize = size === 'md' ? 16 : 13;
    const fontSize = size === 'md' ? '0.9rem' : '0.82rem';

    return (
        <>
            <style>{`
                @keyframes likeHeartPop {
                    0%   { transform: scale(1); }
                    40%  { transform: scale(1.55); }
                    70%  { transform: scale(0.88); }
                    100% { transform: scale(1); }
                }
                .like-btn-heart.popping {
                    animation: likeHeartPop 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
                }
            `}</style>
            <button
                onClick={handleLike}
                title={liked ? 'Unlike' : 'Like'}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: liked ? 'rgba(255,61,0,0.10)' : 'none',
                    border: liked ? '1px solid rgba(255,61,0,0.25)' : '1px solid transparent',
                    cursor: 'pointer',
                    color: liked ? '#ff3d00' : 'var(--text-secondary)',
                    fontSize,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '20px',
                    transition: 'color 0.2s, background 0.2s, border 0.2s',
                    outline: 'none',
                    userSelect: 'none',
                }}
                onMouseEnter={e => {
                    if (!liked) e.currentTarget.style.background = 'rgba(255,61,0,0.07)';
                }}
                onMouseLeave={e => {
                    if (!liked) e.currentTarget.style.background = 'none';
                }}
            >
                <svg
                    className={`like-btn-heart ${animating ? 'popping' : ''}`}
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 24 24"
                    fill={liked ? '#ff3d00' : 'none'}
                    stroke={liked ? '#ff3d00' : 'currentColor'}
                    strokeWidth="2.2"
                    style={{ transition: 'fill 0.2s, stroke 0.2s', flexShrink: 0 }}
                >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span style={{ transition: 'color 0.2s' }}>
                    {formatCount(likeCount)}
                </span>
            </button>
        </>
    );
};

export default LikeButton;
