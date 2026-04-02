const API_URL = 'http://172.20.10.9:8000/api/v1'; // Default for local dev

export default {
    API_URL,
    AUTH: {
        LOGIN: `${API_URL}/auth/token`,
        SIGNUP: `${API_URL}/auth/signup`,
    },
    WAKA: {
        CREATE: `${API_URL}/waka/`,
        GET: (id: string) => `${API_URL}/waka/${id}`,
        MY_WAKAS: `${API_URL}/waka/mine`,
        ACTIVE: `${API_URL}/waka/active`,
        CANCEL: (id: string) => `${API_URL}/waka/${id}/cancel`,
        COMPLETE: (id: string) => `${API_URL}/waka/${id}/complete`,
    },
};
