import api from './api';

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const dashboardApi = {
  getOverview: () => api.get('/analytics/dashboard'),
  getRevenue: () => api.get('/analytics/revenue'),
  getPropertyAnalytics: () => api.get('/analytics/properties/by-type'),
  getTopDealers: () => api.get('/analytics/dealers/top'),
  getRecentActivity: () => api.get('/analytics/activity'),
};

export const userApi = {
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  updateStatus: (id: string, data: { isActive: boolean }) =>
    api.put(`/users/${id}/status`, data),
};

export const dealerApi = {
  getAll: (params?: any) => api.get('/dealers', { params }),
  getPending: () => api.get('/dealers/pending'),
  getById: (id: string) => api.get(`/dealers/${id}`),
  approve: (id: string) => api.put(`/dealers/${id}/approve`),
  reject: (id: string, reason: string) =>
    api.put(`/dealers/${id}/reject`, { reason }),
  suspend: (id: string) => api.put(`/dealers/${id}/suspend`),
  getAnalytics: () => api.get('/dealers/analytics/overview'),
};

export const propertyApi = {
  getAll: (params?: any) => api.get('/properties', { params }),
  getPending: () => api.get('/properties/pending'),
  getById: (id: string) => api.get(`/properties/${id}`),
  approve: (id: string) => api.put(`/properties/${id}/approve`),
  reject: (id: string, reason: string) =>
    api.put(`/properties/${id}/reject`, { reason }),
  suspend: (id: string) => api.put(`/properties/${id}/suspend`),
  feature: (id: string, isFeatured: boolean) =>
    api.put(`/properties/${id}/feature`, { isFeatured }),
  getAnalytics: () => api.get('/properties/analytics/overview'),
};

