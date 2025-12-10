import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3060/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post("/auth/login", { email, password }),
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => apiClient.post("/auth/register", data),
  getProfile: () => apiClient.get("/auth/profile"),
  updateProfile: (data: { name?: string; phone?: string; avatar?: string }) =>
    apiClient.put("/auth/profile", data),
  changePassword: (oldPassword: string, newPassword: string) =>
    apiClient.put("/auth/change-password", { oldPassword, newPassword }),
};

export const productsAPI = {
  getAll: (params?: any) => apiClient.get("/products", { params }),
  getById: (id: number) => apiClient.get(`/products/${id}`),
  create: (data: any) => apiClient.post("/products", data),
  update: (id: number, data: any) => apiClient.put(`/products/${id}`, data),
  delete: (id: number) => apiClient.delete(`/products/${id}`),
  getLowStock: () => apiClient.get("/products/low-stock"),
};

export const categoriesAPI = {
  getAll: () => apiClient.get("/categories"),
  getRoots: () => apiClient.get("/categories/roots"),
  getById: (id: number) => apiClient.get(`/categories/${id}`),
  getChildren: (id: number) => apiClient.get(`/categories/${id}/children`),
  create: (data: { name: string; description?: string; parentId?: number }) =>
    apiClient.post("/categories", data),
  update: (id: number, data: any) => apiClient.put(`/categories/${id}`, data),
  delete: (id: number) => apiClient.delete(`/categories/${id}`),
};

export const customersAPI = {
  getAll: (params?: any) => apiClient.get("/customers", { params }),
  getById: (id: number) => apiClient.get(`/customers/${id}`),
  create: (data: any) => apiClient.post("/customers", data),
  update: (id: number, data: any) => apiClient.put(`/customers/${id}`, data),
  delete: (id: number) => apiClient.delete(`/customers/${id}`),
  updateTotals: (id: number) => apiClient.put(`/customers/${id}/update-totals`),
};

export const customerTypesAPI = {
  getAll: () => apiClient.get("/customer-types"),
  getById: (id: number) => apiClient.get(`/customer-types/${id}`),
  create: (data: { name: string; description?: string }) =>
    apiClient.post("/customer-types", data),
  update: (id: number, data: any) =>
    apiClient.put(`/customer-types/${id}`, data),
  delete: (id: number) => apiClient.delete(`/customer-types/${id}`),
};

export const suppliersAPI = {
  getAll: (params?: any) => apiClient.get("/suppliers", { params }),
  getById: (id: number) => apiClient.get(`/suppliers/${id}`),
  create: (data: any) => apiClient.post("/suppliers", data),
  update: (id: number, data: any) => apiClient.put(`/suppliers/${id}`, data),
  delete: (id: number) => apiClient.delete(`/suppliers/${id}`),
};

export const ordersAPI = {
  getAll: (params?: any) => apiClient.get("/orders", { params }),
  getById: (id: number) => apiClient.get(`/orders/${id}`),
  create: (data: any) => apiClient.post("/orders", data),
  update: (id: number, data: any) => apiClient.put(`/orders/${id}`, data),
  delete: (id: number) => apiClient.delete(`/orders/${id}`),
};

export const orderPaymentsAPI = {
  create: (data: any) => apiClient.post("/order-payments", data),
  getByOrderId: (orderId: number) =>
    apiClient.get(`/order-payments/order/${orderId}`),
  delete: (id: number) => apiClient.delete(`/order-payments/${id}`),
};

export const purchaseOrdersAPI = {
  getAll: (params?: any) => apiClient.get("/purchase-orders", { params }),
  getById: (id: number) => apiClient.get(`/purchase-orders/${id}`),
  create: (data: any) => apiClient.post("/purchase-orders", data),
  update: (id: number, data: any) =>
    apiClient.put(`/purchase-orders/${id}`, data),
  delete: (id: number) => apiClient.delete(`/purchase-orders/${id}`),
};

export const dashboardAPI = {
  getStats: () => apiClient.get("/dashboard/stats"),
  getRevenueChart: (months?: number) =>
    apiClient.get("/dashboard/revenue-chart", { params: { months } }),
  getTopCustomers: (limit?: number) =>
    apiClient.get("/dashboard/top-customers", { params: { limit } }),
  getLowStock: (limit?: number) =>
    apiClient.get("/dashboard/low-stock", { params: { limit } }),
  getRecentOrders: (limit?: number) =>
    apiClient.get("/dashboard/recent-orders", { params: { limit } }),
};

