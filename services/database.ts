
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  setDoc,
  getDoc,
  increment
} from 'firebase/firestore';
import { db } from '../firebase-config';
import { Product, Order, OrderStatus, RestaurantConfig, Coupon, Transaction } from '../types';

const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';
const CONFIG_COLLECTION = 'settings';
const COUPONS_COLLECTION = 'coupons';
const TRANSACTIONS_COLLECTION = 'transactions';
const DEFAULT_RESTAURANT_ID = 'main_marmita';

// Products API
// Products API
// Products API
export const getActiveProducts = async (): Promise<Product[]> => {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('active', '==', true)
  );
  const snapshot = await getDocs(q);
  const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  return products.sort((a, b) => b.createdAt - a.createdAt);
};

export const getAllProducts = async (): Promise<Product[]> => {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'restaurantId'>) => {
  return await addDoc(collection(db, PRODUCTS_COLLECTION), {
    ...product,
    createdAt: Date.now(),
    restaurantId: DEFAULT_RESTAURANT_ID
  });
};

export const updateProduct = async (id: string, product: Partial<Product>) => {
  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  return await updateDoc(productRef, product);
};

export const deleteProduct = async (id: string) => {
  return await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
};

// Orders API
export const createOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'status' | 'restaurantId'>) => {
  return await addDoc(collection(db, ORDERS_COLLECTION), {
    ...order,
    status: OrderStatus.RECEIVED,
    createdAt: Date.now(),
    restaurantId: DEFAULT_RESTAURANT_ID
  });
};

export const getCustomerOrders = async (identifier: { userId?: string, guestId?: string }): Promise<Order[]> => {
  let q;
  if (identifier.userId) {
    q = query(
      collection(db, ORDERS_COLLECTION),
      where('userId', '==', identifier.userId),
      orderBy('createdAt', 'desc')
    );
  } else if (identifier.guestId) {
    q = query(
      collection(db, ORDERS_COLLECTION),
      where('guestId', '==', identifier.guestId),
      orderBy('createdAt', 'desc')
    );
  } else {
    return [];
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
};

export const getOrdersByPeriod = async (start: number, end: number): Promise<Order[]> => {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('createdAt', '>=', start),
    where('createdAt', '<=', end),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
};

export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    callback(orders);
  });
};

export const subscribeToOrder = (orderId: string, callback: (order: Order | null) => void) => {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  return onSnapshot(orderRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as Order);
    } else {
      callback(null);
    }
  });
};

export const updateOrderStatus = async (id: string, status: OrderStatus) => {
  const orderRef = doc(db, ORDERS_COLLECTION, id);
  return await updateDoc(orderRef, { status });
};

// Transactions (Finance) API
export const getTransactionsByPeriod = async (start: number, end: number): Promise<Transaction[]> => {
  const q = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where('date', '>=', start),
    where('date', '<=', end),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
  return await addDoc(collection(db, TRANSACTIONS_COLLECTION), transaction);
};

export const deleteTransaction = async (id: string) => {
  return await deleteDoc(doc(db, TRANSACTIONS_COLLECTION, id));
};

// Config API
export const getRestaurantConfig = async (): Promise<RestaurantConfig> => {
  const configRef = doc(db, CONFIG_COLLECTION, DEFAULT_RESTAURANT_ID);
  const snapshot = await getDoc(configRef);
  if (snapshot.exists()) {
    return snapshot.data() as RestaurantConfig;
  }
  return {
    deliveryRadiusKm: 10,
    deliveryFee: 5,
    isDeliveryFree: false,
    freeDeliveryOver: 50,
    addressBase: ""
  };
};

export const updateRestaurantConfig = async (config: RestaurantConfig) => {
  const configRef = doc(db, CONFIG_COLLECTION, DEFAULT_RESTAURANT_ID);
  return await setDoc(configRef, config);
};

// Coupons API
export const getCoupons = async (): Promise<Coupon[]> => {
  const q = query(collection(db, COUPONS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon));
};

export const addCoupon = async (coupon: Omit<Coupon, 'id' | 'createdAt'>) => {
  return await addDoc(collection(db, COUPONS_COLLECTION), {
    ...coupon,
    createdAt: Date.now()
  });
};

export const incrementCouponUsage = async (couponId: string) => {
  const couponRef = doc(db, COUPONS_COLLECTION, couponId);
  return await updateDoc(couponRef, {
    usedCount: increment(1)
  });
};

export const deleteCoupon = async (id: string) => {
  return await deleteDoc(doc(db, COUPONS_COLLECTION, id));
};
