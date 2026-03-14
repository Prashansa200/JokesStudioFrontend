import React, { useState } from 'react';
import { saveVideo } from '../api';

const VideoCard = ({ video, onClick, type = '' }) => {
    const [saved, setSaved] = useState(video?.is_saved || false);

    const isDirectVideo = (url) => {
        if (!url) return false;
        return url.toLowerCase().endsWith('.mp4') || url.includes('/media/videos/') || url.includes('mixkit.co');
    };

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
        <div className="premium-card-v2" onClick={onClick} style={type === 'standup' ? { flex: '0 0 230px' } : {}}>
            <div className="card-media-wrap">
                {isDirectVideo(video.video_url || video.video) ? (
                    <video
                        src={video.video_url || video.video}
                        className="card-img"
                        muted playsInline loop
                        onMouseEnter={e => e.currentTarget.play()}
                        onMouseLeave={e => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                        }}
                        poster={video.img_url || video.img}
                    />
                ) : (
                    <img src={video.img_url || video.img} alt={video.title} className="card-img" />
                )}

                <button
                    className={`card-save-btn-v2 ${saved ? 'active' : ''}`}
                    onClick={handleSave}
                    title={saved ? "Unsave" : "Save to History"}
                >
                    <svg fill={saved ? "white" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                </button>

                <div className="card-play-overlay">
                    <div className="play-icon-circle">
                        <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                </div>
            </div>
            <div className="card-content-v2">
                <h3 className="card-title-v2">{video.title}</h3>
                <div className="card-footer-v2">
                    <div className="card-meta-row-v2">
                        {(video.creator_name || video.creator) && (
                            <div className="card-creator-v2">
                                <div className="creator-avatar-sm">{(video.creator_name || video.creator || 'U')[0]}</div>
                                <span className="creator-name-sm">{video.creator_name || video.creator}</span>
                            </div>
                        )}
                        <span className="card-views-v2">👁 {video.views || '1.2K'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoCard;
