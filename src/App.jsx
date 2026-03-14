import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import './App.css'

const isDirectVideo = (url) => {
  if (!url) return false;
  return String(url).toLowerCase().match(/\.(mp4|webm|ogg|mov)$|^https:\/\/assets\.mixkit\.co/i);
};
import LikeButton from './components/LikeButton.jsx'
import VideoModal from './components/VideoModal.jsx'
import Standup from './pages/Standup.jsx'
import Meme from './pages/Meme.jsx'
import NewHot from './pages/NewHot.jsx'
import Popular from './pages/Popular.jsx'
import Upload from './pages/Upload.jsx'
import Explore from './pages/Explore.jsx'
import Profile from './pages/Profile.jsx'
import Saved from './pages/Saved.jsx'
import {
  loginUser, signupUser, getProfile, getHomeData, checkVideoApprovals,
  registerViewer, partnerSignup, partnerApply, checkPartnerStatus,
  confirmPartnerOTP, saveVideo, getActiveSubscription, getNotifications,
  getPopularData, getStandupData, getMemesData, getNewHotData
} from './api'
import logoVideo from './assets/logo.mp4'

function App() {
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      // For hero, we might want to mute autoplay or handle differently
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=1&loop=1&playlist=${match[2]}&controls=0&rel=0`;
    }
    return null;
  };

  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState('dark');
  const posterRef = useRef(null);
  const recommendedRef = useRef(null);
  const trendingRef = useRef(null);
  const standupHighlightRef = useRef(null);
  const viralMemesHomeRef = useRef(null);
  const comediansHomeRef = useRef(null);
  const mostWatchedRef = useRef(null);
  const categoriesHomeRef = useRef(null);

  const [isHovered, setIsHovered] = useState(false);
  const [isRecHovered, setIsRecHovered] = useState(false);
  const [isTrendHover, setIsTrendHover] = useState(false);
  const [isStandHighlightHover, setIsStandHighlightHover] = useState(false);
  const [isViralMemeHover, setIsViralMemeHover] = useState(false);
  const [isComediansHover, setIsComediansHover] = useState(false);
  const [isMostWatchedHover, setIsMostWatchedHover] = useState(false);
  const [isCategoriesHover, setIsCategoriesHover] = useState(false);
  const [showHomeCategories, setShowHomeCategories] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPopup, setShowInstallPopup] = useState(false);

  const [heroIndex, setHeroIndex] = useState(0);
  const [activeNav, setActiveNav] = useState('Popular');
  const [currentLang, setCurrentLang] = useState('English');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showNotifyMenu, setShowNotifyMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showBottomProfile, setShowBottomProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [loginStep, setLoginStep] = useState('login'); // 'login', 'signup', 'otp'
  const [activeBottomNav, setActiveBottomNav] = useState('Home');
  const [showCustomInstallModal, setShowCustomInstallModal] = useState(false);
  const [installHint, setInstallHint] = useState('');

  // --- NEW GATEWAY FLOW STATES ---
  const [hasEntered, setHasEntered] = useState(() => !!localStorage.getItem('viewerInfo'));
  const [viewerInfo, setViewerInfo] = useState({ name: '', whatsapp: '' });
  const [partnerStep, setPartnerStep] = useState('none'); // 'none', 'auth', 'plans', 'signup', 'otp', 'payment', 'pending', 'payment-pending', 'verify_mobile'
  const [partnerModalAuthMode, setPartnerModalAuthMode] = useState('signup'); // 'signup' or 'login'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [partnerSignupData, setPartnerSignupData] = useState({ email: '', mobile: '', password: '', confirmPassword: '' });
  const [otpValue, setOtpValue] = useState('');
  const [otpArray, setOtpArray] = useState(['', '', '', '', '', '']);
  const [paymentMethod, setPaymentMethod] = useState('qr'); // 'qr' or 'upi'
  const [showStickyBanner, setShowStickyBanner] = useState(false);
  const [hasDismissedSticky, setHasDismissedSticky] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [selectedVideoHome, setSelectedVideoHome] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    videos: [],
    creators: [],
    memes: []
  });
  const [searchPool, setSearchPool] = useState({
    videos: [],
    creators: [],
    memes: []
  });

  // Auth States
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authError, setAuthError] = useState('');
  const [authUser, setAuthUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activePlan, setActivePlan] = useState(() => {
    const stored = localStorage.getItem('activePlan');
    try { return stored ? JSON.parse(stored) : null; } catch { return null; }
  });
  const [partnerStatus, setPartnerStatus] = useState('none'); // 'none', 'pending', 'completed'
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [liveNotifications, setLiveNotifications] = useState([]);

  // Video approval notifications state
  const [approvalNotifications, setApprovalNotifications] = useState([]); // array of approved video objects
  const [currentApprovalIdx, setCurrentApprovalIdx] = useState(0);
  const [partnerSuccessInfo, setPartnerSuccessInfo] = useState(() => {
    const stored = localStorage.getItem('partnerSuccess');
    return stored ? JSON.parse(stored) : null;
  });

  const savePartnerSuccess = (info) => {
    if (info) {
      localStorage.setItem('partnerSuccess', JSON.stringify(info));
    } else {
      localStorage.removeItem('partnerSuccess');
    }
    setPartnerSuccessInfo(info);
  };

  // Dynamic Home Data
  const [homeHeroVideos, setHomeHeroVideos] = useState([]);
  const [homeTrending, setHomeTrending] = useState([]);
  const [homeStandup, setHomeStandup] = useState([]);
  const [homeMostWatched, setHomeMostWatched] = useState([]);
  const [homeMemes, setHomeMemes] = useState([]);
  const [homeCreators, setHomeCreators] = useState([]);
  const [isLoadingHome, setIsLoadingHome] = useState(true);
  const [modalConfig, setModalConfig] = useState({ startWithComments: false });
  const [sharingItem, setSharingItem] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const installTargetUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?install_app=1`
    : 'https://jokes.studio/?install_app=1';

  const normalizeText = (value) => String(value || '').toLowerCase().trim();

  const toArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

  const createSearchPool = (homeData, popularData, standupData, memesData, newHotData) => {
    const uniqueVideos = new Map();
    const uniqueCreators = new Map();

    const addVideos = (list) => {
      toArray(list).forEach((video) => {
        const key = video?.id ?? `${video?.title || 'untitled'}-${video?.page || ''}-${video?.section || ''}`;
        if (!uniqueVideos.has(key)) uniqueVideos.set(key, video);
      });
    };

    const addCreators = (list) => {
      toArray(list).forEach((creator) => {
        const key = creator?.id ?? creator?.user ?? creator?.name;
        if (!key || uniqueCreators.has(key)) return;
        uniqueCreators.set(key, creator);
      });
    };

    // Home
    addVideos(homeData?.hero);
    addVideos(homeData?.trending);
    addVideos(homeData?.standup);
    addVideos(homeData?.most_watched);
    addVideos(homeData?.memes);
    addCreators(homeData?.popular_creators);

    // Popular
    addVideos(popularData?.trending);
    addVideos(popularData?.standup);
    addVideos(popularData?.memes);
    addVideos(popularData?.skits);
    addCreators(popularData?.popular_creators);

    // Standup
    addVideos(standupData?.featured ? [standupData.featured] : []);
    addVideos(standupData?.trending);
    addVideos(standupData?.latest);
    addCreators(standupData?.creators);

    // Memes
    addVideos(memesData?.trending);
    addVideos(memesData?.viral);
    addVideos(memesData?.reaction);
    addVideos(memesData?.animal);
    addCreators(memesData?.creators);

    // New & Hot
    addVideos(newHotData?.rising);
    addVideos(newHotData?.latest);
    addVideos(newHotData?.picks);
    addCreators(newHotData?.creators);

    const allVideos = Array.from(uniqueVideos.values());
    const memesOnly = allVideos.filter((video) => {
      const page = normalizeText(video?.page);
      const section = normalizeText(video?.section);
      return page === 'memes' || ['memes', 'viral', 'reaction', 'animal'].includes(section);
    });

    return {
      videos: allVideos,
      creators: Array.from(uniqueCreators.values()),
      memes: memesOnly
    };
  };

  const openVideoModal = (video, options = {}) => {
    setSelectedVideoHome(video);
    setModalConfig({ startWithComments: !!options.startWithComments });
  };

  const handleHomeLoadMore = () => {
    if (showHomeCategories) return;
    setShowHomeCategories(true);
    setTimeout(() => {
      categoriesHomeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  // Resend OTP Timer Logic
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const startResendTimer = () => setResendTimer(30);

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    const mobile = partnerSignupData.mobile || localStorage.getItem('partnerMobile');
    const token = localStorage.getItem('token');

    if (!mobile) {
      setPartnerStep('verify_mobile');
      return;
    }

    try {
      const res = await requestPartnerOTP(token, mobile);
      if (res.message) {
        startResendTimer();
        alert("A new OTP has been sent to your mobile number.");
      } else {
        alert(res.error || "Failed to resend OTP.");
      }
    } catch (err) {
      alert("Something went wrong while resending OTP.");
    }
  };

  const syncSubscription = async (token) => {
    if (!token) return;
    try {
      const data = await getActiveSubscription(token);
      if (!data.has_plan) {
        localStorage.removeItem('activePlan');
        setActivePlan(null);
      } else {
        const plan = {
          planId: data.plan_id,
          planName: data.plan_name,
          amount: data.amount,
          expiresAt: data.expires_at,
          daysLeft: data.days_left
        };
        localStorage.setItem('activePlan', JSON.stringify(plan));
        setActivePlan(plan);
      }
    } catch (err) {
      console.error("Subscription sync failed", err);
    }
  };

  const formatNotificationTime = (isoTime) => {
    if (!isoTime) return '';
    const then = new Date(isoTime).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - then);
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getNotificationVisual = (type) => {
    if (type === 'follow') return { icon: '👤', bg: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' };
    if (type === 'comment') return { icon: '💬', bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' };
    if (type === 'new_creator') return { icon: '🎤', bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' };
    return { icon: '🔥', bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
  };

  // ═══════════════════════════════════════════════════════════════
  // NEW: Check subscription status and resume partner flow properly
  // ═══════════════════════════════════════════════════════════════
  const handlePartnerFlowEntry = async (token) => {
    try {
      // 1st: Check if user is already an approved partner
      const partnerRes = await checkPartnerStatus(token);
      if (partnerRes?.status === 'pending') {
        setPartnerStep('pending');
        return;
      } else if (partnerRes?.status === 'completed' || partnerRes?.is_partner) {
        setPartnerStep('none');
        savePartnerSuccess({ message: partnerRes?.message || "Your partnership is now active!" });
        return;
      }

      // 2nd: Check if user has an active/pending subscription
      const subRes = await getActiveSubscription(token);

      if (subRes?.status === 'pending') {
        // User has paid but not approved yet → Resume payment/pending step
        console.log('Resuming from pending subscription:', subRes);

        // Pre-fill the form with existing WhatsApp data
        setPartnerSignupData(prev => ({
          ...prev,
          mobile: subRes.whatsapp_number || prev?.mobile || '',
          email: authUser?.email || '',
        }));

        // Find the matching plan based on amount
        const matchedPlan = [
          { id: 'starter', name: 'Starter', price: '499', features: ['1 Video/Day', 'Standard Support'] },
          { id: 'growth', name: 'Growth', price: '1999', features: ['3 Videos/Day', 'Priority Approval'] },
          { id: 'pro', name: 'Pro', price: '2999', features: ['Unlimited Videos', 'Featured Badge'] },
        ].find(p => parseInt(p.price) === subRes.amount);

        if (matchedPlan) {
          setSelectedPlan(matchedPlan);
        }

        // Show confirmation that we found pending payment
        setPartnerStep('payment-pending');
        return;
      }

      // 3rd: No partner status, no subscription → Show plans
      // Clear any saved local session data since subscription takes precedence
      localStorage.removeItem('partner_session_step');
      localStorage.removeItem('partner_session_plan');
      setPartnerStep('plans');

    } catch (err) {
      console.error('Error checking partner flow:', err);
      // Fallback to plans if error
      setPartnerStep('plans');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const data = await loginUser(authUsername, authPassword);
      localStorage.setItem('token', data.token);
      const userProfile = await getProfile(data.token);
      setAuthUser(userProfile);
      setIsLoggedIn(true);
      if (data.activePlan) {
        localStorage.setItem('activePlan', JSON.stringify(data.activePlan));
        setActivePlan(data.activePlan);
      }
      setShowLoginPopup(false);
      setAuthUsername('');
      setAuthPassword('');
      setSignupSuccess(false);
      navigate('/'); // Redirect to dashboard after login
      await syncSubscription(data.token);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handlePartnerModalLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const data = await loginUser(authUsername, authPassword);
      localStorage.setItem('token', data.token);
      const userProfile = await getProfile(data.token);
      setAuthUser(userProfile);
      setIsLoggedIn(true);
      if (data.activePlan) {
        localStorage.setItem('activePlan', JSON.stringify(data.activePlan));
        setActivePlan(data.activePlan);
      }
      setAuthUsername('');
      setAuthPassword('');
      setSignupSuccess(false);
      await syncSubscription(data.token);

      // AFTER SUCCESSFUL LOGIN IN MODAL:
      // If partner already approved, open partner dashboard directly.
      const partnerRes = await checkPartnerStatus(data.token);
      if (partnerRes?.status === 'completed' || partnerRes?.is_partner) {
        setPartnerStatus('completed');
        setPartnerStep('none');
        setActiveBottomNav('Upload');
        navigate('/upload');
        return;
      }

      // Pending partner -> show pending status.
      if (partnerRes?.status === 'pending') {
        setPartnerStatus('pending');
        setPartnerStep('pending');
        return;
      }

      // New user / not yet partner -> continue onboarding flow.
      await handlePartnerFlowEntry(data.token);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signupUser(authUsername, authEmail, authPassword);
      // Instead of logging in, show login page
      setSignupSuccess(true);
      setLoginStep('login');
      // Keep username for easy login, clear others
      setAuthEmail('');
      setAuthPassword('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // --- GATEWAY & PARTNER FLOW HELPERS ---
  const handleGatewaySubmit = async (e) => {
    e.preventDefault();
    if (!viewerInfo.name || !viewerInfo.whatsapp) return;
    try {
      await registerViewer(viewerInfo.name, viewerInfo.whatsapp);
      localStorage.setItem('viewerInfo', JSON.stringify(viewerInfo));
      setHasEntered(true);
    } catch (err) {
      console.error("Gateway error:", err);
      // Still let them in for UX, but log error
      setHasEntered(true);
    }
  };

  const handlePartnerSignup = async (e) => {
    e.preventDefault();
    if (partnerSignupData.password !== partnerSignupData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      const res = await partnerSignup(
        partnerSignupData.email,
        partnerSignupData.mobile,
        partnerSignupData.password
      );
      if (res.error) {
        alert(res.error);
      } else {
        localStorage.setItem('token', res.token);
        // Persist contact info so it's available on the payment step
        localStorage.setItem('partnerEmail', partnerSignupData.email);
        localStorage.setItem('partnerMobile', partnerSignupData.mobile);
        setIsLoggedIn(true);
        // OTP is now sent via MSG91

        // USER REQUEST: After signup, go to OTP verification
        setPartnerStep('otp');
        startResendTimer();
      }
    } catch (err) {
      alert("Signup failed");
    }
  };

  const handlePartnerApply = async () => {
    // Move to pending IMMEDIATELY — user should see feedback right away
    setPartnerStep('pending');

    const token = localStorage.getItem('token');
    try {
      const res = await partnerApply(token, {
        email: partnerSignupData.email || authUser?.email || localStorage.getItem('partnerEmail') || '',
        mobile: partnerSignupData.mobile || localStorage.getItem('partnerMobile') || '',
        plan_name: selectedPlan?.name || '',
        price: selectedPlan?.price || 0
      });
      if (res?.error) {
        console.warn('Partner apply note:', res.error);
        // Still stay on pending — admin can manually verify payment
      }
    } catch (err) {
      console.error('Partner apply background error:', err);
      // Stay on pending regardless so UX is not broken
    }
  };

  const handleOtpBoxChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpArray];
    newOtp[index] = value.slice(-1);
    setOtpArray(newOtp);
    setOtpValue(newOtp.join(''));

    // Auto-focus next
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const renderPartnerSuccessModal = () => {
    if (!partnerSuccessInfo) return null;
    return (
      <div className="modal-overlay" style={{ zIndex: 1000001, backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="success-modal-v3 animate-celebration">
          <div className="success-glow" />

          <div className="celebration-icon-v3 float-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
            <div className="check-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
          </div>

          <h2 className="success-title-v3">Partner Verified!</h2>
          <p className="success-msg-v3">
            {partnerSuccessInfo.message || "Your partnership is now active!"}
          </p>

          <div className="feature-box-v3">
            <div className="feature-icon-v3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
            </div>
            <div className="feature-text-v3">
              <h4>Creator Dashboard Active</h4>
              <p>Access it via the upload button anytime!</p>
            </div>
          </div>

          <button
            className="success-action-btn"
            onClick={() => {
              savePartnerSuccess(null);
              navigate('/upload');
            }}
          >
            <span>Start Your Journey</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      </div>
    );
  };

  const renderGateway = () => (
    <div className="gateway-overlay-v2">
      <div className="gateway-card-v2">
        <div className="gateway-badge">💚 FREE • 100% FUNNY</div>
        <h1 className="gateway-logo-v2">Laugh with Jokes Studio</h1>
        <p className="gateway-msg-v2">
          Join thousands of comedy lovers! Get a fresh, hilarious video delivered to your WhatsApp <strong>every single day</strong>. Completely free. Cancel anytime.
        </p>
        <form onSubmit={handleGatewaySubmit} className="gateway-form-v2">
          <div className="input-group">
            <span className="input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </span>
            <input
              type="text"
              placeholder="Your Full Name"
              required
              value={viewerInfo.name}
              onChange={(e) => setViewerInfo({ ...viewerInfo, name: e.target.value })}
            />
          </div>
          <div className="input-group">
            <span className="input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </span>
            <input
              type="tel"
              placeholder="WhatsApp Number (with country code)"
              required
              value={viewerInfo.whatsapp}
              onChange={(e) => setViewerInfo({ ...viewerInfo, whatsapp: e.target.value })}
            />
          </div>
          <button type="submit" className="premium-action-btn gateway-btn-enhanced">
            <span>🎉 SUBSCRIBE FOR FREE</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </form>
        <div className="gateway-features">
          <div className="feature-item">🎬 <span>Funny video daily</span></div>
          <div className="feature-item">💜 <span>100% Free forever</span></div>
          <div className="feature-item">⏸️ <span>Unsubscribe anytime</span></div>
        </div>
        <p className="gateway-footer">✨ No spam • No ads • Just pure comedy</p>
      </div>
    </div>
  );

  const renderPartnerFlow = () => {
    if (partnerStep === 'none') return null;

    return (
      <div className="modal-overlay" onClick={() => setPartnerStep('none')}>
        <div className={`modal-content partner-modal partner-modal-${partnerStep}`} onClick={e => e.stopPropagation()}>
          <button className="modal-close-v3" onClick={() => setPartnerStep('none')}>×</button>

          {partnerStep === 'auth' && (
            <div className="partner-auth-container animate-fade-in">
              {partnerModalAuthMode === 'signup' ? (
                <div className="partner-signup-view">
                  <h2>Join as a Partner</h2>
                  <p className="auth-subtitle">Create your account to start your professional comedy journey.</p>
                  <form onSubmit={handlePartnerSignup} className="partner-auth-form">
                    <div className="input-group">
                      <span className="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      </span>
                      <input type="email" placeholder="Email Address" required onChange={e => setPartnerSignupData({ ...partnerSignupData, email: e.target.value })} />
                    </div>
                    <div className="input-group">
                      <span className="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      </span>
                      <input type="tel" placeholder="Mobile Number" required onChange={e => setPartnerSignupData({ ...partnerSignupData, mobile: e.target.value })} />
                    </div>
                    <div className="input-group">
                      <span className="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      </span>
                      <input type="password" placeholder="Create Password" required onChange={e => setPartnerSignupData({ ...partnerSignupData, password: e.target.value })} />
                    </div>
                    <div className="input-group">
                      <span className="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                      </span>
                      <input type="password" placeholder="Confirm Password" required onChange={e => setPartnerSignupData({ ...partnerSignupData, confirmPassword: e.target.value })} />
                    </div>
                    <button type="submit" className="premium-action-btn">
                      <span>VERIFY OTP</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </button>
                  </form>
                  <div className="auth-switch">
                    Already a Partner? <button className="text-btn" onClick={() => setPartnerModalAuthMode('login')}>Login here</button>
                  </div>
                </div>
              ) : (
                <div className="partner-login-view">
                  <h2>Welcome Back</h2>
                  <p className="auth-subtitle">Login to access your high-performance partner dashboard.</p>
                  <form onSubmit={handlePartnerModalLogin} className="partner-auth-form">
                    <div className="input-group">
                      <span className="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      </span>
                      <input
                        type="text"
                        placeholder="Username or Email"
                        value={authUsername}
                        onChange={(e) => setAuthUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <span className="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      </span>
                      <input
                        type="password"
                        placeholder="Password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        required
                      />
                    </div>
                    {authError && <p className="error-msg" style={{ color: '#ff3d00', fontSize: '0.85rem', margin: '0.5rem 0' }}>{authError}</p>}
                    <button type="submit" className="premium-action-btn">
                      <span>Access Dashboard</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </button>
                  </form>
                  <div className="auth-switch">
                    New here? <button className="text-btn" onClick={() => setPartnerModalAuthMode('signup')}>Create Account</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {partnerStep === 'plans' && (
            <div className="partner-plans animate-fade-in">
              <div className="partner-flow-header">
                <h2>Choose Your Growth Plan</h2>
                <p>Select a professional plan that fits your comedy career goals.</p>
              </div>
              <div className="plans-grid">
                {[
                  { id: 'basic', name: 'Basic', price: '499', features: ['1 Video/Day', 'Email Support', 'Standard Dashboard'], icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> },
                  { id: 'pro', name: 'Pro', price: '1999', features: ['5 Videos/Day', 'Priority Approval', 'Advanced Analytics'], icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>, popular: true },
                  { id: 'ultimate', name: 'Ultimate', price: '2999', features: ['Unlimited Videos', 'Featured Badge', 'Dedicated Manager'], icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> },
                ].map(plan => (
                  <div key={plan.name} className={`plan-card-v2 ${plan.popular ? 'popular' : ''}`}>
                    {plan.popular && <div className="popular-tag">Most Popular</div>}
                    <div className="plan-icon">{plan.icon}</div>
                    <h3>{plan.name}</h3>
                    <div className="plan-price">
                      <span className="currency">₹</span>
                      <span className="amount">{plan.price}</span>
                      <span className="period">/month</span>
                    </div>
                    <ul className="plan-features">
                      {plan.features.map(f => (
                        <li key={f}>
                          <span className="feature-tick">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button className="plan-select-btn" onClick={() => {
                      setSelectedPlan(plan);
                      setPartnerStep('payment');
                    }}>
                      Select {plan.name} Plan
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {partnerStep === 'verify_mobile' && (
            <div className="partner-auth-container animate-fade-in">
              <div className="partner-flow-header">
                <h2>Mobile Verification</h2>
                <p>We need to verify your WhatsApp number to secure your creator identity.</p>
              </div>
              <form className="partner-auth-form" onSubmit={async (e) => {
                e.preventDefault();
                const mobile = e.target.mobile.value;
                const token = localStorage.getItem('token');
                if (!mobile) return;

                // Show loading state on button
                const btn = e.target.querySelector('button');
                const orig = btn.innerHTML;
                btn.innerHTML = '<span>Sending Code...</span>';
                btn.disabled = true;

                try {
                  const res = await requestPartnerOTP(token, mobile);
                  if (res.message) {
                    setPartnerSignupData({ ...partnerSignupData, mobile });
                    setPartnerStep('otp');
                    startResendTimer();
                  } else {
                    alert(res.error || "Failed to send OTP. Please try again.");
                    btn.innerHTML = orig;
                    btn.disabled = false;
                  }
                } catch (err) {
                  alert("Something went wrong");
                  btn.innerHTML = orig;
                  btn.disabled = false;
                }
              }}>
                <div className="input-group">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  </span>
                  <input type="tel" name="mobile" placeholder="WhatsApp Number" required />
                </div>
                <button type="submit" className="premium-action-btn">
                  <span>Send Verification Code</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
              </form>
              <button className="back-text-btn" onClick={() => setPartnerStep('plans')}>← Back to Plans</button>
            </div>
          )}

          {partnerStep === 'signup' && (
            <div className="partner-signup">
              <h2>Create Partner Account</h2>
              <form onSubmit={handlePartnerSignup}>
                <input type="email" placeholder="Email ID" required onChange={e => setPartnerSignupData({ ...partnerSignupData, email: e.target.value })} />
                <input type="tel" placeholder="Mobile Number" required onChange={e => setPartnerSignupData({ ...partnerSignupData, mobile: e.target.value })} />
                <input type="password" placeholder="Password" required onChange={e => setPartnerSignupData({ ...partnerSignupData, password: e.target.value })} />
                <input type="password" placeholder="Confirm Password" required onChange={e => setPartnerSignupData({ ...partnerSignupData, confirmPassword: e.target.value })} />
                <button type="submit">Verify Mobile</button>
              </form>
            </div>
          )}

          {partnerStep === 'otp' && (
            <div className="partner-auth-container animate-fade-in">
              <div className="partner-flow-header">
                <h2>Enter Secure OTP</h2>
                <p>We've sent a 6-digit code to <strong>{partnerSignupData.mobile || localStorage.getItem('partnerMobile')}</strong></p>
              </div>

              <div className="otp-box-container-v2">
                {otpArray.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    className={`otp-digit-v2 ${digit ? 'filled' : ''}`}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpBoxChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              <button
                className="premium-action-btn"
                style={{ marginTop: '2rem' }}
                onClick={async (e) => {
                  const btn = e.currentTarget;
                  const originalContent = btn.innerHTML;
                  btn.innerHTML = "<span>Verifying Security Code...</span>";
                  btn.disabled = true;
                  try {
                    const mobile = partnerSignupData.mobile || localStorage.getItem('partnerMobile');
                    const res = await confirmPartnerOTP(mobile, otpValue);
                    if (res.success) {
                      setPartnerStep('plans');
                    } else {
                      alert(res.error || "Invalid OTP. Please try again.");
                      btn.innerHTML = originalContent;
                      btn.disabled = false;
                    }
                  } catch (err) {
                    alert("Verification failed");
                    btn.innerHTML = originalContent;
                    btn.disabled = false;
                  }
                }}
              >
                <span>Verify & Continue to Payment</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>

              <div className="auth-switch" style={{ marginTop: '1.5rem' }}>
                Didn't get the code? {resendTimer > 0 ? (
                  <span style={{ color: '#ff6b00', fontWeight: '700' }}>Resend in {resendTimer}s</span>
                ) : (
                  <button className="text-btn" onClick={handleResendOTP}>Resend Code</button>
                )}
              </div>
            </div>
          )}

          {partnerStep === 'payment' && (
            <div className="partner-auth-container partner-payment-layout animate-fade-in">
              <div className="partner-flow-header">
                <h2>Complete Secure Payment</h2>
                <p>Choose your preferred payment method to activate partnership.</p>
              </div>

              <div className="payment-summary-v2">
                <div className="summary-item">
                  <span className="label">Selected Plan</span>
                  <span className="value">{selectedPlan?.name}</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-item total-payable">
                  <span className="label">Total Amount</span>
                  <span className="value">₹{selectedPlan?.price}</span>
                </div>
              </div>

              <div className="payment-methods-v2">
                <button
                  className={`method-btn ${paymentMethod === 'qr' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('qr')}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3v6h6V3H3zm4 4H5V5h2v2zm-4 7v6h6v-6H3zm4 4H5v-2h2v2zm7-11v6h6V3h-6zm4 4h-2V5h2v2zm-4 7v6h2v-2h2v2h2v-2h-2v-2h-2v2h-2v-2h-2v2z" /></svg>
                  <span>Scan QR</span>
                </button>
                <button
                  className={`method-btn ${paymentMethod === 'upi' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('upi')}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM12 10.5V13c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-2.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5z" /></svg>
                  <span>UPI ID</span>
                </button>
              </div>

              <div className="payment-method-content-v2">
                {paymentMethod === 'qr' ? (
                  <div className="qr-container-v2 animate-fade-in" style={{ textAlign: 'center' }}>
                    <div className="qr-box-v3" style={{ background: '#fff', padding: '15px', borderRadius: '24px', display: 'inline-block', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=8225998713@ybl&am=${selectedPlan?.price}&pn=JokesStudio`} alt="Payment QR" style={{ width: '180px', height: '180px', borderRadius: '12px' }} />
                    </div>
                    <p className="payment-instruction">Scan with PhonePe, GPay, or any UPI App</p>
                  </div>
                ) : (
                  <div className="upi-container-v2 animate-fade-in">
                    <div className="id-display" style={{ marginBottom: '1rem' }}>
                      <code>8225998713@ybl</code>
                      <button onClick={() => { copyToClipboard('8225998713@ybl'); }}>Copy ID</button>
                    </div>
                    <p className="payment-instruction">Copy the UPI ID and pay from your preferred app</p>
                  </div>
                )}
              </div>

              <div className="payment-footer" style={{ marginTop: '1rem' }}>
                <button
                  className="premium-action-btn"
                  onClick={async (e) => {
                    const btn = e.currentTarget;
                    const originalContent = btn.innerHTML;
                    btn.innerHTML = "<span>Processing Request...</span>";
                    btn.disabled = true;
                    await handlePartnerApply();
                  }}
                >
                  <span>Confirm My Payment</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
              </div>
            </div>
          )}

          {partnerStep === 'payment-pending' && (
            <div className="partner-auth-container animate-fade-in">
              <div className="partner-flow-header">
                <h2>⚡ Payment Found</h2>
                <p>We've identified your previous transaction request.</p>
              </div>

              <div className="status-card-v2">
                <div className="status-badge badge-review">
                  <span>⏳ Verification Pending</span>
                </div>
                <div className="payment-summary-v2" style={{ margin: '1rem 0', background: 'rgba(255,107,0,0.05)' }}>
                  <div className="summary-item">
                    <span className="label">Plan</span>
                    <span className="value">{selectedPlan?.name || 'Active Plan'}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Amount Paid</span>
                    <span className="value" style={{ color: '#22c55e' }}>₹{selectedPlan?.price || '---'}</span>
                  </div>
                </div>

                <div className="status-steps">
                  <div className="status-step">
                    <div className="step-num">1</div>
                    <div className="step-content">
                      <h4>Payment Received</h4>
                      <p>Your transaction is logged in our system.</p>
                    </div>
                  </div>
                  <div className="status-step">
                    <div className="step-num">2</div>
                    <div className="step-content">
                      <h4>Manual Review</h4>
                      <p>Our admin team is verifying the bank confirmation.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
                <button className="secondary-action-btn" style={{ flex: 1 }} onClick={() => setPartnerStep('none')}>Close</button>
                <button className="premium-action-btn" style={{ flex: 1.5 }} onClick={() => setPartnerStep('pending')}>
                  <span>Full Status</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
              </div>
            </div>
          )}

          {partnerStep === 'pending' && (
            <div className="partner-auth-container animate-fade-in">
              <div className="processing-loader" style={{ marginBottom: '1.5rem' }}>
                <div className="ring"></div>
                <div className="ring"></div>
                <div className="status-dot"></div>
              </div>
              <div className="partner-flow-header">
                <h2>Application Pending</h2>
                <p>We're finalizing your creator enrollment. Please wait while we verify your details.</p>
              </div>

              <div className="status-card-v2">
                <div className="status-badge badge-review">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: '6px' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  <span>Manual Verification Required</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Our team is currently verifying your partnership request. This usually takes <strong>2-4 hours</strong> during business hours.
                </p>

                <div className="summary-divider"></div>

                <div className="status-steps" style={{ marginTop: '1.5rem' }}>
                  <div className="status-step">
                    <div className="step-num">✓</div>
                    <div className="step-content">
                      <h4 style={{ color: '#22c55e' }}>Registration Complete</h4>
                    </div>
                  </div>
                  <div className="status-step">
                    <div className="step-num">2</div>
                    <div className="step-content">
                      <h4>Manual Verification</h4>
                      <p>Verification of Payment & ID</p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
                <button className="secondary-action-btn" style={{ flex: 1 }} onClick={() => setPartnerStep('none')}>Close</button>
                <button
                  className="premium-action-btn"
                  style={{ flex: 1.5 }}
                  onClick={async (e) => {
                    const btn = e.currentTarget;
                    const orig = btn.innerHTML;
                    btn.innerHTML = '<span>Checking...</span>';
                    btn.disabled = true;

                    const token = localStorage.getItem('token');
                    if (token) {
                      const res = await checkPartnerStatus(token);
                      if (res && res.status) setPartnerStatus(res.status);
                      if (res.status === 'completed') {
                        setPartnerStep('none');
                        savePartnerSuccess({ message: res.message });
                      } else {
                        alert("Your application is still under review. We'll notify you soon!");
                        btn.innerHTML = orig;
                        btn.disabled = false;
                      }
                    } else {
                      btn.innerHTML = orig;
                      btn.disabled = false;
                    }
                  }}
                >
                  <span>Refresh Status</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"></path></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('activePlan');
    setIsLoggedIn(false);
    setActivePlan(null);
    setAuthUser(null);
    setPartnerStatus('none');
    setPartnerStep('none');
    setShowBottomProfile(false);
    navigate('/');
  };

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
        setShowInstallPopup(false);
        setShowCustomInstallModal(false);
        setInstallHint('');
      });
    } else {
      setInstallHint('Install prompt is not available in this browser. Open browser menu and tap "Install app" or "Add to Home screen".');
      setShowInstallPopup(false);
      setShowCustomInstallModal(true);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };


  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if haven't dismissed it in this session or based on some logic
      setShowInstallPopup(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('install_app') === '1') {
        setShowCustomInstallModal(true);
      }
    } catch {
      // no-op
    }
  }, []);

  // --- POLLING & AUTO-RESUME FOR PARTNER ---
  useEffect(() => {
    if (!isLoggedIn) return;

    // Initial check on mount/login
    const initialCheck = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await checkPartnerStatus(token);
        if (res.status) setPartnerStatus(res.status);
        if (res.status === 'pending') {
          setPartnerStep('pending');
          // Clear local cache since it's now on server
          localStorage.removeItem('partner_session_step');
          localStorage.removeItem('partner_session_plan');
          localStorage.removeItem('partner_session_mobile');
        } else if (res.status === 'completed' || res.is_partner) {
          if (res.approved) {
            savePartnerSuccess({ message: res.message });
          }
          setPartnerStep('none');
          localStorage.removeItem('partner_session_step');
          localStorage.removeItem('partner_session_plan');
          localStorage.removeItem('partner_session_mobile');
          getProfile(token).then(u => setAuthUser(u));
        } else {
          // Auto-resume from local storage if no server status
          const savedStep = localStorage.getItem('partner_session_step');
          const savedPlan = localStorage.getItem('partner_session_plan');
          const savedMobile = localStorage.getItem('partner_session_mobile');
          if (savedStep && savedPlan) {
            setSelectedPlan(JSON.parse(savedPlan));
            setPartnerStep(savedStep);
            if (savedMobile) setPartnerSignupData(prev => ({ ...prev, mobile: savedMobile }));
          }
        }
      } catch (err) { }
    };
    initialCheck();

    const interval = setInterval(async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await checkPartnerStatus(token);
        if (res && res.status) {
          setPartnerStatus(prev => {
            if (prev !== res.status) return res.status;
            return prev;
          });
        }
        if (res && (res.status === 'completed' || res.is_partner)) {
          // Only close modal if we were in a pending/plans state
          setPartnerStep(prev => {
            if (prev !== 'none') return 'none';
            return prev;
          });

          localStorage.removeItem('partner_session_step');
          localStorage.removeItem('partner_session_plan');
          localStorage.removeItem('partner_session_mobile');

          if (res.approved) {
            savePartnerSuccess({ message: res.message });
          }
          getProfile(token).then(u => setAuthUser(u));
        }
      } catch (err) { }
    }, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      setLiveNotifications([]);
      return;
    }

    const pollNotifications = async () => {
      const token = localStorage.getItem('token');
      const data = await getNotifications(token);
      if (Array.isArray(data)) setLiveNotifications(data);
    };

    pollNotifications();
    const interval = setInterval(pollNotifications, 8000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const initializeAppData = async () => {
      let verifiedToken = localStorage.getItem('token');

      if (verifiedToken) {
        try {
          const data = await getProfile(verifiedToken);
          setAuthUser(data);
          setIsLoggedIn(true);
        } catch (err) {
          console.error("Session expired", err);
          localStorage.removeItem('token');
          verifiedToken = null;
        }
      }

      try {
        const homeData = await getHomeData(verifiedToken);
        const [popularData, standupData, memesData, newHotData] = await Promise.all([
          getPopularData().catch(() => ({})),
          getStandupData().catch(() => ({})),
          getMemesData().catch(() => ({})),
          getNewHotData().catch(() => ({})),
        ]);

        const safeMerge = (newData, prevData) => {
          if (!newData || newData.length === 0) return prevData;
          // Filter out any items from prevData that have the same title or ID as newData to avoid dupes
          const newDataIds = new Set(newData.map(item => item.id));
          const filteredPrev = prevData.filter(item => !newDataIds.has(item.id));
          return [...newData, ...filteredPrev];
        };

        setHomeHeroVideos(homeData.hero || []);
        setHomeTrending(prev => safeMerge(homeData.trending, prev));
        setHomeStandup(prev => safeMerge(homeData.standup, prev));
        setHomeMostWatched(prev => safeMerge(homeData.most_watched, prev));
        setHomeMemes(prev => safeMerge(homeData.memes, prev));
        setHomeCreators(prev => safeMerge(homeData.popular_creators, prev));

        setSearchPool(createSearchPool(homeData, popularData, standupData, memesData, newHotData));
      } catch (err) {
        console.error("Failed to fetch home data", err);
      } finally {
        setIsLoadingHome(false);
      }
    };

    initializeAppData();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) syncSubscription(token);
  }, [isLoggedIn]);

  // ── Poll backend for newly-approved videos ──────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return;

    const poll = async () => {
      const token = localStorage.getItem('token');
      const approvedVideos = await checkVideoApprovals(token);
      if (approvedVideos && approvedVideos.length > 0) {
        setApprovalNotifications(approvedVideos);
        setCurrentApprovalIdx(0);
      }
    };

    poll(); // run immediately on login
    const interval = setInterval(poll, 30000); // then every 30s
    return () => clearInterval(interval);
  }, [isLoggedIn]);


  const handleShareClick = (item) => {
    if (!item) return;
    const isProfile = item.type === 'profile';
    const shareTitle = isProfile ? `Check out ${item.title} on Jokes Studio!` : `😂 This video made me laugh! \n\n${item.title}`;
    const shareUrl = isProfile ? `https://laughloop.com/@${item.handle.replace('@', '')}` : `https://laughloop.com/video/${item.id || 'hero-123'}`;

    if (navigator.share) {
      navigator.share({
        title: isProfile ? `${item.title} on Jokes Studio` : item.title,
        text: shareTitle,
        url: shareUrl,
      }).catch(err => {
        setSharingItem({ ...item, isProfile, shareUrl });
        setShowShareModal(true);
      });
    } else {
      setSharingItem({ ...item, isProfile, shareUrl });
      setShowShareModal(true);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };


  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300 && !hasDismissedSticky) {
        setShowStickyBanner(true);
      } else {
        setShowStickyBanner(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasDismissedSticky]);

  // Sync activeNav and activeBottomNav with URL
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      setActiveNav('Home');
      setActiveBottomNav('Home');
    } else if (path === '/popular') {
      setActiveNav('Popular');
      setActiveBottomNav('Explore');
    } else if (path === '/explore') {
      setActiveBottomNav('Explore');
    } else if (path === '/upload') {
      setActiveBottomNav('Upload');
    } else if (path === '/profile') {
      setActiveBottomNav('Profile');
    } else if (path === '/standup') {
      setActiveNav('Standup');
    } else if (path === '/memes') {
      setActiveNav('Memes');
    } else if (path === '/new-hot') {
      setActiveNav('New & Hot');
    }
  }, [location]);

  // Hero Auto-scroll
  useEffect(() => {
    if (homeHeroVideos.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % homeHeroVideos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [homeHeroVideos.length]);

  // Auto-scroll logic for Top Picks
  useEffect(() => {
    const scrollContainer = posterRef.current;
    if (!scrollContainer || isHovered) return;

    const interval = setInterval(() => {
      const scrollAmount = 300;
      const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;

      if (scrollContainer.scrollLeft >= maxScroll - 10) {
        scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isHovered]);

  // Auto-scroll logic for More Recommended
  useEffect(() => {
    const scrollContainer = recommendedRef.current;
    if (!scrollContainer || isRecHovered) return;

    const interval = setInterval(() => {
      const scrollAmount = 300;
      const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;

      if (scrollContainer.scrollLeft >= maxScroll - 10) {
        scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecHovered]);

  // Auto-scroll logic for Home Page Sections
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

    const c1 = setupScroll(trendingRef, isTrendHover);
    const c2 = setupScroll(standupHighlightRef, isStandHighlightHover);
    const c3 = setupScroll(viralMemesHomeRef, isViralMemeHover);
    const cl4 = setupScroll(comediansHomeRef, isComediansHover, 200);
    const cl5 = setupScroll(mostWatchedRef, isMostWatchedHover);
    const cl6 = setupScroll(categoriesHomeRef, isCategoriesHover, 240);

    return () => {
      if (c1) c1();
      if (c2) c2();
      if (c3) c3();
      if (cl4) cl4();
      if (cl5) cl5();
      if (cl6) cl6();
    };
  }, [isTrendHover, isStandHighlightHover, isViralMemeHover, isComediansHover, isMostWatchedHover, isCategoriesHover]);

  const handleSurpriseMe = () => {
    const allRoutes = ['/popular', '/standup', '/memes', '/new-hot'];
    const randomRoute = allRoutes[Math.floor(Math.random() * allRoutes.length)];
    navigate(randomRoute);
    document.querySelector('.main-container')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const query = normalizeText(searchQuery);
    if (!query) {
      setSearchResults({ videos: [], creators: [], memes: [] });
      return;
    }

    const keywordMatch = (value) => normalizeText(value).includes(query);

    const videoMatches = toArray(searchPool.videos).filter((video) =>
      keywordMatch(video?.title) ||
      keywordMatch(video?.subtitle) ||
      keywordMatch(video?.creator_name) ||
      keywordMatch(video?.creator) ||
      keywordMatch(video?.section) ||
      keywordMatch(video?.page) ||
      keywordMatch(video?.badge) ||
      keywordMatch(video?.stats)
    );

    const creatorMatches = toArray(searchPool.creators).filter((creator) =>
      keywordMatch(creator?.name) ||
      keywordMatch(creator?.followers)
    );

    const memeMatches = toArray(searchPool.memes).filter((meme) =>
      keywordMatch(meme?.title) ||
      keywordMatch(meme?.subtitle) ||
      keywordMatch(meme?.creator_name) ||
      keywordMatch(meme?.creator) ||
      keywordMatch(meme?.section)
    );

    setSearchResults({
      videos: videoMatches,
      creators: creatorMatches,
      memes: memeMatches
    });
  }, [searchQuery, searchPool]);

  // Search handler
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ videos: [], creators: [], memes: [] });
  };

  // ── Partner Resume Logic ───────────────────────────────────────────
  useEffect(() => {
    if (isLoggedIn && partnerStep !== 'none' && partnerStep !== 'pending') {
      localStorage.setItem('partner_session_step', partnerStep);
    }
    // We only clear these when the status becomes 'pending' or 'completed' via server check
  }, [partnerStep, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && selectedPlan) {
      localStorage.setItem('partner_session_plan', JSON.stringify(selectedPlan));
    }
  }, [selectedPlan, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && partnerSignupData.mobile) {
      localStorage.setItem('partner_session_mobile', partnerSignupData.mobile);
    }
  }, [partnerSignupData.mobile, isLoggedIn]);

  return (
    <div className="app-wrapper">
      {!hasEntered && renderGateway()}
      {renderPartnerFlow()}
      {renderPartnerSuccessModal()}

      {/* ── Video Approval Notification Popup ─────────────────────── */}
      {approvalNotifications.length > 0 && currentApprovalIdx < approvalNotifications.length && (() => {
        const vid = approvalNotifications[currentApprovalIdx];
        const pageRouteMap = {
          home: '/',
          popular: '/popular',
          standup: '/standup',
          memes: '/memes',
          newhot: '/new-hot',
        };
        const route = pageRouteMap[vid.page] || '/';
        const dismiss = () => {
          if (currentApprovalIdx + 1 < approvalNotifications.length) {
            setCurrentApprovalIdx(i => i + 1);
          } else {
            setApprovalNotifications([]);
            setCurrentApprovalIdx(0);
          }
        };
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          }}>
            <div style={{
              background: 'linear-gradient(145deg,#0f2027,#1a1a2e)',
              border: '1px solid rgba(74,222,128,0.4)',
              borderRadius: '28px', padding: '2.5rem 2.2rem',
              maxWidth: '430px', width: '92%', textAlign: 'center',
              boxShadow: '0 0 80px rgba(74,222,128,0.2), 0 20px 60px rgba(0,0,0,0.6)',
              animation: 'approvalPopIn 0.45s cubic-bezier(0.34,1.56,0.64,1)',
              position: 'relative',
            }}>
              <style>{`
                @keyframes approvalPopIn {
                  from { opacity:0; transform:scale(0.7) translateY(30px); }
                  to   { opacity:1; transform:scale(1)   translateY(0);    }
                }
                @keyframes approvalConfettiBounce {
                  0%,100% { transform: translateY(0); }
                  50%     { transform: translateY(-10px); }
                }
                .approval-emoji { animation: approvalConfettiBounce 1.2s ease infinite; display:inline-block; }
              `}</style>

              {/* Close button */}
              <button onClick={dismiss} style={{
                position: 'absolute', top: '14px', right: '16px',
                background: 'transparent', border: 'none',
                color: '#666', fontSize: '1.3rem', cursor: 'pointer',
              }}>✕</button>

              {/* Counter badge if multiple */}
              {approvalNotifications.length > 1 && (
                <div style={{
                  position: 'absolute', top: '14px', left: '16px',
                  background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)',
                  borderRadius: '50px', padding: '2px 10px',
                  color: '#4ade80', fontSize: '0.75rem', fontWeight: 700,
                }}>
                  {currentApprovalIdx + 1} / {approvalNotifications.length}
                </div>
              )}

              {/* Emoji burst */}
              <div style={{ fontSize: '3.5rem', marginBottom: '0.8rem' }}>
                <span className="approval-emoji">🎉</span>
              </div>

              <h2 style={{
                fontSize: '1.45rem', fontWeight: 800,
                background: 'linear-gradient(135deg,#4ade80,#22c55e)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                marginBottom: '0.4rem',
              }}>
                Your Video is Now Live!
              </h2>

              <p style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '1.4rem', lineHeight: 1.6 }}>
                <strong style={{ color: '#fff' }}>"{vid.title}"</strong> has been approved.<br />
                You can now see it on:
              </p>

              {/* Page + Section pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.35)',
                borderRadius: '50px', padding: '10px 20px', marginBottom: '1.6rem',
              }}>
                <span style={{ fontSize: '1.1rem' }}>📍</span>
                <span style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.95rem' }}>
                  {vid.page_label} Page
                </span>
                <span style={{ color: '#555', fontSize: '1rem' }}>›</span>
                <span style={{ color: '#a3e635', fontWeight: 600, fontSize: '0.95rem' }}>
                  {vid.section_label}
                </span>
              </div>

              {/* Thumbnail preview */}
              {vid.img_url && (
                <div style={{
                  borderRadius: '14px', overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.08)',
                  marginBottom: '1.6rem', maxHeight: '130px',
                }}>
                  <img src={vid.img_url} alt={vid.title}
                    style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }} />
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                <button onClick={dismiss} style={{
                  padding: '11px 22px', borderRadius: '50px',
                  border: '1px solid #333', background: 'transparent',
                  color: '#aaa', cursor: 'pointer', fontSize: '0.9rem',
                }}>
                  Close
                </button>
                <button
                  onClick={() => { navigate(route); dismiss(); }}
                  style={{
                    padding: '11px 26px', borderRadius: '50px', border: 'none',
                    background: 'linear-gradient(135deg,#4ade80,#16a34a)',
                    color: '#000', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700,
                  }}
                >
                  🚀 Go to {vid.page_label} Page
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Main Content Scroll Container */}
      <main className="main-container">
        {/* Re-designed Header */}
        <header className="app-header">
          <div
            className="header-logo"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem', whiteSpace: 'nowrap', cursor: 'pointer', fontWeight: 800 }}
            onClick={() => {
              navigate('/');
              window.scrollTo({ top: 0, behavior: 'instant' });
            }}
          >
            <video
              src={logoVideo}
              autoPlay
              muted
              loop
              playsInline
              style={{
                width: '55px',
                height: '55px',
                objectFit: 'cover',
                borderRadius: '10px',
                filter: theme === 'dark' ? 'invert(1) hue-rotate(180deg)' : 'none',
                mixBlendMode: theme === 'dark' ? 'screen' : 'normal'
              }}
            />
            Jokes.studio
          </div>

          <nav className="header-nav">
            {['Popular', 'Standup', 'Memes', 'New & Hot'].map(item => (
              <div
                key={item}
                className={`nav-link ${activeNav === item ? 'active' : ''}`}
                onClick={() => {
                  if (item === 'Popular') {
                    navigate('/popular#all');
                  } else {
                    const slug = item === 'New & Hot' ? 'new-hot' : item.toLowerCase();
                    navigate(`/${slug}`);
                  }
                  document.querySelector('.main-container')?.scrollTo({ top: 0, behavior: 'instant' });
                }}
              >
                {item}
              </div>
            ))}
          </nav>

          <div className="search-container">
            <svg className="search-icon" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search comedians, jokes, videos..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>

          <div className="header-right">
            <div
              className="header-icon-btn desktop-only-install"
              onClick={() => setShowCustomInstallModal(true)}
              style={{ color: '#ff3d00' }}
              title="Install App"
            >
              <span style={{ fontSize: '1.2rem' }}>📲</span>
            </div>

            {/* 🌙 Theme Toggle Desktop */}
            <div
              className="header-icon-btn theme-toggle-desktop"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              style={{ color: 'var(--text-primary)' }}
            >
              {theme === 'dark' ? (
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              ) : (
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              )}
            </div>

            <div className="mobile-only-header-btns">
              <div className="header-icon-btn mobile-search-btn">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              <div className="header-icon-btn install-mobile-btn" onClick={() => setShowCustomInstallModal(true)} style={{ color: '#ff3d00' }}>
                <span style={{ fontSize: '1.2rem' }}>📲</span>
              </div>
            </div>

            <div className="notify-container" style={{ position: 'relative' }}>
              <div
                className="header-icon-btn"
                onClick={() => setShowNotifyMenu(!showNotifyMenu)}
              >
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                {isLoggedIn && liveNotifications.length > 0 && <div className="notify-dot"></div>}
              </div>

              {showNotifyMenu && (
                <div className="notify-dropdown">
                  <div className="notify-header">Notifications</div>
                  <div className="notify-list">
                    {!isLoggedIn && (
                      <div className="notify-item">
                        <div className="notify-icon" style={{ backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>🔐</div>
                        <div className="notify-txt">
                          <strong>Login Required</strong>
                          <span>Login to see real-time notifications.</span>
                        </div>
                      </div>
                    )}
                    {isLoggedIn && liveNotifications.length === 0 && (
                      <div className="notify-item">
                        <div className="notify-icon" style={{ backgroundColor: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8' }}>🔔</div>
                        <div className="notify-txt">
                          <strong>No Notifications Yet</strong>
                          <span>New follows, comments, uploads, and creator joins will appear here.</span>
                        </div>
                      </div>
                    )}
                    {isLoggedIn && liveNotifications.map((notif) => {
                      const visual = getNotificationVisual(notif.type);
                      return (
                        <div className="notify-item" key={notif.id}>
                          <div className="notify-icon" style={{ backgroundColor: visual.bg, color: visual.color }}>{visual.icon}</div>
                          <div className="notify-txt">
                            <strong>{notif.title}</strong>
                            <span>{notif.message}</span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.65, marginTop: '2px' }}>
                              {formatNotificationTime(notif.created_at)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="profile-container" style={{ position: 'relative' }}>


              {isLoggedIn && (
                <div
                  className="profile-trigger"
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowBottomProfile(false); // Close bottom menu if open
                  }}
                >
                  <div className="header-icon-btn profile-icon-circle">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                  <span className="user-name">{authUser?.username || 'User'}</span>
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" style={{ transform: showProfileMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.7 }}><path d="M7 10l5 5 5-5z" /></svg>
                </div>
              )}

              {isLoggedIn && showProfileMenu && (
                <>
                  <div className="profile-menu-overlay" onClick={() => setShowProfileMenu(false)}></div>
                  <div className="profile-dropdown">
                    <div className="profile-menu-item" onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}>Profile</div>
                    <div className="profile-menu-divider"></div>
                    <div className="profile-menu-item logout" onClick={handleLogout}>Logout</div>
                  </div>
                </>
              )}
            </div>

            <div
              className="header-icon-btn mobile-menu-trigger-last"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              style={{ color: 'var(--text-primary)', display: 'none' }}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.8"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </div>
          </div>

        </header>

        {/* Mobile Flyout Menu */}
        <div className={`mobile-side-nav ${showMobileMenu ? 'open' : ''}`} style={{ zIndex: 99999 }}>
          <div className="mobile-nav-header">
            <div className="header-logo" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}>
              <video
                src={logoVideo}
                autoPlay
                muted
                loop
                playsInline
                style={{
                  width: '45px',
                  height: '45px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  filter: theme === 'dark' ? 'invert(1) hue-rotate(180deg)' : 'none',
                  mixBlendMode: theme === 'dark' ? 'screen' : 'normal'
                }}
              />
              Jokes.studio
            </div>
            <div className="close-btn" onClick={() => setShowMobileMenu(false)}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
          </div>
          <div className="mobile-nav-list">
            {['Popular', 'Standup', 'Memes', 'New & Hot', 'Saved', 'Upload'].map(item => (
              <div
                key={item}
                className={`mobile-nav-item ${activeNav === item ? 'active' : ''}`}
                onClick={async () => {
                  if (item === 'Upload') {
                    setShowMobileMenu(false);
                    const token = localStorage.getItem('token');
                    if (token) {
                      const res = await checkPartnerStatus(token);
                      if (res && res.status) setPartnerStatus(res.status);
                      if (res.status === 'completed' || res.is_partner) {
                        navigate('/upload');
                        setActiveBottomNav('Upload');
                      } else if (res.status === 'pending') {
                        setPartnerStep('pending');
                      } else {
                        setPartnerStep('plans');
                      }
                    } else {
                      setPartnerStep('plans');
                    }
                    return;
                  }
                  const slug = item === 'New & Hot' ? 'new-hot' : item.toLowerCase();
                  navigate(`/${item === 'Home' ? '' : slug}`);
                  setShowMobileMenu(false);
                  window.scrollTo({ top: 0, behavior: 'instant' });
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
        {showMobileMenu && <div className="mobile-overlay" onClick={() => setShowMobileMenu(false)} style={{ zIndex: 99998 }}></div>}

        {/* Home Page Content */}
        {/* Main Content Switcher */}
        <div className="main-content">
          {searchQuery ? (
            // Search Results View
            <div className="search-results-view" style={{ padding: '2rem 4rem' }}>
              <h1 style={{ marginBottom: '2rem', fontSize: '1.8rem', fontWeight: 800 }}>
                Search Results for "{searchQuery}"
              </h1>

              {searchResults.videos.length === 0 && searchResults.creators.length === 0 && searchResults.memes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                  <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No results found</h2>
                  <p>Try searching with different keywords</p>
                </div>
              ) : (
                <>
                  {/* Creators Results */}
                  {searchResults.creators.length > 0 && (
                    <section style={{ marginBottom: '3rem' }}>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                        👤 Comedians & Creators
                      </h2>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1.5rem' }}>
                        {searchResults.creators.map(creator => (
                          <div key={creator.id} style={{ textAlign: 'center', cursor: 'pointer' }}>
                            <img
                              src={creator.img}
                              alt={creator.name}
                              style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                marginBottom: '0.5rem'
                              }}
                            />
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                              {creator.name}
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              {creator.followers} followers
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Videos Results */}
                  {searchResults.videos.length > 0 && (
                    <section style={{ marginBottom: '3rem' }}>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                        🎬 Videos
                      </h2>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        {searchResults.videos.map(video => (
                          <div
                            key={video.id}
                            className="premium-card-v2"
                            onClick={() => setSelectedVideoHome(video)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="card-media-wrap">
                              {isDirectVideo(video.video_url) ? (
                                <video
                                  src={video.video_url}
                                  className="card-img"
                                  muted
                                  playsInline
                                  loop
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
                                  <div className="card-creator-v2">
                                    <div className="creator-avatar-sm">{(video.creator_name || video.creator || 'U')[0]}</div>
                                    <span>{video.creator_name || video.creator}</span>
                                  </div>
                                </div>
                                <div className="card-divider-v2"></div>
                                <div className="card-actions-v2">
                                  <LikeButton initialLikes={video.likes} itemId={video.id} />
                                  <button
                                    className="card-action-btn share"
                                    onClick={(e) => { e.stopPropagation(); handleShareClick(video); }}
                                    title="Share"
                                  >
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                      <polyline points="16 6 12 2 8 6" />
                                      <line x1="12" y1="2" x2="12" y2="15" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Memes Results */}
                  {searchResults.memes.length > 0 && (
                    <section style={{ marginBottom: '3rem' }}>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                        😂 Memes
                      </h2>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        {searchResults.memes.map(meme => (
                          <div
                            key={meme.id}
                            className="premium-card-v2"
                            onClick={() => setSelectedVideoHome(meme)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="card-media-wrap">
                              <img src={meme.img} alt={meme.title} className="card-img" />
                              <div className="card-play-overlay">
                                <div className="play-icon-circle">
                                  <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                </div>
                              </div>
                            </div>
                            <div className="card-content-v2">
                              <h3 className="card-title-v2">{meme.title}</h3>
                              <div className="card-footer-v2">
                                <div className="card-meta-row-v2">
                                  <div className="card-creator-v2">
                                    <div className="creator-avatar-sm">{(meme.creator || 'U')[0]}</div>
                                    <span>{meme.creator}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          ) : (
            <Routes>
              <Route path="/" element={
                <div className="home-page-view" style={{ animation: 'fadeIn 0.5s ease' }}>
                  {/* 1️⃣ Hero Section */}
                  {homeHeroVideos.length > 0 && (
                    <section className="featured-hero" style={{ marginTop: '1rem' }}>
                      <div className="video-row-header"><h2 className="section-title">🔥 Featured Comedy</h2></div>
                      <div className="hero-banner-main">
                        {getYouTubeEmbedUrl(homeHeroVideos[heroIndex]?.video_url) ? (
                          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                            <iframe key={heroIndex} width="100%" height="100%" src={getYouTubeEmbedUrl(homeHeroVideos[heroIndex]?.video_url)} title="YouTube player" frameBorder="0" allow="autoplay" style={{ objectFit: 'cover', transform: 'scale(1.5)' }}></iframe>
                          </div>
                        ) : (
                          <video key={heroIndex} autoPlay muted loop playsInline className="hero-banner-media" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}>
                            <source src={homeHeroVideos[heroIndex]?.video_url} type="video/mp4" />
                          </video>
                        )}
                        <div className="hero-content-overlay" style={{ zIndex: 2 }}>
                          <div className="hero-trend-tag">{homeHeroVideos[heroIndex]?.badge || 'TRENDING #1'}</div>
                          <h1 className="hero-main-title">{homeHeroVideos[heroIndex]?.title}</h1>
                          <div className="hero-meta-row">
                            <span>👤 {homeHeroVideos[heroIndex]?.creator_name || 'Creator'}</span>
                            <div className="hero-meta-dot"></div>
                            <span>❤️ {homeHeroVideos[heroIndex]?.likes || '32K'}</span>
                            <div className="hero-meta-dot"></div>
                            <span style={{ cursor: 'pointer' }} onClick={() => handleShareClick(homeHeroVideos[heroIndex])}>🔁 Share</span>
                            <div className="hero-meta-dot"></div>
                            <span
                              style={{ cursor: 'pointer', color: homeHeroVideos[heroIndex]?.is_saved ? '#ff3d00' : 'inherit' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const item = homeHeroVideos[heroIndex];
                                saveVideo(item.id, item.is_saved ? 'unsave' : 'save');
                                item.is_saved = !item.is_saved;
                                e.currentTarget.style.color = item.is_saved ? '#ff3d00' : 'inherit';
                                e.currentTarget.innerHTML = (item.is_saved ? '🔖 Saved' : '🔖 Save');
                              }}
                            >
                              {homeHeroVideos[heroIndex]?.is_saved ? '🔖 Saved' : '🔖 Save'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* 2️⃣ Trending Comedy */}
                  <section className="row-section home-row" onMouseEnter={() => setIsTrendHover(true)} onMouseLeave={() => setIsTrendHover(false)}>
                    <div className="video-row-header">
                      <h2 className="section-title">🔥 Trending Now</h2>
                      <div className="row-nav">
                        <button className="row-arrow" onClick={() => trendingRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                        <button className="row-arrow" onClick={() => trendingRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                      </div>
                    </div>
                    <div className="poster-grid" ref={trendingRef} style={{ gap: '2rem', paddingBottom: '1rem' }}>
                      {homeTrending.map(item => (
                        <div key={item.id} className="premium-card-v2" onClick={() => setSelectedVideoHome(item)}>
                          <div className="card-media-wrap">
                            {isDirectVideo(item.video_url) ? <video src={item.video_url} className="card-img" muted playsInline loop onMouseEnter={e => e.currentTarget.play()} onMouseLeave={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} poster={item.img_url || item.img} /> : <img src={item.img_url || item.img} alt={item.title} className="card-img" />}
                            <div className="card-play-overlay"><div className="play-icon-circle"><svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></div></div>
                          </div>
                          <div className="card-content-v2">
                            <h3 className="card-title-v2">{item.title}</h3>
                            <div className="card-footer-v2">
                              <div className="card-meta-row-v2">
                                <div className="card-creator-v2"><span>{item.creator_name || item.creator}</span></div>
                              </div>
                              <div className="card-actions-v2">
                                <LikeButton initialLikes={item.likes} itemId={item.id} />
                                <button
                                  className="card-action-btn"
                                  onClick={(e) => { e.stopPropagation(); openVideoModal(item, { startWithComments: true }); }}
                                  title="Comment"
                                >
                                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                                </button>
                                <button
                                  className="card-action-btn share"
                                  onClick={(e) => { e.stopPropagation(); handleShareClick(item); }}
                                  title="Share"
                                >
                                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                    <polyline points="16 6 12 2 8 6" />
                                    <line x1="12" y1="2" x2="12" y2="15" />
                                  </svg>
                                </button>
                                <button
                                  className={`card-action-btn save ${item.is_saved ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveVideo(item.id, item.is_saved ? 'unsave' : 'save');
                                    item.is_saved = !item.is_saved;
                                    e.currentTarget.classList.toggle('active');
                                  }}
                                  title="Save"
                                >
                                  <svg width="18" height="18" fill={item.is_saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* 3️⃣ Standup Highlights */}
                  <section className="row-section home-row" style={{ marginTop: '3rem' }} onMouseEnter={() => setIsStandHighlightHover(true)} onMouseLeave={() => setIsStandHighlightHover(false)}>
                    <div className="video-row-header">
                      <h2 className="section-title">🎤 Standup Highlights</h2>
                      <div className="row-nav">
                        <button className="row-arrow" onClick={() => standupHighlightRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                        <button className="row-arrow" onClick={() => standupHighlightRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                      </div>
                    </div>
                    <div className="poster-grid" ref={standupHighlightRef} style={{ gap: '2rem', paddingBottom: '1rem' }}>
                      {homeStandup.map(item => (
                        <div key={item.id} className="premium-card-v2" onClick={() => setSelectedVideoHome(item)}>
                          <div className="card-media-wrap">
                            {isDirectVideo(item.video_url) ? <video src={item.video_url} className="card-img" muted playsInline loop onMouseEnter={e => e.currentTarget.play()} onMouseLeave={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} poster={item.img_url || item.img} /> : <img src={item.img_url || item.img} alt={item.title} className="card-img" />}
                            <div className="card-play-overlay"><div className="play-icon-circle"><svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></div></div>
                          </div>
                          <div className="card-content-v2">
                            <h3 className="card-title-v2">{item.title}</h3>
                            <div className="card-footer-v2">
                              <div className="card-meta-row-v2">
                                <div className="card-creator-v2"><span>{item.creator_name || item.creator}</span></div>
                              </div>
                              <div className="card-actions-v2">
                                <LikeButton initialLikes={item.likes} itemId={item.id} />
                                <button
                                  className="card-action-btn"
                                  onClick={(e) => { e.stopPropagation(); openVideoModal(item, { startWithComments: true }); }}
                                  title="Comment"
                                >
                                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                                </button>
                                <button
                                  className="card-action-btn share"
                                  onClick={(e) => { e.stopPropagation(); handleShareClick(item); }}
                                  title="Share"
                                >
                                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                    <polyline points="16 6 12 2 8 6" />
                                    <line x1="12" y1="2" x2="12" y2="15" />
                                  </svg>
                                </button>
                                <button
                                  className={`card-action-btn save ${item.is_saved ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveVideo(item.id, item.is_saved ? 'unsave' : 'save');
                                    item.is_saved = !item.is_saved;
                                    e.currentTarget.classList.toggle('active');
                                  }}
                                  title="Save"
                                >
                                  <svg width="18" height="18" fill={item.is_saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* 4️⃣ Viral Memes */}
                  <section className="row-section home-row" style={{ marginTop: '3rem' }} onMouseEnter={() => setIsViralMemeHover(true)} onMouseLeave={() => setIsViralMemeHover(false)}>
                    <div className="video-row-header">
                      <h2 className="section-title">😂 Viral Memes</h2>
                      <div className="row-nav">
                        <button className="row-arrow" onClick={() => viralMemesHomeRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg></button>
                        <button className="row-arrow" onClick={() => viralMemesHomeRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg></button>
                      </div>
                    </div>
                    <div className="poster-grid" ref={viralMemesHomeRef} style={{ gap: '2rem', paddingBottom: '1rem' }}>
                      {homeMemes.map(item => (
                        <div key={item.id} className="premium-card-v2" onClick={() => setSelectedVideoHome(item)}>
                          <div className="card-media-wrap">
                            {isDirectVideo(item.video_url) ? <video src={item.video_url} className="card-img" muted playsInline loop onMouseEnter={e => e.currentTarget.play()} onMouseLeave={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} poster={item.img_url || item.img} /> : <img src={item.img_url || item.img} alt={item.title} className="card-img" />}
                            <div className="card-play-overlay"><div className="play-icon-circle"><svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></div></div>
                          </div>
                          <div className="card-content-v2">
                            <h3 className="card-title-v2">{item.title}</h3>
                            <div className="card-footer-v2">
                              <div className="card-meta-row-v2">
                                <div className="card-creator-v2"><span>{item.creator_name || item.creator}</span></div>
                              </div>
                              <div className="card-actions-v2">
                                <LikeButton initialLikes={item.likes} itemId={item.id} />
                                <button
                                  className="card-action-btn"
                                  onClick={(e) => { e.stopPropagation(); openVideoModal(item, { startWithComments: true }); }}
                                  title="Comment"
                                >
                                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                                </button>
                                <button
                                  className="card-action-btn share"
                                  onClick={(e) => { e.stopPropagation(); handleShareClick(item); }}
                                  title="Share"
                                >
                                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                    <polyline points="16 6 12 2 8 6" />
                                    <line x1="12" y1="2" x2="12" y2="15" />
                                  </svg>
                                </button>
                                <button
                                  className={`card-action-btn save ${item.is_saved ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveVideo(item.id, item.is_saved ? 'unsave' : 'save');
                                    item.is_saved = !item.is_saved;
                                    e.currentTarget.classList.toggle('active');
                                  }}
                                  title="Save"
                                >
                                  <svg width="18" height="18" fill={item.is_saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* 6️⃣ Comedy Categories */}
                  <section
                    className="row-section home-row"
                    style={{ marginTop: '3rem', marginBottom: '4rem', display: showHomeCategories ? 'block' : 'none' }}
                    onMouseEnter={() => setIsCategoriesHover(true)}
                    onMouseLeave={() => setIsCategoriesHover(false)}
                  >
                    <div className="video-row-header">
                      <h2 className="section-title">🎭 Comedy Categories</h2>
                    </div>
                    <div className="poster-grid categories-grid-home" ref={categoriesHomeRef} style={{ gap: '1.5rem', paddingBottom: '1rem' }}>
                      {[
                        { name: 'Slapstick', icon: '🏃', color: 'linear-gradient(45deg, #ff3d00, #ff8a00)' },
                        { name: 'Dark Humor', icon: '🌑', color: 'linear-gradient(45deg, #232526, #414345)' },
                        { name: 'Satire', icon: '🗞️', color: 'linear-gradient(45deg, #0cebeb, #20e3b2, #29ffc6)' },
                        { name: 'Pranks', icon: '🤡', color: 'linear-gradient(45deg, #f80759, #bc4e9c)' },
                      ].map((cat, idx) => (
                        <div key={idx} className="category-card-home">
                          <div className="category-card-bg" style={{ background: cat.color }}></div>
                          <div className="category-card-content">
                            <div className="category-icon">{cat.icon}</div>
                            <div className="category-name">{cat.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* 9️⃣ Load More Section */}
                  {!showHomeCategories && (
                    <div style={{ marginTop: '3rem', marginBottom: '3rem', textAlign: 'center', padding: '0 2rem' }}>
                      <button className="premium-load-more premium-load-more-compact" onClick={handleHomeLoadMore}>
                        Load More Comedy Videos
                      </button>
                    </div>
                  )}
                </div>
              } />
              <Route path="/popular" element={
                <Popular />
              } />
              <Route path="/standup" element={<Standup />} />
              <Route path="/memes" element={<Meme onShare={handleShareClick} />} />
              <Route path="/new-hot" element={<NewHot />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/upload" element={<Upload isLoggedIn={isLoggedIn} partnerStatus={partnerStatus} setPartnerStep={setPartnerStep} authUser={authUser} />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/profile" element={<Profile onShare={handleShareClick} theme={theme} onToggleTheme={toggleTheme} authUser={authUser} onLogout={handleLogout} />} />
              <Route path="*" element={<div style={{ padding: '4rem', textAlign: 'center', color: '#888' }}>Page Under Construction</div>} />
            </Routes>
          )}
        </div>
      </main>

      <nav className="bottom-nav">
        <div
          className={`bottom-nav-item ${activeBottomNav === 'Home' ? 'active' : ''}`}
          onClick={() => {
            navigate('/');
            setActiveBottomNav('Home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          <span>Home</span>
        </div>

        <div
          className={`bottom-nav-item ${activeBottomNav === 'Explore' ? 'active' : ''}`}
          onClick={() => {
            navigate('/popular');
            setActiveBottomNav('Explore');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <span>Explore</span>
        </div>

        <div
          className={`bottom-nav-item ${activeBottomNav === 'Upload' ? 'active' : ''}`}
          onClick={async () => {
            const token = localStorage.getItem('token');
            if (token) {
              const res = await checkPartnerStatus(token);
              if (res && res.status) setPartnerStatus(res.status);
              if (res.status === 'completed' || res.is_partner) {
                navigate('/upload');
                setActiveBottomNav('Upload');
              } else if (res.status === 'pending') {
                setPartnerStep('pending');
              } else {
                // NEW: Use enhanced flow to check for pending subscriptions
                await handlePartnerFlowEntry(token);
              }
            } else {
              setPartnerStep('plans');
            }
          }}
        >
          <div className="bottom-nav-upload-btn">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </div>
        </div>

        <div
          className={`bottom-nav-item ${activeBottomNav === 'Saved' ? 'active' : ''}`}
          onClick={() => {
            navigate('/saved');
            setActiveBottomNav('Saved');
          }}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          <span>Saved</span>
        </div>

        <div
          className={`bottom-nav-item ${activeBottomNav === 'Partner' ? 'active' : ''}`}
          onClick={async () => {
            setActiveBottomNav('Partner');
            const token = localStorage.getItem('token');
            if (token) {
              setPartnerStep('auth');
              setPartnerModalAuthMode('signup');
            } else {
              setPartnerStep('auth');
              setPartnerModalAuthMode('signup');
            }
          }}
        >
          <div className={`bottom-profile-icon ${activeBottomNav === 'Partner' ? 'active' : ''}`} style={{ border: '2px solid #ff3d00', color: '#ff3d00', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
            🤝
          </div>
          <span style={{ fontSize: '0.65rem', animation: 'pulse 2s infinite' }}>Partner</span>
        </div>
      </nav>

      <div className="footer-company-credit">
        Powered by <strong>Novarsistech</strong>
      </div>

      {/* Popups & Modals */}

      {/* Bottom Profile Action Sheet */}
      {
        showBottomProfile && (
          <div className="bottom-menu-overlay" onClick={() => setShowBottomProfile(false)} style={{ animation: 'fadeIn 0.2s ease' }}>
            <div className="bottom-menu-card" onClick={(e) => e.stopPropagation()} style={{ animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
              <div className="bottom-menu-handle"></div>
              <div className="bottom-menu-header">
                <div className="profile-icon-circle" style={{ width: '48px', height: '48px', fontSize: '1.2rem', marginBottom: 0 }}>👤</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>{authUser?.username || 'User'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>{authUser?.email ? `@${authUser.email.split('@')[0]}` : '@user'}</div>
                </div>
              </div>
              <div className="bottom-menu-list">
                <div className="bottom-menu-item">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  <span>Profile</span>
                </div>
                <div className="bottom-menu-item">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  <span>My Videos</span>
                </div>
                <div className="bottom-menu-item">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                  <span>Saved</span>
                </div>
                <div className="bottom-menu-item">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                  <span>Settings</span>
                </div>
                <div className="bottom-menu-divider"></div>
                <div className="bottom-menu-item logout" onClick={handleLogout}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  <span>Logout</span>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* 1️⃣1️⃣ PWA Install Popup */}
      {
        showInstallPopup && (
          <div className="pwa-install-popup">
            <div className="pwa-info">
              <div className="pwa-icon">😂</div>
              <div className="pwa-text">
                <h4>Install Jokes Studio App</h4>
                <p>Watch comedy anytime!</p>
              </div>
            </div>
            <div className="pwa-actions">
              <button className="pwa-btn-later" onClick={() => setShowInstallPopup(false)}>Later</button>
              <button className="pwa-btn-install" onClick={handleInstallClick}>Install</button>
            </div>
          </div>
        )
      }

      {/* Sticky Install Banner */}
      {
        showStickyBanner && !hasDismissedSticky && (
          <div className="sticky-install-banner">
            <div className="sticky-banner-content">
              <span style={{ fontSize: '1.4rem' }}>📲</span>
              <span className="sticky-banner-text">Install Jokes Studio App for faster videos</span>
            </div>
            <div className="sticky-banner-actions">
              <button className="sticky-btn-install" onClick={() => { setShowStickyBanner(false); setShowCustomInstallModal(true); setHasDismissedSticky(true); }}>Install</button>
              <button className="sticky-btn-later" onClick={() => { setShowStickyBanner(false); setHasDismissedSticky(true); }}>Later</button>
            </div>
          </div>
        )
      }

      {/* Custom Install Modal */}
      {
        showCustomInstallModal && (
          <div className="modal-overlay" onClick={() => setShowCustomInstallModal(false)}>
            <div className="custom-install-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-close" onClick={() => setShowCustomInstallModal(false)}>
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', color: '#fff', textAlign: 'center' }}>📲 Install Jokes Studio App</h2>
              <p style={{ color: '#a0a0a0', marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem' }}>Watch comedy videos anytime!</p>

              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <a
                  href={installTargetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block', textDecoration: 'none' }}
                  title="Open install link"
                >
                  <div style={{
                  width: '130px',
                  height: '130px',
                  background: '#fff',
                  marginInline: 'auto',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  marginBottom: '10px'
                  }}>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(installTargetUrl)}`} alt="Install App QR Code" style={{ width: '100%', height: '100%', borderRadius: '6px' }} />
                  </div>
                </a>
                <p style={{ fontSize: '0.95rem', color: '#ddd', fontWeight: '600' }}>Scan with your phone camera</p>
                {installHint && (
                  <p style={{ marginTop: '8px', fontSize: '0.8rem', color: '#ffb75e', lineHeight: 1.4 }}>{installHint}</p>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: '20px 0', opacity: 0.5 }}>
                <div style={{ flex: 1, height: '1px', background: '#fff' }}></div>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#fff' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: '#fff' }}></div>
              </div>

              <button
                onClick={handleInstallClick}
                style={{
                  width: '100%',
                  background: '#ff6b00',
                  color: '#fff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '14px',
                  fontSize: '0.95rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 6px 15px rgba(255,107,0,0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(255,107,0,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(255,107,0,0.3)'; }}
              >
                Install App
              </button>

            </div>
          </div>
        )
      }
      {/* Login / Signup Modal */}
      {
        showLoginPopup && (
          <div className="login-modal-overlay" onClick={() => setShowLoginPopup(false)}>
            <div className="login-modal-content" onClick={e => e.stopPropagation()}>
              <div className="login-close-btn" onClick={() => setShowLoginPopup(false)}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </div>

              {/* Left Section - Comedy Visual Grid */}
              <div className="login-left-panel">
                <div className="login-grid-wrapper">
                  <div className="login-grid-column scroll-down">
                    <div className="mock-thumbnail"><div className="thumb-title">Comedy Highlights</div></div>
                    <div className="mock-thumbnail"><div className="thumb-title">Trending Clips</div></div>
                    <div className="mock-thumbnail"><div className="thumb-title">Standup Moments</div></div>
                    <div className="mock-thumbnail"><div className="thumb-title">Daily Laughs</div></div>
                  </div>
                  <div className="login-grid-column scroll-up">
                    <div className="mock-thumbnail"><div className="thumb-title">Viral Jokes</div></div>
                    <div className="mock-thumbnail"><div className="thumb-title">New Uploads</div></div>
                    <div className="mock-thumbnail"><div className="thumb-title">Creator Picks</div></div>
                    <div className="mock-thumbnail"><div className="thumb-title">Comedy Shorts</div></div>
                  </div>
                </div>
                <div className="login-left-overlay animated-gradient-bg">
                  <div style={{ fontSize: '3rem', animation: 'bounceEmoji 2s infinite' }}>😂</div>
                  <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff', marginTop: '15px' }}>Jokes Studio</h2>
                  <h3 style={{ fontSize: '1.5rem', color: '#ffb75e', fontWeight: '700', marginTop: '10px', lineHeight: '1.3' }}>Unlimited laughs.<br />Endless comedy.</h3>
                  <p style={{ color: '#eee', fontSize: '1.1rem', marginTop: '20px' }}>Your daily dose of comedy starts here.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '40px', textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '1.1rem', color: '#fff', fontWeight: '500' }}><span>🎤</span> Stand-up Comedy</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '1.1rem', color: '#fff', fontWeight: '500' }}><span>😂</span> Viral Memes</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '1.1rem', color: '#fff', fontWeight: '500' }}><span>🔥</span> Trending Skits</div>
                  </div>
                </div>
              </div>

              {/* Right Section - Login/Signup Forms */}
              <div className="login-right-panel">
                <div className="login-form-container">
                  <div className="form-header">
                    <div className="form-logo"><span>😂</span> Jokes Studio</div>
                    {loginStep === 'login' && (
                      <>
                        <h2>Welcome back 👋</h2>
                        <p>Log in to continue the laughs</p>
                      </>
                    )}
                    {loginStep === 'signup' && (
                      <>
                        <h2>Create your Jokes Studio Account</h2>
                        <p>Join for unlimited comedy videos.</p>
                      </>
                    )}
                    {loginStep === 'otp' && (
                      <>
                        <h2>Enter Verification Code</h2>
                        <p>We sent a code to your phone</p>
                      </>
                    )}
                  </div>

                  {loginStep === 'login' && signupSuccess && (
                    <div style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem', fontWeight: '600', textAlign: 'center', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                      🎉 Account created! Please log in with your credentials.
                    </div>
                  )}

                  {loginStep === 'login' && (
                    <form className="form-body" onSubmit={handleLogin}>
                      <div className="input-group">
                        <input
                          type="text"
                          className="std-input"
                          placeholder="Username"
                          value={authUsername}
                          onChange={(e) => setAuthUsername(e.target.value)}
                          required
                        />
                      </div>
                      <div className="input-group">
                        <input
                          type="password"
                          className="std-input"
                          placeholder="Password"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          required
                        />
                      </div>
                      {authError && <p style={{ color: '#ff3d00', fontSize: '0.85rem', marginBottom: '10px' }}>{authError}</p>}
                      <button type="submit" className="auth-btn">Log In →</button>

                      <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '5px 0' }}>⚡ Takes less than 10 seconds to sign in</p>

                      <div className="form-divider">
                        <span>OR</span>
                      </div>

                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Login in seconds with your account</div>
                      <div className="social-logins">
                        <button className="social-btn"><span className="social-icon">G</span> Continue with Google</button>
                      </div>

                      <div className="form-footer-switch">
                        <span>New to Jokes Studio?</span>
                        <button type="button" className="text-btn" onClick={() => { setLoginStep('signup'); setSignupSuccess(false); }}>Create your free account</button>
                      </div>
                    </form>
                  )}

                  {loginStep === 'signup' && (
                    <form className="form-body" onSubmit={handleSignup}>
                      <div className="input-group">
                        <input
                          type="text"
                          className="std-input"
                          placeholder="Username"
                          value={authUsername}
                          onChange={(e) => setAuthUsername(e.target.value)}
                          required
                        />
                      </div>
                      <div className="input-group">
                        <input
                          type="email"
                          className="std-input"
                          placeholder="Email Address"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="input-group">
                        <input
                          type="password"
                          className="std-input"
                          placeholder="Password"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          required
                        />
                      </div>
                      {authError && <p style={{ color: '#ff3d00', fontSize: '0.85rem', marginBottom: '10px' }}>{authError}</p>}
                      <button type="submit" className="auth-btn">Create Account</button>

                      <div className="form-divider">
                        <span>OR</span>
                      </div>

                      <div className="form-footer-switch">
                        <span>Already have an account?</span>
                        <button type="button" className="text-btn" onClick={() => setLoginStep('login')}>Log In</button>
                      </div>
                    </form>
                  )}

                  {loginStep === 'otp' && (
                    <div className="form-body">
                      <div className="otp-inputs">
                        <input type="text" maxLength="1" className="otp-digit" onChange={(e) => { if (e.target.value) e.target.nextElementSibling?.focus() }} onKeyDown={(e) => { if (e.key === 'Backspace' && !e.target.value) e.target.previousElementSibling?.focus() }} />
                        <input type="text" maxLength="1" className="otp-digit" onChange={(e) => { if (e.target.value) e.target.nextElementSibling?.focus() }} onKeyDown={(e) => { if (e.key === 'Backspace' && !e.target.value) e.target.previousElementSibling?.focus() }} />
                        <input type="text" maxLength="1" className="otp-digit" onChange={(e) => { if (e.target.value) e.target.nextElementSibling?.focus() }} onKeyDown={(e) => { if (e.key === 'Backspace' && !e.target.value) e.target.previousElementSibling?.focus() }} />
                        <input type="text" maxLength="1" className="otp-digit" onChange={(e) => { if (e.target.value) e.target.nextElementSibling?.focus() }} onKeyDown={(e) => { if (e.key === 'Backspace' && !e.target.value) e.target.previousElementSibling?.focus() }} />
                      </div>
                      <button className="auth-btn" onClick={() => { setIsLoggedIn(true); setShowLoginPopup(false); }}>Verify & Proceed</button>

                      <div className="form-footer-switch" style={{ marginTop: '20px' }}>
                        <span>Didn't receive the code?</span>
                        <button className="text-btn">Resend OTP</button>
                      </div>
                      <button className="text-btn" style={{ marginInline: 'auto', marginTop: '10px' }} onClick={() => setLoginStep('login')}>← Back to Login</button>
                    </div>
                  )}

                  <div className="form-terms">
                    By continuing, you agree to our <br />
                    <a href="#">Terms of Service</a> & <a href="#">Privacy Policy</a>
                  </div>

                  <div className="form-pwa-reminder" onClick={() => { setShowLoginPopup(false); setShowCustomInstallModal(true); }}>
                    <strong style={{ fontSize: '0.95rem' }}>📲 Install Jokes Studio App</strong><br />
                    <span style={{ fontSize: '0.8rem', opacity: 0.8, display: 'inline-block', marginTop: '4px' }}>Enjoy faster videos and offline access</span>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )
      }

      {/* 🌟 Share Modal Bottom Sheet */}
      {
        showShareModal && (
          <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
            <div className="share-bottom-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="share-header">
                <div className="share-title">{sharingItem?.isProfile ? `Share ${sharingItem.title}'s Profile 😄` : "Share the Laugh 😂"}</div>
                <div className="share-subtitle">{sharingItem?.isProfile ? "Let your friends discover comedy!" : (sharingItem?.title || "Indian Parents vs Kids")}</div>
              </div>

              <div className="share-grid">
                <div className="share-option" onClick={() => copyToClipboard(sharingItem?.shareUrl)}>
                  <div className="share-icon-circle">📋</div>
                  <div className="share-option-label">Copy Link</div>
                </div>
                <div className="share-option" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${sharingItem?.isProfile ? `😂 Check out ${sharingItem.title} on Jokes Studio!` : `😂 Watch this on Jokes Studio: ${sharingItem?.title}`}\n${sharingItem?.shareUrl} #JokesStudio`)}`, '_blank')}>
                  <div className="share-icon-circle">📱</div>
                  <div className="share-option-label">WhatsApp</div>
                </div>
                <div className="share-option" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sharingItem?.shareUrl)}`, '_blank')}>
                  <div className="share-icon-circle">📘</div>
                  <div className="share-option-label">Facebook</div>
                </div>
                <div className="share-option" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(sharingItem?.isProfile ? `😂 Check out ${sharingItem.title} on Jokes Studio!` : `😂 This made me laugh! ${sharingItem?.title}`)}&url=${encodeURIComponent(sharingItem?.shareUrl)}&hashtags=JokesStudio`, '_blank')}>
                  <div className="share-icon-circle">🐦</div>
                  <div className="share-option-label">Twitter</div>
                </div>
                <div className="share-option" onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(sharingItem?.shareUrl)}&text=${encodeURIComponent(sharingItem?.isProfile ? `😂 Check out ${sharingItem.title} on Jokes Studio!` : `😂 Check this out on Jokes Studio!`)}`, '_blank')}>
                  <div className="share-icon-circle">✈️</div>
                  <div className="share-option-label">Telegram</div>
                </div>
                <div className="share-option" onClick={() => window.open(`mailto:?subject=${encodeURIComponent(sharingItem?.isProfile ? `😂 Discover ${sharingItem.title} on Jokes Studio` : `😂 Hilarious Comedy on Jokes Studio`)}&body=${encodeURIComponent(`${sharingItem?.isProfile ? `Check out this creator: ${sharingItem.title}` : `Check out this video: ${sharingItem?.title}`}\n\n${sharingItem?.shareUrl}`)}`, '_blank')}>
                  <div className="share-icon-circle">✉️</div>
                  <div className="share-option-label">Email</div>
                </div>
              </div>

              <button className="share-cancel-btn" onClick={() => setShowShareModal(false)}>Cancel</button>
            </div>
          </div>
        )
      }

      {/* 📋 Copy Toast Notification */}
      {
        showCopyToast && (
          <div className="copy-toast">
            Link copied! Share the laughs 😂
          </div>
        )
      }

      {
        selectedVideoHome && (
          <VideoModal video={selectedVideoHome} onClose={() => setSelectedVideoHome(null)} startWithComments={modalConfig.startWithComments} />
        )
      }

      {renderPartnerFlow()}
      {renderPartnerSuccessModal()}
    </div >
  )
}

export default App


