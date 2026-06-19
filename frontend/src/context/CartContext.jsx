import { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('orbit_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('orbit_cart', JSON.stringify(cartItems));
  }, [cartItems]);

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

  const clearCart = () => setCartItems([]);

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