export const bookingApi = {
  getAll: (params?: any) => api.get('/bookings', { params }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  updateStatus: (id: string, data: { status: string; reason?: string }) =>
    api.put(`/bookings/${id}/status`, data),
  getAnalytics: () => api.get('/bookings/analytics/overview'),
};

export const paymentApi = {
  getAll: (params?: any) => api.get('/payments', { params }),
  getById: (id: string) => api.get(`/payments/${id}`),
  refund: (id: string, data: { amount: number; reason: string }) =>
    api.put(`/payments/${id}/refund`, data),
  getAnalytics: () => api.get('/payments/analytics/overview'),
};

export const reviewApi = {
  getAll: (params?: any) => api.get('/reviews', { params }),
  flag: (id: string, isFlagged: boolean) =>
    api.put(`/reviews/${id}/flag`, { isFlagged }),
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

export const enquiryApi = {
  getAll: (params?: any) => api.get('/enquiries', { params }),
  updateStatus: (id: string, status: string) =>
    api.put(`/enquiries/${id}/status`, { status }),
  getAnalytics: () => api.get('/enquiries/analytics/overview'),
};

export const complaintApi = {
  getAll: (params?: any) => api.get('/complaints', { params }),
  getById: (id: string) => api.get(`/complaints/${id}`),
  update: (id: string, data: any) => api.put(`/complaints/${id}`, data),
  getAnalytics: () => api.get('/complaints/analytics/overview'),
};

export const offerApi = {
  getCoupons: (params?: any) => api.get('/offers/coupons', { params }),
  createCoupon: (data: any) => api.post('/offers/coupons', data),
  updateCoupon: (id: string, data: any) => api.put(`/offers/coupons/${id}`, data),
  deleteCoupon: (id: string) => api.delete(`/offers/coupons/${id}`),
};

export const settingsApi = {
  getAll: () => api.get('/settings'),
  update: (settings: Record<string, string>) =>
    api.put('/settings', { settings }),
  getCommission: () => api.get('/settings/commission'),
  updateCommission: (rates: Record<string, number>) =>
    api.put('/settings/commission', { rates }),
};

export const auditApi = {
  getAll: (params?: any) => api.get('/audit', { params }),
};

export const notificationApi = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  sendBulk: (data: any) => api.post('/notifications/bulk', data),
};

// ─── Owner API ──────────────────────────────────────
export const ownerApi = {
  // Dashboard
  getDashboard: () => api.get('/owner/dashboard'),
  getPropertySummary: () => api.get('/owner/property-summary'),

  // Profile
  getProfile: () => api.get('/owner/profile'),
  updateProfile: (data: any) => api.put('/owner/profile', data),

  // Properties
  getProperties: (params?: any) => api.get('/owner/properties', { params }),
  getProperty: (id: string) => api.get(`/owner/properties/${id}`),
  createProperty: (data: any) => api.post('/owner/properties', data),
  updateProperty: (id: string, data: any) => api.put(`/owner/properties/${id}`, data),
  submitProperty: (id: string) => api.put(`/owner/properties/${id}/submit`),

  // Rooms
  getRooms: (propertyId: string) => api.get(`/owner/properties/${propertyId}/rooms`),
  createRoom: (propertyId: string, data: any) => api.post(`/owner/properties/${propertyId}/rooms`, data),
  updateRoom: (id: string, data: any) => api.put(`/owner/rooms/${id}`, data),
  deleteRoom: (id: string) => api.delete(`/owner/rooms/${id}`),

  // Beds
  toggleBed: (id: string) => api.put(`/owner/beds/${id}/toggle`),

  // Bookings
  getBookings: (params?: any) => api.get('/owner/bookings', { params }),
  getBooking: (id: string) => api.get(`/owner/bookings/${id}`),
  updateBookingStatus: (id: string, data: any) => api.put(`/owner/bookings/${id}/status`, data),

  // Enquiries
  getEnquiries: (params?: any) => api.get('/owner/enquiries', { params }),
  updateEnquiryStatus: (id: string, data: any) => api.put(`/owner/enquiries/${id}/status`, data),

  // Reviews
  getReviews: (params?: any) => api.get('/owner/reviews', { params }),
  replyToReview: (id: string, data: { ownerReply: string }) => api.put(`/owner/reviews/${id}/reply`, data),

  // Finance
  getFinanceOverview: () => api.get('/owner/finance/overview'),

  // Notifications
  getNotifications: (params?: any) => api.get('/owner/notifications', { params }),
  markNotificationRead: (id: string) => api.put(`/owner/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/owner/notifications/read-all'),

  // Documents
  getDocuments: () => api.get('/owner/documents'),
  uploadDocument: (data: any) => api.post('/owner/documents', data),
  deleteDocument: (id: string) => api.delete(`/owner/documents/${id}`),

  // Inventory
  getInventory: (params?: any) => api.get('/owner/inventory', { params }),

  // Analytics
  getAnalytics: () => api.get('/owner/analytics'),

  // Offers
  getOffers: (params?: any) => api.get('/owner/offers', { params }),
  createOffer: (data: any) => api.post('/owner/offers', data),
  updateOffer: (id: string, data: any) => api.put(`/owner/offers/${id}`, data),
  deleteOffer: (id: string) => api.delete(`/owner/offers/${id}`),

  // Support
  getSupportTickets: (params?: any) => api.get('/owner/support', { params }),
  createSupportTicket: (data: any) => api.post('/owner/support', data),
  getSupportTicket: (id: string) => api.get(`/owner/support/${id}`),
  replyToSupport: (id: string, data: { message: string }) => api.post(`/owner/support/${id}/reply`, data),

  // FAQs
  getFaqs: () => api.get('/owner/faqs'),
};

// ─── Buyer API ──────────────────────────────────────
export const buyerApi = {
  // Dashboard
  getDashboard: () => api.get('/buyer/dashboard'),

  // Explore / Search
  explore: (params?: any) => api.get('/buyer/explore', { params }),
  getProperty: (id: string) => api.get(`/buyer/properties/${id}`),
  getPopularLocations: () => api.get('/buyer/locations/popular'),
  getCategories: () => api.get('/buyer/categories'),

  // Wishlist
  getWishlist: (params?: any) => api.get('/buyer/wishlist', { params }),
  toggleWishlist: (propertyId: string) => api.post(`/buyer/wishlist/${propertyId}`),

  // Collections
  getCollections: () => api.get('/buyer/collections'),
  createCollection: (data: { name: string; icon?: string }) => api.post('/buyer/collections', data),
  addToCollection: (collectionId: string, propertyId: string) => api.post(`/buyer/collections/${collectionId}/items`, { propertyId }),
  removeFromCollection: (collectionId: string, propertyId: string) => api.delete(`/buyer/collections/${collectionId}/items/${propertyId}`),

  // Bookings
  getBookings: (params?: any) => api.get('/buyer/bookings', { params }),
  getBooking: (id: string) => api.get(`/buyer/bookings/${id}`),
  createBooking: (data: any) => api.post('/buyer/bookings', data),
  cancelBooking: (id: string, reason?: string) => api.put(`/buyer/bookings/${id}/cancel`, { reason }),

  // Enquiries
  getEnquiries: (params?: any) => api.get('/buyer/enquiries', { params }),
  createEnquiry: (data: any) => api.post('/buyer/enquiries', data),

  // Reviews
  getReviews: (params?: any) => api.get('/buyer/reviews', { params }),
  createReview: (data: any) => api.post('/buyer/reviews', data),

  // Messages
  getConversations: () => api.get('/buyer/messages'),
  getConversation: (id: string) => api.get(`/buyer/messages/${id}`),
  sendMessage: (data: { receiverId: string; content: string; propertyId?: string }) => api.post('/buyer/messages', data),

  // Payments
  getPayments: (params?: any) => api.get('/buyer/payments', { params }),

  // Notifications
  getNotifications: (params?: any) => api.get('/buyer/notifications', { params }),
  markNotificationRead: (id: string) => api.put(`/buyer/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/buyer/notifications/read-all'),

  // Saved Searches
  getSavedSearches: () => api.get('/buyer/saved-searches'),
  createSavedSearch: (data: any) => api.post('/buyer/saved-searches', data),
  deleteSavedSearch: (id: string) => api.delete(`/buyer/saved-searches/${id}`),

  // Saved Locations
  getSavedLocations: () => api.get('/buyer/saved-locations'),
  createSavedLocation: (data: any) => api.post('/buyer/saved-locations', data),
  deleteSavedLocation: (id: string) => api.delete(`/buyer/saved-locations/${id}`),

  // Profile
  getProfile: () => api.get('/buyer/profile'),
  updateProfile: (data: any) => api.put('/buyer/profile', data),

  // Become Owner
  becomeOwner: (data: any) => api.post('/buyer/become-owner', data),

  // Compare
  compare: (propertyIds: string[]) => api.post('/buyer/compare', { propertyIds }),
};
