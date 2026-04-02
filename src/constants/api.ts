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
    }
};
