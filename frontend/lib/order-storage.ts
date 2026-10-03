import { Order, CheckoutPayload, Product, Delivery } from "./api-client";
import { MOCK_PRODUCTS } from "./mock-products";

const ORDERS_STORAGE_KEY = "apex_placed_orders_v1";
const PRODUCTS_STORAGE_KEY = "apex_products_live_stock_v1";

/**
 * Get current stock for products (synced with local modifications)
 */
export function getSimulatedProducts(): Product[] {
  if (typeof window === "undefined") return MOCK_PRODUCTS;

  try {
    const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to read simulated products", e);
  }

  // Initialize storage
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(MOCK_PRODUCTS));
  } catch {}

  return MOCK_PRODUCTS;
}

/**
 * Save updated simulated products list
 */
export function saveSimulatedProducts(products: Product[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.error("Failed to save simulated products", e);
  }
}

/**
 * Get all cached/simulated placed orders
 */
export function getSimulatedOrders(): Order[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to read simulated orders", e);
  }

  return [];
}

/**
 * Save simulated order
 */
export function saveSimulatedOrder(order: Order): void {
  if (typeof window === "undefined") return;

  try {
    const orders = getSimulatedOrders();
    orders.unshift(order);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error("Failed to save simulated order", e);
  }
}

/**
 * Get simulated order by order number
 */
export function getSimulatedOrderByNumber(orderNumber: string): Order | null {
  const orders = getSimulatedOrders();
  return orders.find((o) => o.order_number === orderNumber) || null;
}

/**
 * Concurrency-safe simulated checkout with atomic stock verification
 */
export function simulateOfflineCheckout(payload: CheckoutPayload): Order {
  const currentProducts = getSimulatedProducts();
  const productsMap = new Map<number, Product>(
    currentProducts.map((p) => [p.id, { ...p }])
  );

  let subtotal = 0;
  const orderItems = [];

  // Sort product IDs to prevent deadlocks
  const sortedItems = [...payload.items].sort((a, b) => a.product_id - b.product_id);

  // Verification & Atomic deduction
  for (const item of sortedItems) {
    const product = productsMap.get(item.product_id);
    if (!product || product.status !== "active") {
      throw new Error(`Product ID ${item.product_id} is unavailable.`);
    }

    if (product.stock < item.quantity) {
      throw new Error(
        `Insufficient stock for product: ${product.name}. Remaining: ${product.stock}`
      );
    }

    // Atomic deduction
    product.stock -= item.quantity;
    product.is_in_stock = product.stock > 0;
    product.stock_badge =
      product.stock <= 0
        ? "out_of_stock"
        : product.stock <= 5
        ? "low_stock"
        : "in_stock";

    const itemSubtotal = Math.round(product.price * item.quantity * 100) / 100;
    subtotal += itemSubtotal;

    orderItems.push({
      id: Math.floor(Math.random() * 1000000),
      order_id: 0,
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      unit_price: product.price,
      formatted_unit_price: `$${product.price.toFixed(2)}`,
      quantity: item.quantity,
      subtotal: itemSubtotal,
      formatted_subtotal: `$${itemSubtotal.toFixed(2)}`,
      image_url: product.image_url,
    });
  }

  // Save updated stock
  saveSimulatedProducts(Array.from(productsMap.values()));

  const subtotalRounded = Math.round(subtotal * 100) / 100;
  const tax = Math.round(subtotalRounded * 0.05 * 100) / 100;
  const shippingFee = subtotalRounded >= 1000.0 ? 0.0 : 60.0;
  const totalAmount = Math.round((subtotalRounded + tax + shippingFee) * 100) / 100;

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const orderNumber = `ORD-${dateStr}-${randCode}`;

  const order: Order = {
    id: Math.floor(Math.random() * 1000000),
    order_number: orderNumber,
    customer_name: payload.customer_name,
    customer_phone: payload.customer_phone,
    customer_email: payload.customer_email,
    shipping_address: payload.shipping_address,
    subtotal: subtotalRounded,
    formatted_subtotal: `$${subtotalRounded.toFixed(2)}`,
    tax: tax,
    formatted_tax: `$${tax.toFixed(2)}`,
    shipping_fee: shippingFee,
    formatted_shipping_fee: `$${shippingFee.toFixed(2)}`,
    total_amount: totalAmount,
    formatted_total_amount: `$${totalAmount.toFixed(2)}`,
    status: "pending_payment",
    payment_method: payload.payment_method,
    notes: payload.notes || null,
    items: orderItems,
    items_count: orderItems.length,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  saveSimulatedOrder(order);
  return order;
}

const SETTINGS_STORAGE_KEY = "apex_payment_settings_v1";

export interface SimulatedPaymentSettings {
  bkash_enabled: boolean;
  sslcommerz_enabled: boolean;
  cod_enabled: boolean;
  active_gateway: string;
  sandbox_mode: boolean;
  credentials_status?: {
    bkash_configured: boolean;
    sslcommerz_configured: boolean;
  };
}

export function getSimulatedPaymentSettings(): SimulatedPaymentSettings {
  const defaults: SimulatedPaymentSettings = {
    bkash_enabled: true,
    sslcommerz_enabled: true,
    cod_enabled: true,
    active_gateway: "bkash",
    sandbox_mode: true,
    credentials_status: {
      bkash_configured: false,
      sslcommerz_configured: false,
    },
  };

  if (typeof window === "undefined") return defaults;

  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      return { ...defaults, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Failed to read simulated payment settings", e);
  }

  return defaults;
}

export function saveSimulatedPaymentSettings(
  settings: Partial<SimulatedPaymentSettings>
): SimulatedPaymentSettings {
  const current = getSimulatedPaymentSettings();
  const updated = { ...current, ...settings };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save simulated payment settings", e);
    }
  }
  return updated;
}