export const reportsAPI = {
  getSales: (dateFrom: string, dateTo: string) =>
    apiClient.get("/reports/sales", { params: { dateFrom, dateTo } }),
  getProducts: (dateFrom?: string, dateTo?: string) =>
    apiClient.get("/reports/products", { params: { dateFrom, dateTo } }),
  getCustomers: (dateFrom?: string, dateTo?: string) =>
    apiClient.get("/reports/customers", { params: { dateFrom, dateTo } }),
  getInventory: () => apiClient.get("/reports/inventory"),
  getFinancial: (dateFrom: string, dateTo: string) =>
    apiClient.get("/reports/financial", { params: { dateFrom, dateTo } }),
};

export const exportAPI = {
  products: () => apiClient.get("/export/products", { responseType: "blob" }),
  orders: (dateFrom?: string, dateTo?: string) =>
    apiClient.get("/export/orders", {
      params: { dateFrom, dateTo },
      responseType: "blob",
    }),
  customers: () => apiClient.get("/export/customers", { responseType: "blob" }),
};

export const pdfAPI = {
  orderInvoice: (id: number) =>
    apiClient.get(`/pdf/order/${id}/invoice`, { responseType: "blob" }),
};

export const postsAPI = {
  getAll: (params?: any) => apiClient.get("/posts", { params }),
  getById: (id: number) => apiClient.get(`/posts/${id}`),
  getBySlug: (slug: string) => apiClient.get(`/posts/slug/${slug}`),
  create: (data: any) => apiClient.post("/posts", data),
  update: (id: number, data: any) => apiClient.put(`/posts/${id}`, data),
  delete: (id: number) => apiClient.delete(`/posts/${id}`),
  publish: (id: number) => apiClient.post(`/posts/${id}/publish`),
  unpublish: (id: number) => apiClient.post(`/posts/${id}/unpublish`),
};

export const tagsAPI = {
  getAll: () => apiClient.get("/tags"),
  getById: (id: number) => apiClient.get(`/tags/${id}`),
  getBySlug: (slug: string) => apiClient.get(`/tags/slug/${slug}`),
  create: (data: { name: string; slug?: string; description?: string }) =>
    apiClient.post("/tags", data),
  update: (id: number, data: any) => apiClient.put(`/tags/${id}`, data),
  delete: (id: number) => apiClient.delete(`/tags/${id}`),
};

export const rolesAPI = {
  getAll: () => apiClient.get("/roles"),
  getById: (id: number) => apiClient.get(`/roles/${id}`),
  create: (data: any) => apiClient.post("/roles", data),
  update: (id: number, data: any) => apiClient.put(`/roles/${id}`, data),
  delete: (id: number) => apiClient.delete(`/roles/${id}`),
  assignPermissions: (id: number, permissionIds: number[]) =>
    apiClient.put(`/roles/${id}/permissions`, { permissionIds }),
};

export const permissionsAPI = {
  getAll: () => apiClient.get("/permissions"),
  getGrouped: () => apiClient.get("/permissions/grouped"),
  getById: (id: number) => apiClient.get(`/permissions/${id}`),
  getByResource: (resource: string) =>
    apiClient.get(`/permissions/resource/${resource}`),
  create: (data: any) => apiClient.post("/permissions", data),
  update: (id: number, data: any) => apiClient.put(`/permissions/${id}`, data),
  delete: (id: number) => apiClient.delete(`/permissions/${id}`),
};

export const productVariantsAPI = {
  getAll: () => apiClient.get("/product-variants"),
  getById: (id: number) => apiClient.get(`/product-variants/${id}`),
  create: (data: { name: string; code: string; description?: string }) =>
    apiClient.post("/product-variants", data),
  update: (id: number, data: any) =>
    apiClient.put(`/product-variants/${id}`, data),
  delete: (id: number) => apiClient.delete(`/product-variants/${id}`),
};

export const uploadAPI = {
  image: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  delete: (filename: string) => apiClient.delete(`/upload/${filename}`),
};

export default apiClient;
