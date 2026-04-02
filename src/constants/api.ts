const API_URL = 'http://172.20.10.9:8000/api/v1'; // Default for local dev

export default {
    API_URL,
    AUTH: {
        LOGIN: `${API_URL}/auth/token`,
        SIGNUP: `${API_URL}/auth/signup`,
    }
};
