const API_URL = 'http://127.0.0.1:8000/api';

export const loginUser = async (username, password) => {
    const response = await fetch(`${API_URL}/login/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.non_field_errors || 'Login failed');
    }
    return response.json();
};

export const signupUser = async (username, email, password) => {
    const response = await fetch(`${API_URL}/signup/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData) || 'Signup failed');
    }
    return response.json();
};

export const getProfile = async (token) => {
    if (!token) {
        throw new Error('Unauthorized');
    }
    const response = await fetch(`${API_URL}/profile/`, {
        method: 'GET',
        headers: {
            'Authorization': `Token ${token}`,
        },
    });
    if (response.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Unauthorized');
    }
    if (!response.ok) {
        throw new Error('Failed to fetch profile');
    }
    return response.json();
};

export const getHomeData = async (tokenOverride) => {
    const token = tokenOverride === undefined ? localStorage.getItem('token') : tokenOverride;
    const headers = {};
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    const response = await fetch(`${API_URL}/home/`, {
        headers,
    });
    if (response.status === 401 && token) {
        // Token is stale; clear it and retry as guest to avoid repeated unauthorized calls.
        localStorage.removeItem('token');
        const guestResponse = await fetch(`${API_URL}/home/`);
        if (!guestResponse.ok) {
            throw new Error('Failed to fetch home data');
        }
        return guestResponse.json();
    }
    if (!response.ok) {
        throw new Error('Failed to fetch home data');
    }
    return response.json();
};

export const getPopularData = async () => {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    const response = await fetch(`${API_URL}/popular/`, { headers });
    if (!response.ok) {
        throw new Error('Failed to fetch popular data');
    }
    return response.json();
};

export const getStandupData = async () => {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    const response = await fetch(`${API_URL}/standup/`, { headers });
    if (response.status === 401 && token) {
        localStorage.removeItem('token');
        const guestResponse = await fetch(`${API_URL}/standup/`);
        if (!guestResponse.ok) {
            throw new Error('Failed to fetch standup data');
        }
        return guestResponse.json();
    }
    if (!response.ok) {
        throw new Error('Failed to fetch standup data');
    }
    return response.json();
};

export const getMemesData = async () => {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    const response = await fetch(`${API_URL}/memes/`, { headers });
    if (response.status === 401 && token) {
        localStorage.removeItem('token');
        const guestResponse = await fetch(`${API_URL}/memes/`);
        if (!guestResponse.ok) {
            throw new Error('Failed to fetch memes data');
        }
        return guestResponse.json();
    }
    if (!response.ok) {
        throw new Error('Failed to fetch memes data');
    }
    return response.json();
};

export const getNewHotData = async () => {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    const response = await fetch(`${API_URL}/newhot/`, { headers });
    if (response.status === 401 && token) {
        localStorage.removeItem('token');
        const guestResponse = await fetch(`${API_URL}/newhot/`);
        if (!guestResponse.ok) {
            throw new Error('Failed to fetch new & hot data');
        }
        return guestResponse.json();
    }
    if (!response.ok) {
        throw new Error('Failed to fetch new & hot data');
    }
    return response.json();
};

export const getVideoFeed = async () => {
    const response = await fetch(`${API_URL}/feed/`);
    if (!response.ok) {
        throw new Error('Failed to fetch video feed');
    }
    return response.json();
};

