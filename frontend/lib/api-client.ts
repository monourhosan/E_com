const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "customer";
  phone?: string | null;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  description: string | null;
  price: number;
  formatted_price: string;
  stock: number;
  status: "active" | "draft" | "archived";
  image_url: string;
  is_in_stock: boolean;
  stock_badge: "in_stock" | "low_stock" | "out_of_stock";
  created_at?: string;
  updated_at?: string;
}

export interface CartValidationItem {
  product_id: number;
  name: string;
  sku: string;
  category?: string;
  image_url?: string;
  unit_price: number;
  formatted_unit_price: string;
  quantity: number;
  subtotal: number;
  formatted_subtotal: string;
  available_stock: number;
  is_stock_sufficient: boolean;
}

export interface CartValidationSummary {
  subtotal: number;
  tax: number;
  tax_rate_percent: number;
  shipping_fee: number;
  free_shipping_threshold: number;
  is_free_shipping: boolean;
  amount_needed_for_free_shipping: number;
  total_amount: number;
  formatted_subtotal: string;
  formatted_tax: string;
  formatted_shipping_fee: string;
  formatted_total_amount: string;
}

export interface CartValidationResponse {
  valid: boolean;
  errors: string[];
  items: CartValidationItem[];
  summary: CartValidationSummary;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  unit_price: number;
  formatted_unit_price: string;
  quantity: number;
  subtotal: number;
  formatted_subtotal: string;
  image_url?: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  shipping_address: string;
  subtotal: number;
  formatted_subtotal: string;
  tax: number;
  formatted_tax: string;
  shipping_fee: number;
  formatted_shipping_fee: string;
  total_amount: number;
  formatted_total_amount: string;
  status: "pending_payment" | "paid" | "processing" | "dispatched" | "completed" | "cancelled";
  payment_method: "bkash" | "sslcommerz" | "cod";
  notes?: string | null;
  items?: OrderItem[];
  items_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CheckoutPayload {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  shipping_address: string;
  payment_method: "bkash" | "sslcommerz" | "cod";
  notes?: string;
  items: {
    product_id: number;
    quantity: number;
  }[];
}

export interface CheckoutResponse {
  data: Order;
}

export interface PaymentMethodSettings {
  bkash_enabled: boolean;
  sslcommerz_enabled: boolean;
  cod_enabled: boolean;
  active_gateway?: string;
  sandbox_mode: boolean;
  credentials_status?: {
    bkash_configured: boolean;
    sslcommerz_configured: boolean;
  };
}

export interface PaymentInitiationData {
  gateway: string;
  payment_id: string;
  payment_record_id: number;
  amount: number;
  currency: string;
  order_number: string;
  redirect_url: string;
  is_sandbox: boolean;
}

export interface PaymentInitiationResponse {
  status: string;
  message: string;
  data: PaymentInitiationData;
}

export interface PaymentCallbackPayload {
  payment_record_id?: number;
  payment_id?: string;
  transaction_id?: string;
  status?: string;
  simulate_failure?: boolean;
  reason?: string;
}

export interface PaymentCallbackResponse {
  status: string;
  message: string;
  order_number?: string;
  transaction_id?: string;
  reason?: string;
}

export interface PaginatedMeta {
  current_page: number;
  from?: number;
  last_page: number;
  per_page: number;
  to?: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta?: PaginatedMeta;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  sort?: "price_asc" | "price_desc" | "latest" | "name_asc";
  page?: number;
  per_page?: number;
  status?: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  access_token: string;
  token_type: string;
  user: User;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  database: string;
  service: string;
  environment?: string;
  version?: string;
}

export interface AdminDashboardResponse {
  status: string;
  message: string;
  admin: User;
  timestamp: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Client-side token storage helper
export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("apex_auth_token");
  },
  set: (token: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("apex_auth_token", token);
    }
  },
  remove: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("apex_auth_token");
    }
  },
};

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const token = tokenStorage.get();

  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers as Record<string, string>),
      },
      credentials: "include",
    });

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      throw new ApiError(
        (errorBody as { message?: string })?.message ||
          `API request failed with status ${response.status}`,
        response.status,
        errorBody
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Network error occurred while contacting API"
    );
  }
}

function buildQueryString(params: Record<string, unknown>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export const api = {
  health: {
    check: () => fetchApi<HealthCheckResponse>("/health"),
  },
  auth: {
    login: (credentials: { email: string; password: string }) =>
      fetchApi<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    logout: () =>
      fetchApi<{ status: string; message: string }>("/auth/logout", {
        method: "POST",
      }),
    me: () => fetchApi<{ status: string; user: User }>("/auth/me"),
  },
  store: {
    getProducts: (filters: ProductFilters = {}) =>
      fetchApi<PaginatedResponse<Product>>(`/store/products${buildQueryString(filters as Record<string, unknown>)}`),
    getProduct: (idOrSku: string | number) =>
      fetchApi<{ data: Product }>(`/store/products/${idOrSku}`),
    validateCart: (payload: { items: { product_id: number; quantity: number }[] }) =>
      fetchApi<CartValidationResponse>("/store/cart/validate", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    checkout: (payload: CheckoutPayload) =>
      fetchApi<CheckoutResponse>("/store/checkout", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    getOrder: (orderNumber: string) =>
      fetchApi<{ data: Order }>(`/store/orders/${orderNumber}`),
    getPaymentMethods: () =>
      fetchApi<{
        status: string;
        methods: { bkash: boolean; sslcommerz: boolean; cod: boolean };
        active_gateway: string;
        sandbox_mode: boolean;
      }>("/store/settings/payment-methods"),
    initiatePayment: (orderNumber: string, gateway?: string) =>
      fetchApi<PaymentInitiationResponse>(`/store/orders/${orderNumber}/pay`, {
        method: "POST",
        body: JSON.stringify({ gateway }),
      }),
    verifyPaymentCallback: (gateway: string, payload: PaymentCallbackPayload) =>
      fetchApi<PaymentCallbackResponse>(`/payments/callback/${gateway}`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
  admin: {
    dashboard: () => fetchApi<AdminDashboardResponse>("/admin/dashboard"),
    getProducts: (filters: ProductFilters = {}) =>
      fetchApi<PaginatedResponse<Product>>(`/admin/products${buildQueryString(filters as Record<string, unknown>)}`),
    createProduct: (data: Partial<Product>) =>
      fetchApi<{ status: string; data: Product }>("/admin/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateProduct: (id: number, data: Partial<Product>) =>
      fetchApi<{ status: string; data: Product }>(`/admin/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteProduct: (id: number) =>
      fetchApi<{ status: string; message: string }>(`/admin/products/${id}`, {
        method: "DELETE",
      }),
    getPaymentSettings: () =>
      fetchApi<{ status: string; data: PaymentMethodSettings }>("/admin/settings/payment"),
    updatePaymentSettings: (data: Partial<PaymentMethodSettings>) =>
      fetchApi<{ status: string; message: string; data: PaymentMethodSettings }>("/admin/settings/payment", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },
};
