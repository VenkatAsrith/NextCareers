const API_BASE = 'http://localhost:5000/api';

// Retrieve token from local storage
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Main fetch wrapper with authentication
export const apiRequest = async (path: string, options: RequestInit = {}) => {
  const token = getToken();
  
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

// API Services
export const authService = {
  register: (body: any) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => apiRequest('/auth/me'),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }
};

export const predictorService = {
  predict: (body: { rank: number; category: string; gender: string }) => 
    apiRequest('/predict', { method: 'POST', body: JSON.stringify(body) })
};

export const collegeService = {
  getColleges: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.set(key, String(val));
      }
    });
    const queryString = query.toString();
    return apiRequest(`/colleges?${queryString}`);
  },
  getFilters: () => apiRequest('/colleges/filters'),
  getCollegeById: (id: string) => apiRequest(`/colleges/${id}`)
};

export const wishlistService = {
  getWishlist: () => apiRequest('/wishlist'),
  addToWishlist: (body: { collegeCode: string; branchCode: string }) => 
    apiRequest('/wishlist', { method: 'POST', body: JSON.stringify(body) }),
  deleteFromWishlist: (id: string) => apiRequest(`/wishlist/${id}`, { method: 'DELETE' })
};

export const counsellingService = {
  getBoard: () => apiRequest('/counselling'),
  saveBoard: (options: { collegeCode: string; branchCode: string; priority: number }[]) => 
    apiRequest('/counselling/save', { method: 'POST', body: JSON.stringify({ options }) }),
  reorder: (options: { collegeCode: string; branchCode: string; priority: number }[]) => 
    apiRequest('/counselling/reorder', { method: 'PUT', body: JSON.stringify({ options }) })
};

export const profileService = {
  getProfile: () => apiRequest('/profile'),
  updateProfile: (body: any) => apiRequest('/profile', { method: 'PUT', body: JSON.stringify(body) })
};

export const adminService = {
  getDashboardStats: () => apiRequest('/admin/dashboard')
};

export const chatService = {
  sendMessage: (message: string) => 
    apiRequest('/chat', { method: 'POST', body: JSON.stringify({ message }) })
};
