
import React, { useState, useEffect, useMemo } from 'react';
import { getActiveProducts, createOrder, getRestaurantConfig, getCoupons, subscribeToOrder, incrementCouponUsage, getCustomerOrders, subscribeToRestaurantConfig, linkGuestOrdersToUser } from '../services/database';
import { Product, PaymentMethod, OptionGroup, SelectedOption, Order, OrderStatus, RestaurantConfig, Coupon, OrderItem } from '../types';
import { useCart } from '../App';
import { 
  ShoppingCart, Search, MapPin, Clock, Truck, ChevronRight, Flame,
  ShoppingBag, ChevronDown, LogOut, ClipboardList
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase-config';
import { useToast } from '../components/Toast';
import { signInWithPopup, onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';

// Novos componentes refatorados
import CustomizationDrawer from '../components/Store/CustomizationDrawer';
import CartDrawer from '../components/Store/CartDrawer';
import CheckoutModal from '../components/Store/CheckoutModal';
import OrderTrackingModal from '../components/Store/OrderTrackingModal';
import MyOrdersModal from '../components/Store/MyOrdersModal';
import ProductCard from '../components/Store/ProductCard';
import CategoryBar from '../components/Store/CategoryBar';
import Receipt from '../components/Store/Receipt';
import AddressModal from '../components/Store/AddressModal';

const INITIAL_FORM_DATA = {
  customerName: '',
  phone: '',
  paymentMethod: PaymentMethod.PIX,
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: ''
};

const calculateDistance = (lat1: number | undefined, lon1: number | undefined, lat2: number | undefined, lon2: number | undefined) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return null;
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const Store: React.FC = () => {
  const navigate = useNavigate();
  const { items, addToCart, updateCartItem, removeFromCart, clearCart, total: subtotal } = useCart();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<RestaurantConfig | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponInput, setCouponInput] = useState('');
  
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Marmitas');
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [clientCoords, setClientCoords] = useState<{lat: number, lon: number} | null>(null);

  const deliveryDistance = useMemo(() => {
    if (!config || !clientCoords || config.latitude === undefined || config.longitude === undefined) return null;
    return calculateDistance(config.latitude, config.longitude, clientCoords.lat, clientCoords.lon);
  }, [config, clientCoords]);

  const isOutsideRadius = useMemo(() => {
    if (deliveryDistance === null || !config) return false;
    return deliveryDistance > (config.deliveryRadiusKm || 10);
  }, [deliveryDistance, config]);
  
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [hasChosenGuest, setHasChosenGuest] = useState(() => localStorage.getItem('hasChosenGuest') === 'true');
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [guestId] = useState(() => {
    let id = localStorage.getItem('guestId');
    if (!id) {
      id = 'g-' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('guestId', id);
    }
    return id;
  });
  
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(localStorage.getItem('trackingOrderId'));

  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [editingCartItemId, setEditingCartItemId] = useState<string | null>(null);
  const [currentSelections, setCurrentSelections] = useState<Record<string, Record<string, number>>>({});
  const [observation, setObservation] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);


  const formatImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return url;
    return `/assets/options/${url}`;
  };

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [cashAmount, setCashAmount] = useState<string>('');

  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      const isEmailAdmin = user?.providerData.some((p: any) => p.providerId === 'password');
      if (user && !isEmailAdmin) {
        setCurrentUser(user);
        // Ao logar, tenta vincular os pedidos de visitante ao UID do usuário
        linkGuestOrdersToUser(guestId, user.uid).then(() => {
          loadMyOrders();
        });
        
        if (!formData.customerName) {
          setFormData(prev => ({ ...prev, customerName: user.displayName || '' }));
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, [formData.customerName]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setIsUserMenuOpen(false);
    } catch (err: any) {
      console.error("Erro ao logar com Google:", err);
      alert("Erro ao tentar entrar com o Google. Tente novamente.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsUserMenuOpen(false);
    } catch (err) {
      console.error("Erro ao sair:", err);
    }
  };

  const hasMarmitaInCart = useMemo(() => {
    return items.some(item => {
      const originalProduct = products.find(p => p.name === item.name);
      return originalProduct?.category === 'Marmitas';
    });
  }, [items, products]);

  const deliveryFee = useMemo(() => {
    if (deliveryType === 'pickup') return 0;
    if (!config || isOutsideRadius) return 0; 
    if (config?.isDeliveryFree) return 0;
    if (subtotal >= (config?.freeDeliveryOver || 0)) return 0;
    return config?.deliveryFee || 0;
  }, [config, subtotal, isOutsideRadius, deliveryType]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return (subtotal * appliedCoupon.discountPercentage) / 100;
  }, [appliedCoupon, subtotal]);

  const finalTotal = useMemo(() => {
    const total = subtotal + deliveryFee - discountAmount;
    return total > 0 ? total : 0;
  }, [subtotal, deliveryFee, discountAmount]);

  const isStoreOpen = useMemo(() => {
    if (!config?.openingTime || !config?.closingTime) return true;
    const currentStr = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
    if (config.openingTime <= config.closingTime) {
      return currentStr >= config.openingTime && currentStr <= config.closingTime;
    } else {
      return currentStr >= config.openingTime || currentStr <= config.closingTime;
    }
  }, [config, currentTime]);

  useEffect(() => {
    loadInitialData();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        navigate('/admin/login');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  useEffect(() => {
    if (trackingOrderId) {
      const unsubscribe = subscribeToOrder(trackingOrderId, (order) => {
        if (order) setActiveOrder(order);
        else {
          setActiveOrder(null);
          setTrackingOrderId(null);
          localStorage.removeItem('trackingOrderId');
        }
      });
      return () => unsubscribe();
    }
  }, [trackingOrderId]);

  useEffect(() => {
    const unsubscribe = subscribeToRestaurantConfig((conf) => {
      setConfig(conf);
    });
    return () => unsubscribe();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [prods, coups] = await Promise.all([
        getActiveProducts(),
        getCoupons()
      ]);
      setProducts(prods);
      setCoupons(coups);
    } catch (err) {
      console.error("Erro ao carregar dados da loja:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = () => {
    const coupon = coupons.find(c => c.code === couponInput.toUpperCase() && c.active);
    if (!coupon) {
      alert('Cupom inválido.');
      return;
    }
    const totalWithDelivery = subtotal + deliveryFee;
    if (totalWithDelivery < coupon.minOrderValue) {
      alert(`Este cupom só vale para pedidos com valor total (incluindo entrega) acima de R$ ${coupon.minOrderValue.toFixed(2)}`);
      return;
    }
    if (coupon.usedCount >= coupon.availableQuantity) {
      alert('Infelizmente este cupom já atingiu o limite de usos.');
      return;
    }
    setAppliedCoupon(coupon);
    alert('Cupom aplicado com sucesso!');
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast('Seu navegador não suporta geolocalização.', 'error');
      return;
    }

    setIsSearchingCep(true);
    setClientCoords(null);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
        const data = await res.json();
        
        if (data && data.address) {
          const { postcode, road, suburb, city, town, village } = data.address;
          const cleanCep = postcode ? postcode.replace(/\D/g, '') : '';
          
          setFormData(prev => ({
            ...prev,
            cep: cleanCep,
            street: road || '',
            neighborhood: suburb || '',
            city: city || town || village || ''
          }));

          setClientCoords({ lat: latitude, lon: longitude });
          showToast('Localização detectada com sucesso!', 'success');
        } else {
          showToast('Não foi possível obter o endereço exato.', 'info');
        }
      } catch (err) {
        console.error('Erro Geolocation:', err);
        showToast('Falha ao obter endereço via GPS.', 'error');
      } finally {
        setIsSearchingCep(false);
      }
    }, (err) => {
      setIsSearchingCep(false);
      showToast('Acesso à localização negado ou falhou.', 'error');
    }, { enableHighAccuracy: true });
  };

  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, cep: cleanCep }));
    setClientCoords(null);
    
    if (cleanCep.length === 8) {
      setIsSearchingCep(true);
      try {
        const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const viaCepData = await viaCepRes.json();
        if (!viaCepData.erro) {
          setFormData(prev => ({
            ...prev,
            street: viaCepData.logradouro || '',
            neighborhood: viaCepData.bairro || '',
            city: viaCepData.localidade || ''
          }));
          const query = `${viaCepData.logradouro}, ${viaCepData.localidade}, Brasil`;
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
            const geoData = await geoRes.json();
            if (geoData && geoData.length > 0) {
              setClientCoords({ lat: parseFloat(geoData[0].lat), lon: parseFloat(geoData[0].lon) });
            }
          } catch (geoErr) {
            console.error('Erro Geocoding (Nominatim):', geoErr);
            // Non-fatal error, just means we can't calculate distance right now
          }
          document.getElementById('address-number')?.focus();
        } else {
          showToast('CEP não encontrado.', 'error');
        }
      } catch (err) {
        console.error('Erro Geocoding:', err);
        showToast('Erro ao buscar o CEP. Verifique sua conexão.', 'error');
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  const getOptionQuantity = (groupId: string, itemName: string) => {
    return currentSelections[groupId]?.[itemName] || 0;
  };

  const addOption = (groupId: string, itemName: string, group: OptionGroup) => {
    setCurrentSelections(prev => {
      const currentGroup = prev[groupId] || {};
      const currentCount = Object.values(currentGroup).reduce((acc, val) => acc + val, 0);
      const itemQuantity = currentGroup[itemName] || 0;
      if (!group.max || currentCount < group.max || (group.extraPricePerItem && group.extraPricePerItem > 0)) {
        if (group.max === 1 && (!group.extraPricePerItem || group.extraPricePerItem === 0)) {
          return { ...prev, [groupId]: { [itemName]: 1 } };
        }
        return {
          ...prev,
          [groupId]: {
            ...currentGroup,
            [itemName]: itemQuantity + 1
          }
        };
      }
      return prev;
    });
  };

  const removeOption = (groupId: string, itemName: string) => {
    setCurrentSelections(prev => {
      const currentGroup = prev[groupId] || {};
      const itemQuantity = currentGroup[itemName] || 0;
      if (itemQuantity <= 1) {
        const newGroup = { ...currentGroup };
        delete newGroup[itemName];
        return { ...prev, [groupId]: newGroup };
      }
      return {
        ...prev,
        [groupId]: {
          ...currentGroup,
          [itemName]: itemQuantity - 1
        }
      };
    });
  };

  const calculateCurrentPrice = () => {
    if (!customizingProduct) return 0;
    let total = customizingProduct.price;
    customizingProduct.optionsGroups?.forEach(g => {
      const selections = currentSelections[g.id] || {};
      const itemCount = Object.values(selections).reduce((acc, qty) => acc + qty, 0);
      Object.entries(selections).forEach(([name, qty]) => {
        const optionItem = g.items.find(i => i.name === name);
        if (optionItem?.price) total += (optionItem.price * qty);
      });
      if (g.extraPricePerItem && itemCount > g.max) {
        total += (itemCount - g.max) * g.extraPricePerItem;
      }
    });
    return total;
  };

  const isSelectionValid = () => {
    if (!customizingProduct) return false;
    if (!customizingProduct.optionsGroups?.length) return true;
    return customizingProduct.optionsGroups.every(g => {
      const selections = currentSelections[g.id] || {};
      const count = Object.values(selections).reduce((acc, qty) => acc + qty, 0);
      return count >= g.min;
    });
  };

  const confirmCustomization = () => {
    if (!customizingProduct || !isSelectionValid()) return;
    const selectedOptions: SelectedOption[] = customizingProduct.optionsGroups?.map(g => {
      const selections = currentSelections[g.id] || {};
      const itemsList: string[] = [];
      Object.entries(selections).forEach(([itemName, qty]) => {
        for (let i = 0; i < qty; i++) itemsList.push(itemName);
      });
      return { groupName: g.name, items: itemsList };
    }) || [];
    
    const itemData = {
      productId: editingCartItemId || `${customizingProduct.id}-${Date.now()}`,
      name: customizingProduct.name,
      price: calculateCurrentPrice(),
      quantity: itemQuantity, 
      selectedOptions,
      observation,
      restaurantId: customizingProduct.restaurantId
    };

    if (editingCartItemId) updateCartItem(editingCartItemId, itemData);
    else {
      addToCart(itemData);
      setIsCartBouncing(true);
      setTimeout(() => setIsCartBouncing(false), 300);
    }
    
    setCustomizingProduct(null);
    setEditingCartItemId(null);
    setIsCartOpen(true);
  };

  const handleOpenCustomization = (product: Product) => {
    setCustomizingProduct(product);
    setEditingCartItemId(null);
    setCurrentSelections({});
    setObservation('');
    setItemQuantity(1);
  };

  const handleEditCartItem = (item: OrderItem) => {
    const product = products.find(p => p.name === item.name);
    if (!product) return;
    setCustomizingProduct(product);
    setEditingCartItemId(item.productId);
    setItemQuantity(item.quantity);
    const newSelections: Record<string, Record<string, number>> = {};
    product.optionsGroups?.forEach(group => {
      const savedOpt = item.selectedOptions?.find(so => so.groupName === group.name);
      if (savedOpt) {
        const counts: Record<string, number> = {};
        savedOpt.items.forEach(name => {
          counts[name] = (counts[name] || 0) + 1;
        });
        newSelections[group.id] = counts;
      }
    });
    setCurrentSelections(newSelections);
    setObservation(item.observation || '');
    setIsCartOpen(false);
  };

  const loadMyOrders = async () => {
    // Busca cache local primeiro para resposta instantânea
    const cached = localStorage.getItem('lastOrders');
    if (cached) setMyOrders(JSON.parse(cached));

    try {
      const orders = await getCustomerOrders({ 
        userId: currentUser?.uid, 
        guestId 
      });
      setMyOrders(orders);
      localStorage.setItem('lastOrders', JSON.stringify(orders));
    } catch (err: any) {
      console.error("Erro ao carregar pedidos:", err);
      // Se falhar a rede, mantém o que está no estado (cache)
    }
  };

  useEffect(() => {
    if (isMyOrdersOpen) loadMyOrders();
  }, [isMyOrdersOpen, currentUser, guestId]);

  const handleProductClick = (product: Product) => {
    if (!isStoreOpen) {
      showToast('Loja fechada no momento.', 'error');
      return;
    }

    if (!currentUser && !hasChosenGuest) {
      setPendingProduct(product);
      setIsAuthPromptOpen(true);
      return;
    }

    if (product.optionsGroups?.length) {
      handleOpenCustomization(product);
    } else {
      handleAddAction(product);
    }
  };

  const handleContinueAsGuest = () => {
    setHasChosenGuest(true);
    localStorage.setItem('hasChosenGuest', 'true');
    setIsAuthPromptOpen(false);
    if (pendingProduct) {
      if (pendingProduct.optionsGroups?.length) handleOpenCustomization(pendingProduct);
      else handleAddAction(pendingProduct);
      setPendingProduct(null);
    }
  };

  const handleAuthPromptLogin = async () => {
    try {
      await handleGoogleLogin();
      setIsAuthPromptOpen(false);
      if (pendingProduct) {
        if (pendingProduct.optionsGroups?.length) handleOpenCustomization(pendingProduct);
        else handleAddAction(pendingProduct);
        setPendingProduct(null);
      }
    } catch (err) {
      console.error("Erro ao logar via prompt:", err);
    }
  };

  const handleAddAction = (product: Product) => {
    addToCart({
      productId: `${product.id || 'temp'}-${Date.now()}`,
      name: product.name,
      price: product.price,
      quantity: 1,
      selectedOptions: [],
      observation: '',
      restaurantId: product.restaurantId
    });
    setIsCartBouncing(true);
    setTimeout(() => setIsCartBouncing(false), 300);
    setIsCartOpen(true);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (deliveryType === 'delivery' && isOutsideRadius) return;
    const now = new Date();
    const currentStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    let storeTrulyOpen = true;
    if (config?.openingTime && config?.closingTime) {
      if (config.openingTime <= config.closingTime) storeTrulyOpen = currentStr >= config.openingTime && currentStr <= config.closingTime;
      else storeTrulyOpen = currentStr >= config.openingTime || currentStr <= config.closingTime;
    }
    if (!storeTrulyOpen) {
      showToast(`Desculpe, a loja fechou agora pouco. Nosso horário de atendimento é das ${config?.openingTime} às ${config?.closingTime}.`, 'error');
      return;
    }
    
    try {
      const fullAddress = deliveryType === 'delivery' 
        ? `${formData.street}, ${formData.number}${formData.complement ? ' (' + formData.complement + ')' : ''} - ${formData.neighborhood}, ${formData.city} (CEP: ${formData.cep})`
        : `Retirada no Local - ${config?.addressBase || 'Endereço da Loja'}`;
      
      const orderData = {
        userId: currentUser?.uid || null,
        guestId: !currentUser ? guestId : null,
        type: deliveryType,
        customerName: formData.customerName,
        phone: formData.phone,
        address: fullAddress,
        paymentMethod: formData.paymentMethod,
        items: items.map(i => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          price: Number(i.price.toFixed(2)),
          selectedOptions: i.selectedOptions || [],
          observation: i.observation || ''
        })),
        subtotal: Number(subtotal.toFixed(2)),
        deliveryFee: Number(deliveryFee.toFixed(2)),
        discount: Number(discountAmount.toFixed(2)),
        couponCode: appliedCoupon?.code || null,
        distanceKm: deliveryDistance ? Number(deliveryDistance.toFixed(2)) : null,
        total: Number(finalTotal.toFixed(2))
      };

      const docRef = await createOrder(orderData as any);
      if (appliedCoupon && appliedCoupon.id) await incrementCouponUsage(appliedCoupon.id);
      setOrderSuccess(docRef.id);
      setTrackingOrderId(docRef.id);
      localStorage.setItem('trackingOrderId', docRef.id);
      loadMyOrders();
      showToast('Pedido enviado com sucesso! 🎉');
      clearCart();
      setIsCheckoutOpen(false);
      setAppliedCoupon(null);
    } catch (err) {
      console.error("Erro Checkout:", err);
      showToast('Houve uma falha ao processar seu pedido.', 'error');
    }
  };

  const handleRepeatOrder = (order: Order) => {
    order.items.forEach(item => {
      addToCart({
        productId: `${item.productId || 'temp'}-${Date.now()}`,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        selectedOptions: item.selectedOptions || [],
        observation: item.observation || '',
        restaurantId: order.restaurantId
      });
    });
    setIsMyOrdersOpen(false);
    setIsCartOpen(true);
    showToast('Itens adicionados à sua sacola! 🛍️');
  };

  const filteredProducts = useMemo(() => {
    const today = new Date().getDay();
    return products.filter(p => {
      if (!p.active) return false;
      if (p.availableDays && p.availableDays.length > 0) {
        if (!p.availableDays.includes(today)) return false;
      }
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase());
      if (!hasMarmitaInCart) return matchesSearch && p.category === 'Marmitas';
      return matchesSearch && (selectedCategory === 'Todos' || p.category === selectedCategory);
    });
  }, [products, searchTerm, selectedCategory, hasMarmitaInCart]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-orange-500 selection:text-white">
      <header className="sticky top-0 z-[60] bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 md:h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl overflow-hidden shrink-0">
                <img src="/logo.png" alt="Sabor de Casa Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-base md:text-xl font-black text-slate-900 leading-none tracking-tight">Sabor<span className="text-orange-500">deCasa</span></h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${isStoreOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{isStoreOpen ? 'Aberto agora' : 'Fechado'}</p>
                </div>
              </div>
            </Link>
            
            <div 
              onClick={() => setIsAddressModalOpen(true)}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-slate-50 rounded-full border border-slate-100 ml-2 md:ml-4 max-w-[120px] xs:max-w-[160px] md:max-w-xs truncate transition-colors cursor-pointer hover:bg-slate-100 shadow-sm"
            >
              <MapPin size={12} className="text-orange-500 shrink-0 md:w-3.5 md:h-3.5" />
              <span className="text-[10px] md:text-xs font-bold text-slate-600 truncate">
                {formData.street ? `${formData.street}, ${formData.number}` : (config?.addressBase || 'Onde entregar?')}
              </span>
              <ChevronDown size={12} className="text-slate-400 md:w-3.5 md:h-3.5" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="relative">
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="p-1 border border-slate-100 rounded-full hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
                   <img src={currentUser.photoURL || ''} alt="" className="w-8 h-8 rounded-full object-cover" />
                   <ChevronDown size={14} className="text-slate-400 mr-1" />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute top-12 right-0 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl p-2 z-[70] animate-scale-in origin-top-right">
                    <div className="px-3 py-2 border-b border-slate-50 mb-1">
                      <p className="text-xs font-black text-slate-800 truncate">{currentUser.displayName}</p>
                      <p className="text-[10px] text-slate-400 font-bold truncate">{currentUser.email}</p>
                    </div>
                    <button onClick={() => { setIsMyOrdersOpen(true); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all mb-1 md:hidden">
                      <ClipboardList size={14} /> Meus Pedidos
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-black text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <LogOut size={14} /> Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={handleGoogleLogin} className="text-xs font-black text-orange-500 uppercase tracking-widest px-4 py-2 hover:bg-orange-50 rounded-lg transition-all">Entrar</button>
            )}

            <button onClick={() => setIsCartOpen(true)} className={`relative p-2.5 rounded-xl transition-all group ${isCartBouncing ? 'animate-bounce-sm' : 'hover:bg-slate-50'}`}>
              <ShoppingCart size={22} className={`transition-colors ${items.length > 0 ? 'text-orange-500' : 'text-slate-700 group-hover:text-orange-500'}`} />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-black min-w-[20px] h-[20px] flex items-center justify-center rounded-full ring-2 ring-white shadow-sm">
                  {items.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              )}
            </button>

            <button onClick={() => setIsMyOrdersOpen(true)} className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-orange-50 text-slate-700 hover:text-orange-500 transition-all group">
              <ClipboardList size={22} /><span className="hidden md:inline text-xs font-bold uppercase tracking-widest">Meus Pedidos</span>
            </button>
          </div>
        </div>
      </header>

      {!isStoreOpen && (
        <div className="bg-red-500 text-white font-black py-3 px-6 text-center sticky top-[64px] md:top-[80px] z-[55] shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-3">
            <div className="p-1 px-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Clock size={16} />
            </div>
            <p className="text-[11px] md:text-xs uppercase tracking-[0.2em]">Loja Fechada no Momento • Abrimos às {config?.openingTime}</p>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {activeOrder && activeOrder.status !== OrderStatus.FINISHED && (
          <div className="mb-12 relative overflow-hidden bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl animate-scale-in">
             <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
             <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                     {activeOrder.status === OrderStatus.RECEIVED && <Clock size={40} />}
                     {activeOrder.status === OrderStatus.PREPARING && <Flame size={40} />}
                     {activeOrder.status === OrderStatus.DELIVERING && <Truck size={40} />}
                   </div>
                   <div className="text-center md:text-left">
                      <h3 className="text-3xl font-black mb-1 capitalize">Status: {activeOrder.status}</h3>
                      <p className="text-slate-400 font-bold">O sabor que você escolheu está ganhando forma!</p>
                   </div>
                </div>
                <button onClick={() => setOrderSuccess(trackingOrderId)} className="px-10 py-5 bg-white text-slate-900 font-black rounded-2xl hover:bg-orange-50 transition-all flex items-center gap-3">
                  Acompanhar <ChevronRight size={20} />
                </button>
             </div>
          </div>
        )}

        <section className="bg-white border-b border-slate-50 py-6 px-4">
             <div className="max-w-2xl mx-auto relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-all pointer-events-none">
                  <Search size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder="Busque por pratos ou categorias" 
                  className="w-full pl-14 pr-6 py-4 bg-slate-100/50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-100 focus:ring-4 focus:ring-orange-500/5 transition-all text-sm font-bold placeholder:text-slate-400 placeholder:font-medium" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
            </div>
        </section>

        {products.length > 0 && <CategoryBar categories={Array.from(new Set(products.map(p => p.category)))} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />}

        <div className="max-w-6xl mx-auto w-full px-4 py-8">
          <div className="flex justify-between items-baseline mb-6">
            <h2 className="text-xl font-bold text-slate-900">{selectedCategory === 'Todos' ? 'Os mais pedidos' : selectedCategory}</h2>
            <span className="text-xs font-bold text-slate-400">{filteredProducts.length} itens</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 md:h-36 bg-white rounded-3xl animate-pulse border border-slate-100 flex p-4 gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-slate-100 rounded-lg w-3/4"></div>
                    <div className="space-y-2">
                       <div className="h-3 bg-slate-50 rounded-lg w-full"></div>
                       <div className="h-3 bg-slate-50 rounded-lg w-2/3"></div>
                    </div>
                    <div className="h-6 bg-slate-100 rounded-lg w-1/4 mt-auto"></div>
                  </div>
                  <div className="w-24 h-24 md:w-28 md:h-28 bg-slate-100 rounded-2xl shrink-0"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center space-y-4">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300"><Search size={32} /></div>
               <p className="font-bold text-slate-400">Nenhum prato encontrado...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  isStoreOpen={isStoreOpen} 
                  onClick={handleProductClick} 
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="mt-12 py-12 bg-slate-900 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 opacity-50"></div>
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden mb-2"><img src="/logo.png" alt="Sabor de Casa Logo" className="w-full h-full object-cover" /></div>
              <p className="text-white font-black text-lg tracking-tight">Sabor de Casa</p>
           </div>
           <p className="text-slate-500 font-bold text-xs max-w-sm">O sabor caseiro entregue com tecnologia e carinho na porta da sua casa.</p>
           <div className="h-px w-8 bg-slate-800/50"></div>
           <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest mt-2">© 2024 Marmita Express • <Link to="/admin/login" className="hover:text-slate-600 transition-colors cursor-default">Administração</Link></p>
        </div>
      </footer>

      {/* Componentes Refatorados */}
      {customizingProduct && (
        <CustomizationDrawer 
          customizingProduct={customizingProduct} 
          editingCartItemId={editingCartItemId}
          currentSelections={currentSelections}
          observation={observation}
          itemQuantity={itemQuantity}
          isStoreOpen={isStoreOpen}
          onClose={() => { setCustomizingProduct(null); setEditingCartItemId(null); }}
          getOptionQuantity={getOptionQuantity}
          addOption={addOption}
          removeOption={removeOption}
          setObservation={setObservation}
          setItemQuantity={setItemQuantity}
          calculateCurrentPrice={calculateCurrentPrice}
          isSelectionValid={isSelectionValid}
          confirmCustomization={confirmCustomization}
          formatImageUrl={formatImageUrl}
        />
      )}

      {isCartOpen && (
        <CartDrawer 
          items={items}
          subtotal={subtotal}
          finalTotal={finalTotal}
          discountAmount={discountAmount}
          appliedCoupon={appliedCoupon}
          couponInput={couponInput}
          hasMarmitaInCart={hasMarmitaInCart}
          onClose={() => setIsCartOpen(false)}
          onEditItem={handleEditCartItem}
          onRemoveItem={removeFromCart}
          onApplyCoupon={handleApplyCoupon}
          onSetCouponInput={setCouponInput}
          onRemoveCoupon={() => setAppliedCoupon(null)}
          onCheckout={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
        />
      )}

      {isCheckoutOpen && (
        <CheckoutModal 
          finalTotal={finalTotal}
          deliveryType={deliveryType}
          formData={formData}
          config={config}
          isStoreOpen={isStoreOpen}
          isOutsideRadius={isOutsideRadius}
          isSearchingCep={isSearchingCep}
          cashAmount={cashAmount}
          onClose={() => setIsCheckoutOpen(false)}
          setDeliveryType={setDeliveryType}
          setFormData={setFormData}
          onCepChange={handleCepChange}
          onGetLocation={handleGetLocation}
          setCashAmount={setCashAmount}
          onCheckout={handleCheckout}
        />
      )}

      {orderSuccess && activeOrder && (
        <OrderTrackingModal 
          activeOrder={activeOrder}
          config={config}
          onClose={() => setOrderSuccess(null)}
          onBackToStart={() => { setOrderSuccess(null); clearCart(); setFormData(INITIAL_FORM_DATA); }}
        />
      )}

      {isMyOrdersOpen && (
        <MyOrdersModal 
          myOrders={myOrders}
          onClose={() => setIsMyOrdersOpen(false)}
          onViewDetails={(order) => { setActiveOrder(order); setOrderSuccess(order.id!); setIsMyOrdersOpen(false); }}
          onRepeatOrder={handleRepeatOrder}
        />
      )}

      {isAuthPromptOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={() => setIsAuthPromptOpen(false)}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-lg p-10 text-center animate-scale-in border border-white/20">
             <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-orange-500 shadow-sm animate-float">
                <ShoppingBag size={40} />
             </div>
             <h2 className="text-3xl font-black text-slate-900 mb-2 leading-tight">Olá! Que bom ter você aqui.</h2>
             <p className="text-slate-400 font-bold mb-10 leading-relaxed text-sm px-4">Deseja entrar com sua conta Google para salvar seus pedidos ou prefere continuar como visitante?</p>
             
             <div className="space-y-4">
                <button 
                  onClick={handleAuthPromptLogin}
                  className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                  Entrar com Google
                </button>
                <button 
                  onClick={handleContinueAsGuest}
                  className="w-full py-5 bg-white text-slate-500 font-black rounded-2xl border-2 border-slate-100 hover:border-orange-500 hover:text-orange-500 transition-all active:scale-95"
                >
                  Continuar sem logar
                </button>
             </div>
             <p className="mt-8 text-[10px] font-bold text-slate-300 uppercase tracking-widest cursor-pointer hover:text-slate-400" onClick={() => setIsAuthPromptOpen(false)}>Agora não, só quero olhar</p>
          </div>
        </div>
      )}

      {/* Botão Flutuante da Sacola */}
      {items.length > 0 && !isCartOpen && !isCheckoutOpen && !orderSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] w-[calc(100%-2rem)] max-w-lg animate-slide-up">
           <button onClick={() => setIsCartOpen(true)} className="w-full bg-orange-500 text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center group active:scale-95 transition-all">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black">{items.reduce((acc, i) => acc + i.quantity, 0)}</div>
                 <div className="text-left font-black"><p className="text-[10px] uppercase tracking-widest opacity-80">Ver Sacola</p><p className="text-sm">Pronto para finalizar?</p></div>
              </div>
              <div className="flex items-center gap-3"><span className="font-black text-lg">R$ {subtotal.toFixed(2)}</span><ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" /></div>
           </button>
        </div>
      )}

      {isAddressModalOpen && (
        <AddressModal 
          formData={formData}
          isSearchingCep={isSearchingCep}
          isOutsideRadius={isOutsideRadius}
          onClose={() => setIsAddressModalOpen(false)}
          onCepChange={handleCepChange}
          onGetLocation={handleGetLocation}
          setFormData={setFormData}
        />
      )}

      <Receipt activeOrder={activeOrder} />
    </div>
  );
};

export default Store;
