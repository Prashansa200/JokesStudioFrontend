import React from 'react';

const Explore = () => {
    const categories = [
        { name: 'Trending', icon: '🔥', color: 'linear-gradient(135deg, #ff416c, #ff4b2b)' },
        { name: 'Standup', icon: '🎤', color: 'linear-gradient(135deg, #8E2DE2, #4A00E0)' },
        { name: 'Memes', icon: '😂', color: 'linear-gradient(135deg, #FDB99B, #CF8BF3, #A770EF)' },
        { name: 'Skits', icon: '🎭', color: 'linear-gradient(135deg, #00B4DB, #0083B0)' },
        { name: 'Family Comedy', icon: '👨‍👩‍👧', color: 'linear-gradient(135deg, #11998e, #38ef7d)' },
        { name: 'Engineer Jokes', icon: '💻', color: 'linear-gradient(135deg, #2c3e50, #3498db)' }
    ];

    return (
        <div className="explore-page-view" style={{ padding: '0 2rem', marginTop: '2rem', animation: 'fadeIn 0.5s ease' }}>
            <div className="video-row-header" style={{ marginBottom: '2rem' }}>
                <h2 className="section-title">🔍 Discovery</h2>
            </div>

            <div className="explore-grid">
                {categories.map((cat, index) => (
                    <div key={index} className="explore-category-card" style={{ background: cat.color }}>
                        <div className="explore-cat-icon">{cat.icon}</div>
                        <div className="explore-cat-name">{cat.name}</div>
                    </div>
                ))}
            </div>

            <div className="video-row-header" style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>
                <h2 className="section-title" style={{ fontSize: '1.2rem' }}>Recently trending hashtags</h2>
            </div>
            <div className="explore-hashtags">
                <span className="hashtag-chip">#comedy</span>
                <span className="hashtag-chip">#relatable</span>
                <span className="hashtag-chip">#prankwars</span>
                <span className="hashtag-chip">#desijokes</span>
                <span className="hashtag-chip">#lol</span>
            </div>
        </div>
    );
};

export default Explore;
