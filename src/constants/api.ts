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
    WALLET: {
        BALANCE: (userId: string) => `${API_URL}/wallet/${userId}/balance`,
        TRANSACTIONS: (userId: string) => `${API_URL}/wallet/${userId}/transactions`,
        TRANSACTION_DETAIL: (id: string) => `${API_URL}/wallet/transactions/${id}`,
        FUND: `${API_URL}/wallet/fund`,
    },
    PAYMENT_METHODS: {
        LIST: `${API_URL}/wallet/payment-methods`,
        CREATE: `${API_URL}/wallet/payment-methods`,
        DELETE: (id: string) => `${API_URL}/wallet/payment-methods/${id}`,
    },
    MESSAGES: {
        CONVERSATIONS: `${API_URL}/chat/conversations`,
        HISTORY: (id: string) => `${API_URL}/chat/${id}/history`,
        SEND: `${API_URL}/chat/messages`,
        WS: (id: string, token: string) => `ws://172.20.10.9:8000/api/v1/chat/ws/${id}?token=${token}`,
    },
    NOTIFICATIONS: {
        LIST: `${API_URL}/notifications/`,
        READ: (id: string) => `${API_URL}/notifications/${id}/read`,
        CLEAR_ALL: `${API_URL}/notifications/clear-all`,
        UNREAD_COUNT: `${API_URL}/notifications/unread-count`,
    },
    RUNNER: {
        ACTIVE_COUNT: (lat?: number, lng?: number) => 
            `${API_URL}/runners/active-count${lat && lng ? `?lat=${lat}&lng=${lng}` : ''}`,
        GET: (id: string) => `${API_URL}/runners/${id}`,
    },
    SEARCH: {
        RUNNERS: (q?: string, filter?: string, market?: string) => {
            let url = `${API_URL}/search/runners?`;
            if (q) url += `q=${encodeURIComponent(q)}&`;
            if (filter) url += `filter=${filter}&`;
            if (market) url += `market=${encodeURIComponent(market)}&`;
            return url.slice(0, -1);
        },
        RECORD: `${API_URL}/search/record`
    }
};
