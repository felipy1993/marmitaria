
import React, { useState, createContext, useContext, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Store from './pages/Store';
import { ToastProvider } from './components/Toast';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminSettings from './pages/AdminSettings';
import AdminFinances from './pages/AdminFinances';
import AdminOrders from './pages/AdminOrders';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase-config';
import { OrderItem } from './types';

export type CartItem = OrderItem;

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  updateCartItem: (productId: string, updatedItem: CartItem) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      const isPass = u?.providerData.some(p => p.providerId === 'password');
      setIsAdmin(!!isPass);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
  );

  if (!user || !isAdmin) {
    if (user && !isAdmin) {
      return <Navigate to="/" />;
    }
    return <Navigate to="/admin/login" />;
  }
  
  return <>{children}</>;
};


const App: React.FC = () => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (newItem: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === newItem.productId);
      if (existing) {
        return prev.map(i => i.productId === newItem.productId ? { ...i, quantity: i.quantity + newItem.quantity } : i);
      }
      return [...prev, newItem];
    });
  };

  const updateCartItem = (productId: string, updatedItem: CartItem) => {
    setItems(prev => prev.map(item => item.productId === productId ? updatedItem : item));
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, updateCartItem, removeFromCart, clearCart, total }}>
      <ToastProvider>
        <HashRouter>
        <Routes>
          <Route path="/" element={<Store />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
          <Route path="/admin/finances" element={<ProtectedRoute><AdminFinances /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
     </ToastProvider>
    </CartContext.Provider>
  );
};

export default App;
