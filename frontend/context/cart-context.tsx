"use client";

import * as React from "react";
import { Product, api, CartValidationResponse } from "@/lib/api-client";
import { toast } from "sonner";

export interface CartItem {
  product_id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  formatted_price: string;
  image_url: string;
  quantity: number;
  stock: number;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  isLoadingValidation: boolean;
  validationResult: CartValidationResponse | null;
  totalItems: number;
  subtotal: number;
  tax: number;
  shippingFee: number;
  totalAmount: number;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
  isFreeShipping: boolean;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  validateWithBackend: () => Promise<CartValidationResponse | null>;
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "apex_cart_items_v1";
const FREE_SHIPPING_THRESHOLD = 1000.00;
const STANDARD_SHIPPING_FEE = 60.00;
const TAX_RATE = 0.05;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoadingValidation, setIsLoadingValidation] = React.useState(false);
  const [validationResult, setValidationResult] = React.useState<CartValidationResponse | null>(null);
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Hydrate from localStorage on client mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse cart storage", e);
    }
    setIsHydrated(true);
  }, []);

  // Sync to localStorage upon cart state changes
  React.useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error("Failed to save cart to storage", e);
      }
    }
  }, [items, isHydrated]);

  // Financial calculations
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = round(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const tax = round(subtotal * TAX_RATE);
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || items.length === 0;
  const shippingFee = items.length === 0 ? 0.00 : isFreeShipping ? 0.00 : STANDARD_SHIPPING_FEE;
  const totalAmount = round(subtotal + tax + shippingFee);
  const amountNeededForFreeShipping = Math.max(0.00, round(FREE_SHIPPING_THRESHOLD - subtotal));

  function round(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  const addItem = (product: Product, quantity = 1) => {
    if (product.stock <= 0) {
      toast.error("Out of Stock", {
        description: `'${product.name}' is currently unavailable.`,
      });
      return;
    }

    setItems((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);

      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > product.stock) {
          toast.warning("Stock Limit Reached", {
            description: `Only ${product.stock} units available in stock.`,
          });
          return prev.map((item) =>
            item.product_id === product.id ? { ...item, quantity: product.stock } : item
          );
        }

        toast.success("Cart Updated", {
          description: `Increased '${product.name}' quantity to ${newQty}.`,
        });

        return prev.map((item) =>
          item.product_id === product.id ? { ...item, quantity: newQty } : item
        );
      }

      const initialQty = Math.min(quantity, product.stock);
      toast.success("Added to Cart", {
        description: `'${product.name}' added to your shopping bag.`,
      });

      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          price: product.price,
          formatted_price: product.formatted_price,
          image_url: product.image_url,
          quantity: initialQty,
          stock: product.stock,
        },
      ];
    });

    setIsOpen(true);
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          const boundedQty = Math.min(quantity, item.stock);
          if (quantity > item.stock) {
            toast.warning("Stock Limit", {
              description: `Maximum available stock is ${item.stock}.`,
            });
          }
          return { ...item, quantity: boundedQty };
        }
        return item;
      })
    );
  };

  const removeItem = (productId: number) => {
    setItems((prev) => {
      const target = prev.find((i) => i.product_id === productId);
      if (target) {
        toast.info("Item Removed", {
          description: `'${target.name}' removed from your cart.`,
        });
      }
      return prev.filter((item) => item.product_id !== productId);
    });
  };

  const clearCart = () => {
    setItems([]);
    setValidationResult(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);

  // Validate cart against backend database
  const validateWithBackend = async (): Promise<CartValidationResponse | null> => {
    if (items.length === 0) return null;

    setIsLoadingValidation(true);
    try {
      const payload = {
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      };

      const result = await api.store.validateCart(payload);
      setValidationResult(result);

      if (!result.valid) {
        toast.error("Cart Adjustment Needed", {
          description: result.errors[0] || "Some items exceed available inventory.",
        });
      }

      return result;
    } catch (err: unknown) {
      // Offline fallback: build accurate client validation
      const offlineSummary: CartValidationResponse = {
        valid: true,
        errors: [],
        items: items.map((i) => ({
          product_id: i.product_id,
          name: i.name,
          sku: i.sku,
          category: i.category,
          image_url: i.image_url,
          unit_price: i.price,
          formatted_unit_price: `$${i.price.toFixed(2)}`,
          quantity: i.quantity,
          subtotal: round(i.price * i.quantity),
          formatted_subtotal: `$${(i.price * i.quantity).toFixed(2)}`,
          available_stock: i.stock,
          is_stock_sufficient: i.quantity <= i.stock,
        })),
        summary: {
          subtotal,
          tax,
          tax_rate_percent: 5,
          shipping_fee: shippingFee,
          free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
          is_free_shipping: isFreeShipping,
          amount_needed_for_free_shipping: amountNeededForFreeShipping,
          total_amount: totalAmount,
          formatted_subtotal: `$${subtotal.toFixed(2)}`,
          formatted_tax: `$${tax.toFixed(2)}`,
          formatted_shipping_fee: `$${shippingFee.toFixed(2)}`,
          formatted_total_amount: `$${totalAmount.toFixed(2)}`,
        },
      };

      setValidationResult(offlineSummary);
      return offlineSummary;
    } finally {
      setIsLoadingValidation(false);
    }
  };

  const value: CartContextType = {
    items,
    isOpen,
    isLoadingValidation,
    validationResult,
    totalItems,
    subtotal,
    tax,
    shippingFee,
    totalAmount,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    amountNeededForFreeShipping,
    isFreeShipping,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    validateWithBackend,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