/**
 * Mark a simulated order as paid
 */
export function simulateOrderPaid(
  orderNumber: string,
  transactionId?: string
): Order | null {
  const orders = getSimulatedOrders();
  const target = orders.find((o) => o.order_number === orderNumber);
  if (!target) return null;

  target.status = "paid";
  target.updated_at = new Date().toISOString();

  // Simulate automated queue dispatch to CarryBee for paid orders
  const randSuffix = Math.floor(100000 + Math.random() * 900000);
  target.delivery = {
    id: Math.floor(Math.random() * 1000000),
    order_id: target.id,
    courier: "CarryBee",
    consignment_id: `CB-CN-${new Date().getFullYear()}-${randSuffix}`,
    tracking_code: `TRK-CB${randSuffix}`,
    delivery_fee: 60.0,
    status: "dispatched",
    failure_reason: null,
    dispatched_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  target.status = "dispatched";

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch {}
  }

  return target;
}

/**
 * Manually simulate or retry CarryBee delivery dispatch
 */
export function simulateDispatchCarryBee(
  orderNumber: string,
  forceFail = false
): { order: Order; delivery: Delivery } | null {
  const orders = getSimulatedOrders();
  const target = orders.find((o) => o.order_number === orderNumber);
  if (!target) return null;

  const now = new Date();
  const randSuffix = Math.floor(100000 + Math.random() * 900000);
  const consignmentId = `CB-CN-${now.getFullYear()}-${randSuffix}`;
  const trackingCode = `TRK-CB${randSuffix}`;

  const delivery: Delivery = {
    id: target.delivery?.id || Math.floor(Math.random() * 1000000),
    order_id: target.id,
    courier: "CarryBee",
    consignment_id: forceFail ? null : consignmentId,
    tracking_code: forceFail ? null : trackingCode,
    delivery_fee: 60.0,
    status: forceFail ? "failed" : "dispatched",
    failure_reason: forceFail ? "CarryBee Gateway Timeout 504 (Simulated)" : null,
    dispatched_at: forceFail ? null : now.toISOString(),
    created_at: target.delivery?.created_at || now.toISOString(),
    updated_at: now.toISOString(),
  };

  target.delivery = delivery;
  if (!forceFail) {
    target.status = "dispatched";
  }
  target.updated_at = now.toISOString();

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch {}
  }

  return { order: target, delivery };
}