export const likeVideo = async (videoId, action) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    const response = await fetch(`${API_URL}/video/${videoId}/like/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action }),
    });
    return response.json();
};

export const addComment = async (videoId, user_name, text) => {
    const response = await fetch(`${API_URL}/video/${videoId}/comment/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_name, text }),
    });
    return response.json();
};
export const submitVideoRequest = async (token, videoData) => {
    const isFormData = videoData instanceof FormData;
    const headers = {
        'Authorization': `Token ${token}`,
    };
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}/upload/`, {
        method: 'POST',
        headers: headers,
        body: isFormData ? videoData : JSON.stringify(videoData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Submission failed');
    }
    return response.json();
};

export const getCreators = async () => {
    const response = await fetch(`${API_URL}/creators/`);
    if (!response.ok) {
        throw new Error('Failed to fetch creators');
    }
    return response.json();
};

/**
 * Polls the backend for newly approved videos belonging to the logged-in user.
 * The backend marks them as notified=True after returning, so this is a one-shot per video.
 */
export const checkVideoApprovals = async (token) => {
    if (!token) return [];
    try {
        const response = await fetch(`${API_URL}/videos/approvals/`, {
            headers: { Authorization: `Token ${token}` },
        });
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
};

/**
 * Lead registration (Initial Gateway)
 */
export const registerViewer = async (name, whatsapp) => {
    try {
        const response = await fetch(`${API_URL}/register-viewer/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, whatsapp }),
        });
        return response.json();
    } catch {
        return { error: 'Failed to register viewer' };
    }
};

/**
 * Partner flow: Step 2 (Signup)
 */
export const partnerSignup = async (email, mobile, password) => {
    try {
        const response = await fetch(`${API_URL}/partner-signup/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, mobile, password }),
        });
        return response.json();
    } catch {
        return { error: 'Failed' };
    }
};

export const requestPartnerOTP = async (token, mobile) => {
    try {
        const response = await fetch(`${API_URL}/partner-request-otp/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify({ mobile }),
        });
        return response.json();
    } catch {
        return { error: 'Failed' };
    }
};

export const confirmPartnerOTP = async (mobile, otp) => {
    try {
        const response = await fetch(`${API_URL}/verify-otp/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile, otp }),
        });
        return response.json();
    } catch {
        return { error: 'Failed' };
    }
};

/**
 * Partner flow: Step 3 (OTP) & Step 4 (Payment/Submit Application)
 */
export const partnerApply = async (token, data) => {
    try {
        const response = await fetch(`${API_URL}/partner-apply/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify(data),
        });
        const json = await response.json();
        if (!response.ok) {
            console.warn('partnerApply non-OK:', response.status, json);
            return { error: json?.detail || json?.error || 'Submission failed' };
        }
        return json;
    } catch (err) {
        console.error('partnerApply network error:', err);
        return { error: 'Network error' };
    }
};

/**
 * Status Polling (Admin approval)
 */
export const checkPartnerStatus = async (token) => {
    if (!token) return { approved: false };
    try {
        const response = await fetch(`${API_URL}/partner-status-check/`, {
            headers: { Authorization: `Token ${token}` },
        });
        if (response.status === 401) {
            localStorage.removeItem('token');
            return { approved: false };
        }
        return response.json();
    } catch {
        return { approved: false };
    }
};

export const getNotifications = async (token) => {
    if (!token) return [];
    try {
        const response = await fetch(`${API_URL}/notifications/`, {
            headers: { Authorization: `Token ${token}` },
        });
        if (response.status === 401) {
            localStorage.removeItem('token');
            return [];
        }
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
};
export const toggleFollow = async (token, userId) => {
    try {
        const response = await fetch(`${API_URL}/user/${userId}/follow/`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            },
        });
        return response.json();
    } catch {
        return { error: 'Failed' };
    }
};

export const recordWatch = async (videoId) => {
    const token = localStorage.getItem('token');
    if (!token) return; // Silent skip for guests
    try {
        const response = await fetch(`${API_URL}/video/${videoId}/watch/`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.json();
    } catch (err) {
        console.warn('Failed to record watch', err);
    }
};

export const saveVideo = async (videoId, action) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const response = await fetch(`${API_URL}/video/${videoId}/save/`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action })
        });
        return response.json();
    } catch (err) {
        console.warn('Failed to save video', err);
    }
};
export const getActiveSubscription = async (token) => {
    if (!token) return { has_plan: false };
    try {
        const response = await fetch(`${API_URL}/active-subscription/`, {
            headers: { Authorization: `Token ${token}` },
        });
        if (response.status === 401) {
            localStorage.removeItem('token');
            return { has_plan: false };
        }
        if (!response.ok) return { has_plan: false };
        return response.json();
    } catch {
        return { has_plan: false };
    }
};
