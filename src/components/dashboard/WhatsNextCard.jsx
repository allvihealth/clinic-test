import React from 'react';

// Helper utility resolving specific badge class color combinations for the timeline items
const getTimelineBadgeStyles = (styleKey) => {
    if (styleKey === 'w') return { background: '#FDF3E7', color: '#C97B2E' }; // Watch (Amber)
    if (styleKey === 'o') return { background: '#E8F4F7', color: '#0F4C5C' }; // Ongoing (Teal)
    return { background: '#EAF5EE', color: '#2D6A4F' }; // Retest Month Window (Green)
};

const WhatsNextCard = ({ whatsNextFeed, loading, onActionClick }) => {
    return (
        <>
            <div className="card-title">What's Next</div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#6B7280', fontSize: '13px' }}>
                    🔄 Syncing clinical objectives...
                </div>
            ) : whatsNextFeed && whatsNextFeed.length > 0 ? (
                whatsNextFeed.map((item, idx, arr) => {
                    const isLastItem = idx === arr.length - 1;
                    const badgeColors = getTimelineBadgeStyles(item.style_key);
                    
                    return (
                        <div 
                            key={item.id || idx} 
                            className="ai" 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'flex-start', 
                                gap: '12px', 
                                padding: '14px 0', 
                                borderBottom: isLastItem ? 'none' : '1px solid #EDE7DB' 
                            }}
                        >
                            <div>
                                <div 
                                    className={`at ${item.style_key}`} 
                                    style={{ 
                                        background: badgeColors.background, 
                                        color: badgeColors.color, 
                                        fontSize: '10px', 
                                        fontWeight: 700, 
                                        letterSpacing: '0.1em', 
                                        textTransform: 'uppercase', 
                                        padding: '3px 8px', 
                                        borderRadius: '4px', 
                                        whiteSpace: 'nowrap', 
                                        marginTop: '2px',
                                        textAlign: 'center',
                                        minWidth: '65px',
                                        display: 'inline-block'
                                    }}
                                >
                                    {item.type}
                                </div>
                            </div>
                            <div className="at-text" style={{ fontSize: '13px', color: '#1F2937', lineHeight: 1.5 }}>
                                {item.content}
                            </div>
                        </div>
                    );
                })
            ) : (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#6B7280', fontSize: '14px' }}>
                    Timeline synchronization loading...
                </div>
            )}

            {/* Action Bottom Controls Footer Panel */}
           
        </>
    );
};

export default WhatsNextCard;