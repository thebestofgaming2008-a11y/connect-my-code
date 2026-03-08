import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  priceInr?: number;
  salePrice?: number;
  salePriceInr?: number;
  category: string;
  images: string[];
  inStock: boolean;
  rating: number;
  reviews: number;
  badge?: string;
  sizes?: string[];
  colors?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
}

export interface AppliedCoupon {
  code: string;
  discount_type: 'percentage' | 'fixed_inr';
  discount_value: number;
  max_discount_inr?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, size?: string, color?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: (currency?: string, exchangeRates?: Record<string, number>) => number;
  getItemCount: () => number;
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  getDiscount: (subtotal: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Demo product IDs to sanitize from old carts
const DEMO_PRODUCT_IDS = ['1', '2', '3', '4'];

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        const sanitized = parsed.filter((item: CartItem) => !DEMO_PRODUCT_IDS.includes(item.product.id));
        if (sanitized.length !== parsed.length) {
          localStorage.setItem('cart', JSON.stringify(sanitized));
        }
        return sanitized;
      }
    } catch (e) {
      if (import.meta.env.DEV) console.error('Error parsing cart:', e);
      localStorage.removeItem('cart');
    }
    return [];
  });

  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(() => {
    try {
      const saved = localStorage.getItem('applied_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem('applied_coupon');
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('applied_coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('applied_coupon');
    }
  }, [appliedCoupon]);

  const addToCart = (product: Product, quantity = 1, size?: string, color?: string) => {
    // Prevent adding demo products
    if (DEMO_PRODUCT_IDS.includes(product.id)) {
      if (import.meta.env.DEV) console.warn('Cannot add demo product to cart');
      return;
    }

    setItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.product.id === product.id && item.size === size && item.color === color
      );
      
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      
      return [...prev, { product, quantity, size, color }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = (coupon: AppliedCoupon) => setAppliedCoupon(coupon);
  const removeCoupon = () => setAppliedCoupon(null);

  const getDiscount = (subtotal: number): number => {
    if (!appliedCoupon) return 0;
    let discount = 0;
    if (appliedCoupon.discount_type === 'percentage') {
      discount = (subtotal * appliedCoupon.discount_value) / 100;
      if (appliedCoupon.max_discount_inr && discount > appliedCoupon.max_discount_inr) {
        discount = appliedCoupon.max_discount_inr;
      }
    } else {
      discount = appliedCoupon.discount_value;
    }
    return Math.min(Math.round(discount * 100) / 100, subtotal);
  };

  const getTotal = (currency: string = 'USD', exchangeRates: Record<string, number> = {}) => {
    return items.reduce((total, item) => {
      let price: number;
      if (currency === 'INR') {
        const inrRate = exchangeRates['INR'] || 90;
        price = item.product.salePriceInr || item.product.priceInr || 
                (item.product.salePrice || item.product.price) * inrRate;
      } else if (currency === 'USD') {
        price = item.product.salePrice || item.product.price;
      } else {
        const rate = exchangeRates[currency] || 1;
        price = (item.product.salePrice || item.product.price) * rate;
      }
      return total + price * item.quantity;
    }, 0);
  };

  const getItemCount = () =>
    items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        getDiscount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
