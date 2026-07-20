import { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import api from '../api';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { userId, isAuthenticated } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Load cart on mount or login
  useEffect(() => {
    const loadCart = async () => {
      if (isAuthenticated && userId) {
        try {
          const res = await api.get(`/api/users/${userId}/cart`);
          setCartItems(res.data.cart || []);
        } catch (err) {
          console.error("Failed to load cloud cart", err);
        }
      } else {
        const saved = localStorage.getItem('orbit_cart');
        setCartItems(saved ? JSON.parse(saved) : []);
      }
      setIsInitialized(true);
    };
    loadCart();
  }, [isAuthenticated, userId]);

  // 2. Sync cart to Cloud or LocalStorage whenever it changes
  useEffect(() => {
    if (!isInitialized) return;

    if (isAuthenticated && userId) {
      // Sync to cloud
      api.put(`/api/users/${userId}/cart`, { cart: cartItems }).catch(err => {
        console.error("Failed to sync cart to cloud", err);
      });
    } else {
      // Sync to local storage
      localStorage.setItem('orbit_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated, userId, isInitialized]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.product._id === product._id);
      
      if (existingItem) {
        // Enforce stock limit
        const newQty = Math.min(existingItem.quantity + quantity, product.stockQuantity);
        if (newQty === existingItem.quantity) {
          alert(`You cannot add more! Only ${product.stockQuantity} in stock.`);
          return prev;
        }
        return prev.map(item => 
          item.product._id === product._id ? { ...item, quantity: newQty } : item
        );
      }
      
      if (quantity > product.stockQuantity) {
        alert(`You cannot add more! Only ${product.stockQuantity} in stock.`);
        return prev;
      }
      
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(true); // Open drawer on add
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.product._id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prev => prev.map(item => {
      if (item.product._id === productId) {
        if (quantity > item.product.stockQuantity) {
          alert(`You cannot add more! Only ${item.product.stockQuantity} in stock.`);
          return item;
        }
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCartItems([]);
    if (isAuthenticated && userId) {
      api.delete(`/api/users/${userId}/cart`).catch(err => console.error("Failed to clear cloud cart", err));
    }
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isCartOpen,
      setIsCartOpen,
      cartTotal,
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};
