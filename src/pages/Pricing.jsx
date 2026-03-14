import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

const plans = [
    {
        id: 'starter',
        name: 'Starter',
        emoji: '🚀',
        price: 499,
        badge: 'BASIC',
        gradient: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
        accentColor: '#38bdf8',
        glowColor: 'rgba(56, 189, 248, 0.25)',
        features: [
            { icon: '📤', text: 'Upload unlimited comedy videos' },
            { icon: '📱', text: 'Daily WhatsApp video delivery' },
            { icon: '✅', text: 'WhatsApp registered at purchase' },
            { icon: '🎭', text: 'Access to all comedy categories' },
        ],
        notIncluded: ['Facebook promotion', 'Instagram promotion'],
        cta: 'Get Started',
    },
    {
        id: 'growth',
        name: 'Growth',
        emoji: '📈',
        price: 1999,
        badge: 'POPULAR',
        gradient: 'linear-gradient(135deg, #3a1f00 0%, #0f0f0f 100%)',
        accentColor: '#ff6b00',
        glowColor: 'rgba(255, 107, 0, 0.3)',
        popular: true,
        features: [
            { icon: '📤', text: 'Upload unlimited comedy videos' },
            { icon: '📱', text: 'Daily WhatsApp video delivery' },
            { icon: '📘', text: 'Facebook promotion & boosting' },
            { icon: '📊', text: 'Reach thousands of Facebook users' },
            { icon: '🎭', text: 'Access to all comedy categories' },
        ],
        notIncluded: ['Instagram promotion'],
        cta: 'Go Growth',
    },
    {
        id: 'pro',
        name: 'Pro',
        emoji: '👑',
        price: 2999,
        badge: 'BEST VALUE',
        gradient: 'linear-gradient(135deg, #2d0045 0%, #0f0f0f 100%)',
        accentColor: '#a855f7',
        glowColor: 'rgba(168, 85, 247, 0.3)',
        features: [
            { icon: '📤', text: 'Upload unlimited comedy videos' },
            { icon: '📱', text: 'Daily WhatsApp video delivery' },
            { icon: '📘', text: 'Facebook promotion & boosting' },
            { icon: '📸', text: 'Instagram promotion & reels boost' },
            { icon: '🌐', text: 'Multi-platform exposure' },
            { icon: '🎭', text: 'Access to all comedy categories' },
        ],
        notIncluded: [],
        cta: 'Go Pro 👑',
    },
];

// Load Razorpay checkout script dynamically
const loadRazorpayScript = () =>
    new Promise((resolve) => {
        if (document.getElementById('razorpay-script')) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.id = 'razorpay-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

const PricingModal = ({ onClose, onSelectPlan }) => {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [step, setStep] = useState('plans'); // 'plans' | 'checkout' | 'processing' | 'success'
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [whatsappName, setWhatsappName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadRazorpayScript();
    }, []);

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        setError('');
        setStep('checkout');
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // 1️⃣ Load Razorpay script
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            setError('Failed to load Razorpay. Please check your internet connection.');
            setLoading(false);
            return;
        }

        // 2️⃣ Create order via our backend
        let orderData;
        try {
            const res = await fetch(`${API_BASE}/payment/create-order/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('token')
                        ? { Authorization: `Token ${localStorage.getItem('token')}` }
                        : {}),
                },
                body: JSON.stringify({
                    plan_id: selectedPlan.id,
                    whatsapp_name: whatsappName,
                    whatsapp_number: whatsappNumber,
                }),
            });
            orderData = await res.json();
            if (!res.ok) {
                setError(orderData.error || 'Could not create order. Try again.');
                setLoading(false);
                return;
            }
        } catch (err) {
            setError('Network error — make sure the backend is running.');
            setLoading(false);
            return;
        }

        setLoading(false);

        // 3️⃣ Open Razorpay checkout popup
        const options = {
            key: orderData.key_id,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'Jokes Studio',
            description: `${orderData.plan_name} Plan — Comedy Video Platform`,
            image: '', // optional logo URL
            order_id: orderData.order_id,
            prefill: {
                name: whatsappName,
                contact: whatsappNumber,
            },
            notes: {
                plan_id: orderData.plan_id,
                whatsapp_number: whatsappNumber,
            },
            theme: {
                color: selectedPlan.accentColor,
            },
            handler: async (response) => {
                // 4️⃣ Verify payment server-side
                setStep('processing');
                try {
                    const verifyRes = await fetch(`${API_BASE}/payment/verify/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(localStorage.getItem('token')
                                ? { Authorization: `Token ${localStorage.getItem('token')}` }
                                : {}),
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            plan_id: selectedPlan.id,
                            whatsapp_name: whatsappName,
                            whatsapp_number: whatsappNumber,
                        }),
                    });
                    const verifyData = await verifyRes.json();

                    if (verifyRes.ok && verifyData.success) {
                        // 5️⃣ Success — store plan locally and notify parent
                        localStorage.setItem('activePlan', JSON.stringify({
                            planId: verifyData.plan_id,
                            planName: verifyData.plan_name,
                            price: verifyData.amount,
                            whatsappNumber,
                            whatsappName,
                            paymentId: verifyData.payment_id,
                            orderId: verifyData.order_id,
                            purchasedAt: new Date().toISOString(),
                        }));
                        setStep('success');
                        setTimeout(() => {
                            onSelectPlan && onSelectPlan(verifyData);
                        }, 2800);
                    } else {
                        setStep('checkout');
                        setError(verifyData.error || 'Payment verification failed. Contact support.');
                    }
                } catch (err) {
                    setStep('checkout');
                    setError('Verification error. Please contact support with your payment ID: ' + response.razorpay_payment_id);
                }
            },
            modal: {
                ondismiss: () => {
                    setLoading(false);
                },
            },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
            setError(`Payment failed: ${response.error.description}`);
        });
        rzp.open();
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.88)',
                backdropFilter: 'blur(14px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
                overflowY: 'auto',
                animation: 'pricingFadeIn 0.3s ease',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                background: '#0a0a0a',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '28px',
                width: '100%',
                maxWidth: '980px',
                maxHeight: '95vh',
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
            }}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '1.2rem', right: '1.2rem',
                        background: 'rgba(255,255,255,0.08)', border: 'none',
                        color: '#fff', borderRadius: '50%', width: '36px', height: '36px',
                        cursor: 'pointer', fontSize: '1.1rem', zIndex: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                >✕</button>

                {/* ── STEP: PLANS ── */}
                {step === 'plans' && (
                    <div style={{ padding: '2.5rem 2rem 2.5rem' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎬</div>
                            <h2 style={{
                                fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 900,
                                background: 'linear-gradient(135deg, #ff6b00, #a855f7)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                marginBottom: '0.5rem',
                            }}>Choose Your Creator Plan</h2>
                            <p style={{ color: '#888', fontSize: '1rem' }}>
                                Unlock video uploads & get your content promoted across platforms
                            </p>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                            gap: '1.25rem',
                        }}>
                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    style={{
                                        background: plan.gradient, borderRadius: '20px',
                                        position: 'relative', overflow: 'hidden',
                                        border: plan.popular ? `2px solid ${plan.accentColor}` : '1px solid rgba(255,255,255,0.08)',
                                        boxShadow: `0 0 ${plan.popular ? 40 : 20}px ${plan.glowColor}`,
                                        transform: plan.popular ? 'scale(1.03)' : 'scale(1)',
                                        transition: 'transform 0.3s, box-shadow 0.3s',
                                        cursor: 'pointer',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = plan.popular ? 'scale(1.05)' : 'scale(1.02)';
                                        e.currentTarget.style.boxShadow = `0 0 50px ${plan.glowColor}`;
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = plan.popular ? 'scale(1.03)' : 'scale(1)';
                                        e.currentTarget.style.boxShadow = `0 0 ${plan.popular ? 40 : 20}px ${plan.glowColor}`;
                                    }}
                                >
                                    {/* Glow orb */}
                                    <div style={{
                                        position: 'absolute', top: '-40px', right: '-40px',
                                        width: '160px', height: '160px',
                                        background: plan.accentColor, borderRadius: '50%',
                                        filter: 'blur(60px)', opacity: 0.2, pointerEvents: 'none',
                                    }} />
                                    <div style={{ padding: '1.8rem 1.5rem' }}>
                                        {/* Badge */}
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                            background: `${plan.accentColor}22`, border: `1px solid ${plan.accentColor}55`,
                                            color: plan.accentColor, borderRadius: '50px', padding: '4px 12px',
                                            fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '1rem',
                                        }}>
                                            {plan.popular && <span>🔥</span>}{plan.badge}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '2rem' }}>{plan.emoji}</span>
                                            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>{plan.name}</h3>
                                        </div>
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <span style={{ fontSize: '0.95rem', color: '#aaa', fontWeight: 600 }}>₹</span>
                                            <span style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-2px' }}>
                                                {plan.price.toLocaleString()}
                                            </span>
                                            <span style={{ fontSize: '0.85rem', color: '#888', marginLeft: '4px' }}>/month</span>
                                        </div>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                                            {plan.features.map((feat, idx) => (
                                                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.88rem', color: '#e0e0e0' }}>
                                                    <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '1px' }}>{feat.icon}</span>
                                                    <span>{feat.text}</span>
                                                </li>
                                            ))}
                                            {plan.notIncluded.map((feat, idx) => (
                                                <li key={`no-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#555', textDecoration: 'line-through' }}>
                                                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>✗</span>
                                                    <span>{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => handleSelectPlan(plan)}
                                            style={{
                                                width: '100%', padding: '14px',
                                                background: plan.popular
                                                    ? `linear-gradient(135deg, ${plan.accentColor}, ${plan.accentColor}cc)`
                                                    : `${plan.accentColor}22`,
                                                border: `1.5px solid ${plan.accentColor}`,
                                                color: plan.popular ? '#fff' : plan.accentColor,
                                                borderRadius: '14px', fontSize: '0.95rem', fontWeight: 800,
                                                cursor: 'pointer', transition: 'all 0.2s',
                                                boxShadow: plan.popular ? `0 8px 24px ${plan.glowColor}` : 'none',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = `linear-gradient(135deg, ${plan.accentColor}, ${plan.accentColor}cc)`;
                                                e.currentTarget.style.color = '#fff';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={e => {
                                                if (!plan.popular) {
                                                    e.currentTarget.style.background = `${plan.accentColor}22`;
                                                    e.currentTarget.style.color = plan.accentColor;
                                                }
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >{plan.cta}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#555', fontSize: '0.8rem' }}>
                            🔒 Secured by Razorpay · Cancel anytime · Your WhatsApp number collected at checkout
                        </p>
                    </div>
                )}

                {/* ── STEP: CHECKOUT ── */}
                {step === 'checkout' && selectedPlan && (
                    <div style={{ padding: '2.5rem 2rem' }}>
                        <button
                            onClick={() => { setStep('plans'); setError(''); }}
                            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1.5rem', padding: 0 }}
                        >← Back to plans</button>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                            {/* Order Summary */}
                            <div>
                                <h3 style={{ color: '#fff', fontWeight: 800, marginBottom: '1.5rem', fontSize: '1.3rem' }}>Order Summary</h3>
                                <div style={{
                                    background: selectedPlan.gradient, borderRadius: '20px', padding: '1.5rem',
                                    border: `1px solid ${selectedPlan.accentColor}44`,
                                    boxShadow: `0 0 30px ${selectedPlan.glowColor}`,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.2rem' }}>
                                        <span style={{ fontSize: '2.2rem' }}>{selectedPlan.emoji}</span>
                                        <div>
                                            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem' }}>{selectedPlan.name} Plan</div>
                                            <div style={{ color: selectedPlan.accentColor, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em' }}>{selectedPlan.badge}</div>
                                        </div>
                                    </div>
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                        {selectedPlan.features.map((f, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                                <span>{f.icon}</span><span>{f.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#aaa' }}>Total</span>
                                        <span style={{ color: '#fff', fontWeight: 900, fontSize: '1.5rem' }}>₹{selectedPlan.price.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Razorpay badge */}
                                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#555', fontSize: '0.78rem' }}>
                                    <span>🔒</span>
                                    <span>Secured & powered by <strong style={{ color: '#3395ff' }}>Razorpay</strong> · UPI, Cards, Net Banking accepted</span>
                                </div>
                            </div>

                            {/* WhatsApp Form */}
                            <div>
                                <h3 style={{ color: '#fff', fontWeight: 800, marginBottom: '1.5rem', fontSize: '1.3rem' }}>Your WhatsApp Details</h3>
                                <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '6px' }}>
                                            YOUR NAME *
                                        </label>
                                        <input
                                            type="text" value={whatsappName}
                                            onChange={e => setWhatsappName(e.target.value)}
                                            placeholder="e.g. Rahul Sharma" required
                                            style={{
                                                width: '100%', padding: '14px 16px',
                                                background: 'rgba(255,255,255,0.06)',
                                                border: `1.5px solid ${whatsappName ? selectedPlan.accentColor + '80' : 'rgba(255,255,255,0.12)'}`,
                                                borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none',
                                                transition: 'border-color 0.2s', boxSizing: 'border-box',
                                            }}
                                            onFocus={e => e.target.style.borderColor = selectedPlan.accentColor}
                                            onBlur={e => e.target.style.borderColor = whatsappName ? selectedPlan.accentColor + '80' : 'rgba(255,255,255,0.12)'}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '6px' }}>
                                            WHATSAPP NUMBER *
                                        </label>
                                        <input
                                            type="tel" value={whatsappNumber}
                                            onChange={e => setWhatsappNumber(e.target.value)}
                                            placeholder="+91 98765 43210" required
                                            style={{
                                                width: '100%', padding: '14px 16px',
                                                background: 'rgba(255,255,255,0.06)',
                                                border: `1.5px solid ${whatsappNumber ? selectedPlan.accentColor + '80' : 'rgba(255,255,255,0.12)'}`,
                                                borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none',
                                                transition: 'border-color 0.2s', boxSizing: 'border-box',
                                            }}
                                            onFocus={e => e.target.style.borderColor = selectedPlan.accentColor}
                                            onBlur={e => e.target.style.borderColor = whatsappNumber ? selectedPlan.accentColor + '80' : 'rgba(255,255,255,0.12)'}
                                        />
                                        <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '6px' }}>
                                            Include country code (e.g. +91 for India). Daily comedy videos sent here.
                                        </p>
                                    </div>

                                    <div style={{
                                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '12px', padding: '12px 14px',
                                        display: 'flex', gap: '10px', alignItems: 'flex-start',
                                    }}>
                                        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>📱</span>
                                        <p style={{ color: '#888', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>
                                            By subscribing, you agree to receive at least <strong style={{ color: '#ccc' }}>1 comedy video per day</strong> on the WhatsApp number provided. Unsubscribe anytime.
                                        </p>
                                    </div>

                                    {error && (
                                        <div style={{
                                            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                                            borderRadius: '12px', padding: '10px 14px',
                                            color: '#ef4444', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center',
                                        }}>
                                            <span>⚠️</span> {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading || !whatsappName || !whatsappNumber}
                                        style={{
                                            padding: '16px',
                                            background: (loading || !whatsappName || !whatsappNumber)
                                                ? 'rgba(255,255,255,0.08)'
                                                : `linear-gradient(135deg, ${selectedPlan.accentColor}, ${selectedPlan.accentColor}aa)`,
                                            border: 'none',
                                            color: (loading || !whatsappName || !whatsappNumber) ? '#666' : '#fff',
                                            borderRadius: '14px', fontSize: '1rem', fontWeight: 800,
                                            cursor: (loading || !whatsappName || !whatsappNumber) ? 'not-allowed' : 'pointer',
                                            boxShadow: (!loading && whatsappName && whatsappNumber) ? `0 8px 24px ${selectedPlan.glowColor}` : 'none',
                                            transition: 'all 0.2s',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        }}
                                    >
                                        {loading ? (
                                            <>
                                                <span style={{
                                                    width: '20px', height: '20px', border: '2px solid #666',
                                                    borderTopColor: '#fff', borderRadius: '50%',
                                                    animation: 'rzpSpin 0.8s linear infinite', display: 'inline-block',
                                                }} />
                                                Creating Order...
                                            </>
                                        ) : (
                                            <>💳 Pay ₹{selectedPlan.price.toLocaleString()} via Razorpay</>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>

                        <style>{`
                            @media (max-width: 600px) {
                                .rzp-checkout-grid { grid-template-columns: 1fr !important; }
                            }
                        `}</style>
                    </div>
                )}

                {/* ── STEP: PROCESSING (verifying payment) ── */}
                {step === 'processing' && (
                    <div style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                        <div style={{
                            width: '80px', height: '80px',
                            border: '4px solid rgba(255,255,255,0.1)',
                            borderTopColor: selectedPlan?.accentColor || '#ff6b00',
                            borderRadius: '50%',
                            animation: 'rzpSpin 0.9s linear infinite',
                            margin: '0 auto 1.5rem',
                        }} />
                        <h3 style={{ color: '#fff', fontWeight: 800, marginBottom: '0.5rem' }}>Verifying Payment…</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>Please wait, do not close this window.</p>
                    </div>
                )}

                {/* ── STEP: SUCCESS ── */}
                {step === 'success' && selectedPlan && (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                        <div style={{
                            width: '90px', height: '90px',
                            background: `linear-gradient(135deg, ${selectedPlan.accentColor}, ${selectedPlan.accentColor}88)`,
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2.5rem', margin: '0 auto 1.5rem',
                            boxShadow: `0 0 40px ${selectedPlan.glowColor}`,
                            animation: 'rzpScaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        }}>🎉</div>
                        <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.8rem', marginBottom: '0.5rem' }}>
                            Payment Successful!
                        </h2>
                        <p style={{ color: '#888', marginBottom: '0.5rem' }}>
                            Welcome to the <strong style={{ color: selectedPlan.accentColor }}>{selectedPlan.name} Plan</strong>
                        </p>
                        <p style={{ color: '#666', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
                            📱 Daily comedy videos will be delivered to your WhatsApp.<br />
                            You can now upload your comedy videos!
                        </p>
                        <div style={{
                            background: `${selectedPlan.accentColor}15`,
                            border: `1px solid ${selectedPlan.accentColor}33`,
                            borderRadius: '16px', padding: '1rem 1.5rem', display: 'inline-block',
                        }}>
                            <p style={{ color: selectedPlan.accentColor, fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>
                                ✅ Redirecting you to upload your first video…
                            </p>
                        </div>
                    </div>
                )}

                <style>{`
                    @keyframes rzpSpin    { to { transform: rotate(360deg); } }
                    @keyframes rzpScaleIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                    @keyframes pricingFadeIn { from { opacity: 0; } to { opacity: 1; } }
                `}</style>
            </div>
        </div>
    );
};

export default PricingModal;
