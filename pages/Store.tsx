
import React, { useState, useEffect, useMemo } from 'react';
import { getActiveProducts, createOrder, getRestaurantConfig, getCoupons, subscribeToOrder, incrementCouponUsage, getCustomerOrders } from '../services/database';
import { Product, PaymentMethod, OptionGroup, SelectedOption, Order, OrderStatus, RestaurantConfig, Coupon, OrderItem } from '../types';
import { useCart } from '../App';
import { 
  ShoppingCart, X, Search, UtensilsCrossed, Check, AlertCircle, Plus, Minus, Info, Lock, MapPin, Navigation, Home, Building2, Loader2, Clock, Truck, PackageCheck, ChevronRight, Heart, Star, Timer, Flame,
  LayoutDashboard, ShoppingBag, Trash2, ShieldCheck, ChevronDown, Tag, AlertTriangle, Settings, Edit3, LogIn, User, LogOut, Calendar, ArrowRight, CreditCard, ArrowLeft, MessageSquare, Printer, Share2, ClipboardList
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase-config';
import { signInWithPopup, onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';

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

const Store: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<RestaurantConfig | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponInput, setCouponInput] = useState('');
  
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Marmitas');
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [isOutsideRadius, setIsOutsideRadius] = useState(false);
  
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
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
    }, 30000); // 30 segundos
    return () => clearInterval(timer);
  }, []);

  const { items, addToCart, updateCartItem, removeFromCart, clearCart, total: subtotal } = useCart();

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
      // Se o usuário logou com email/senha (Admin), não mostramos como logado na loja.
      const isEmailAdmin = user?.providerData.some((p: any) => p.providerId === 'password');
      
      if (user && !isEmailAdmin) {
        setCurrentUser(user);
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
      if (err.code === 'auth/unauthorized-domain') {
        alert(
          "⚠️ DOMÍNIO NÃO AUTORIZADO\n\n" +
          "O login com Google não está funcionando porque este domínio ainda não foi autorizado no Firebase.\n\n" +
          "Para corrigir:\n" +
          "1. Vá ao Firebase Console\n" +
          "2. Authentication -> Settings -> Authorized Domains\n" +
          "3. Adicione o domínio atual da sua página."
        );
      } else {
        alert("Erro ao tentar entrar com o Google. Tente novamente.");
      }
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

  const handleShareReceipt = (order: Order) => {
    const itemsText = order.items.map(i => `${i.quantity}x ${i.name} - R$ ${(i.price * i.quantity).toFixed(2)}`).join('\n');
    const text = `*COMPROVANTE DE PEDIDO*\n` +
                 `Pedido: #${order.id?.slice(-6)}\n` +
                 `Cliente: ${order.customerName}\n` +
                 `Status: ${order.status}\n` +
                 `--------------------------\n` +
                 `${itemsText}\n` +
                 `--------------------------\n` +
                 `Subtotal: R$ ${order.subtotal.toFixed(2)}\n` +
                 `Entrega: R$ ${order.deliveryFee.toFixed(2)}\n` +
                 `Desconto: R$ ${order.discount?.toFixed(2) || '0.00'}\n` +
                 `*TOTAL: R$ ${order.total.toFixed(2)}*\n\n` +
                 `Obrigado pela preferência! Marmita Express`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handlePrintReceipt = () => {
    window.print();
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
      // Caso de horário que vira a noite (ex: 22:00 às 02:00)
      return currentStr >= config.openingTime || currentStr <= config.closingTime;
    }
  }, [config, currentTime]);

  useEffect(() => {
    loadInitialData();

    // Atalho secreto para Admin: Alt + Shift + A
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

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [prods, conf, coups] = await Promise.all([
        getActiveProducts(),
        getRestaurantConfig(),
        getCoupons()
      ]);
      setProducts(prods);
      setConfig(conf);
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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, cep: cleanCep }));

    if (cleanCep.length === 8) {
      setIsSearchingCep(true);
      setIsOutsideRadius(false);
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
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
          const geoData = await geoRes.json();

          if (geoData?.[0] && config?.latitude && config?.longitude) {
            const distance = calculateDistance(config.latitude, config.longitude, parseFloat(geoData[0].lat), parseFloat(geoData[0].lon));
            setDeliveryDistance(distance);
            if (distance > (config.deliveryRadiusKm || 10)) setIsOutsideRadius(true);
          }
          document.getElementById('address-number')?.focus();
        } else alert('CEP não encontrado.');
      } catch (err) {
        console.error('Erro Geocoding:', err);
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

      // Se for preço individual ou houver espaço no limite
      if (!group.max || currentCount < group.max || (group.extraPricePerItem && group.extraPricePerItem > 0)) {
        // Se max for 1 e não tiver preço extra, substitui (comportamento de rádio)
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
      
      // Soma preços individuais de cada item selecionado (incluindo quantidade)
      Object.entries(selections).forEach(([name, qty]) => {
        const optionItem = g.items.find(i => i.name === name);
        if (optionItem?.price) {
          total += (optionItem.price * qty);
        }
      });

      // Soma extra para quando excede o limite (se configurado)
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
      return {
        groupName: g.name,
        items: itemsList
      };
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

    if (editingCartItemId) {
      updateCartItem(editingCartItemId, itemData);
    } else {
      addToCart(itemData);
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
    try {
      const orders = await getCustomerOrders(currentUser ? { userId: currentUser.uid } : { guestId });
      setMyOrders(orders);
    } catch (err: any) {
      console.error("Erro ao carregar pedidos:", err);
      // Se for erro de permissão, apenas define lista vazia
      if (err?.code === 'permission-denied') {
        setMyOrders([]);
        console.warn("Permissões do Firestore não configuradas para leitura de pedidos");
      } else {
        setMyOrders([]);
      }
    }
  };

  useEffect(() => {
    if (isMyOrdersOpen) {
      loadMyOrders();
    }
  }, [isMyOrdersOpen, currentUser, guestId]);

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
      if (config.openingTime <= config.closingTime) {
        storeTrulyOpen = currentStr >= config.openingTime && currentStr <= config.closingTime;
      } else {
        storeTrulyOpen = currentStr >= config.openingTime || currentStr <= config.closingTime;
      }
    }

    if (!storeTrulyOpen) {
      alert(`Desculpe, a loja fechou agora pouco. Nosso horário de atendimento é das ${config?.openingTime} às ${config?.closingTime}. (Horário atual: ${currentStr})`);
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
      
      if (appliedCoupon && appliedCoupon.id) {
        await incrementCouponUsage(appliedCoupon.id);
      }

      setOrderSuccess(docRef.id);
      setTrackingOrderId(docRef.id);
      localStorage.setItem('trackingOrderId', docRef.id);
      clearCart();
      setIsCheckoutOpen(false);
      setAppliedCoupon(null);
    } catch (err) {
      console.error("Erro Checkout:", err);
      alert('Houve uma falha ao processar seu pedido. Verifique sua conexão.');
    }
  };

  const sendWhatsAppMessage = (orderId: string) => {
    const whatsappNumber = config?.whatsappNumber || '5511999999999';
    
    let message = `*NOVO PEDIDO #${orderId.slice(-6)}*\n\n`;
    message += `*Cliente:* ${formData.customerName}\n`;
    message += `*Telefone:* ${formData.phone}\n`;
    message += `*Endereço:* ${formData.street}, ${formData.number}`;
    if (formData.complement) message += ` (${formData.complement})`;
    message += `\n   ${formData.neighborhood}, ${formData.city}\n`;
    message += `   CEP: ${formData.cep}\n\n`;
    
    message += `*Itens do Pedido:*\n`;
    items.forEach(item => {
      message += `\n• ${item.quantity}x ${item.name} - R$ ${item.price.toFixed(2)}\n`;
      if (item.selectedOptions && item.selectedOptions.length > 0) {
        item.selectedOptions.forEach(opt => {
          if (opt.items.length > 0) {
            message += `  └ ${opt.groupName}: ${opt.items.join(', ')}\n`;
          }
        });
      }
      if (item.observation) {
        message += `  └ Obs: ${item.observation}\n`;
      }
    });
    
    message += `\n*Resumo Financeiro:*\n`;
    message += `Subtotal: R$ ${subtotal.toFixed(2)}\n`;
    message += `Entrega: R$ ${deliveryFee.toFixed(2)}\n`;
    if (discountAmount > 0) {
      message += `Desconto: -R$ ${discountAmount.toFixed(2)}\n`;
    }
    message += `*Total: R$ ${finalTotal.toFixed(2)}*\n\n`;
    
    message += `*Pagamento:* ${formData.paymentMethod}\n`;
    if (formData.paymentMethod === PaymentMethod.CASH && cashAmount && parseFloat(cashAmount) > finalTotal) {
      message += `*Troco para:* R$ ${parseFloat(cashAmount).toFixed(2)}\n`;
      message += `*Troco:* R$ ${(parseFloat(cashAmount) - finalTotal).toFixed(2)}\n`;
    }
    if (formData.paymentMethod === PaymentMethod.PIX) {
      message += `\n*Aguardando comprovante do PIX*`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredProducts = useMemo(() => {
    const today = new Date().getDay(); // 0-6
    return products.filter(p => {
      // Regra: Deve estar ativo
      if (!p.active) return false;
      
      // Regra: Disponibilidade por dia da semana
      // Se availableDays não existe, assume disponível todos os dias
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
      {/* Header Estilo iFood */}
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
              onClick={() => {
                if (items.length > 0) {
                  setIsCheckoutOpen(true);
                } else {
                  alert("Adicione itens à sacola para definir o endereço de entrega.");
                }
              }}
              className={`hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100 ml-4 max-w-xs truncate transition-colors ${items.length > 0 ? 'cursor-pointer hover:bg-slate-100' : 'cursor-default'}`}
            >
              <MapPin size={14} className="text-orange-500 shrink-0" />
              <span className="text-xs font-bold text-slate-600 truncate">
                {formData.street ? `${formData.street}, ${formData.number}` : (config?.addressBase || 'Selecione o endereço')}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
                  className="p-1 border border-slate-100 rounded-full hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                >
                   <img src={currentUser.photoURL || ''} alt="" className="w-8 h-8 rounded-full object-cover" />
                   <ChevronDown size={14} className="text-slate-400 mr-1" />
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute top-12 right-0 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl p-2 z-[70] animate-scale-in origin-top-right">
                    <div className="px-3 py-2 border-b border-slate-50 mb-1">
                      <p className="text-xs font-black text-slate-800 truncate">{currentUser.displayName}</p>
                      <p className="text-[10px] text-slate-400 font-bold truncate">{currentUser.email}</p>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setIsMyOrdersOpen(true);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all mb-1 md:hidden"
                    >
                      <ClipboardList size={14} /> Meus Pedidos
                    </button>

                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-black text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <LogOut size={14} /> Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={handleGoogleLogin} className="text-xs font-black text-orange-500 uppercase tracking-widest px-4 py-2 hover:bg-orange-50 rounded-lg transition-all">
                Entrar
              </button>
            )}

            <button onClick={() => setIsCartOpen(true)} className="relative p-2.5 rounded-xl hover:bg-slate-50 transition-all group">
              <ShoppingCart size={22} className="text-slate-700 group-hover:text-orange-500 transition-colors" />
              {items.length > 0 && (
                <span className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full ring-2 ring-white">
                  {items.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              )}
            </button>

            <button 
              onClick={() => setIsMyOrdersOpen(true)} 
              className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-orange-50 text-slate-700 hover:text-orange-500 transition-all group"
              title="Meus Pedidos"
            >
              <ClipboardList size={22} />
              <span className="hidden md:inline text-xs font-bold uppercase tracking-widest">Meus Pedidos</span>
            </button>
          </div>
        </div>
      </header>

      {!isStoreOpen && (
        <div className="bg-red-500 text-white font-black py-4 px-6 text-center animate-pulse sticky top-[64px] md:top-[80px] z-[55]">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-3">
            <Clock size={20} />
            <p className="text-sm uppercase tracking-widest">
              Loja Fechada no Momento • Horário: {config?.openingTime} às {config?.closingTime}
            </p>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* Banner de Pedido Ativo */}
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

        {/* Seção de Busca iFood */}
        <section className="bg-white border-b border-slate-50 py-4 px-4">
             <div className="max-w-2xl mx-auto relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-all pointer-events-none">
                  <Search size={18} />
                </div>
                <input 
                  type="text" 
                  placeholder="Busque por pratos ou categorias" 
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 border-none rounded-lg focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all text-sm font-medium placeholder:text-slate-400" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
            </div>
        </section>

        {/* Categorias Estilo iFood Banners/Chips */}
        {products.length > 0 && (
          <div className="bg-white border-b border-slate-50 sticky top-16 md:top-20 z-50">
            <div className="max-w-6xl mx-auto flex gap-4 overflow-x-auto py-4 no-scrollbar px-4">
              {Array.from(new Set(['Todos', ...products.map(p => p.category)])).map((cat) => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)} 
                  className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-all text-xs border ${
                    selectedCategory === cat 
                    ? 'bg-orange-500 text-white border-orange-500' 
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto w-full px-4 py-8">
          <div className="flex justify-between items-baseline mb-6">
            <h2 className="text-xl font-bold text-slate-900">{selectedCategory === 'Todos' ? 'Os mais pedidos' : selectedCategory}</h2>
            <span className="text-xs font-bold text-slate-400">{filteredProducts.length} itens</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-xl animate-pulse border border-slate-100" />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center space-y-4">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                 <Search size={32} />
               </div>
               <p className="font-bold text-slate-400">Nenhum prato encontrado...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProducts.map((product, idx) => (
              <div 
                key={product.id} 
                onClick={() => {
                  if (!isStoreOpen) {
                    alert('Loja fechada no momento. Não é possível adicionar itens à sacola.');
                    return;
                  }
                  product.optionsGroups?.length ? handleOpenCustomization(product) : handleAddAction(product);
                }}
                className={`bg-white p-4 rounded-xl border border-slate-100 transition-all flex gap-4 group ${
                  isStoreOpen 
                    ? 'hover:border-slate-200 hover:shadow-sm cursor-pointer' 
                    : 'opacity-60 cursor-not-allowed grayscale-[0.5]'
                }`}
              >
                <div className="flex-1 space-y-2">
                  <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-orange-500 transition-colors">{product.name}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 font-medium">{product.description}</p>
                  <p className="text-slate-800 font-bold text-sm pt-1">
                    <span className="text-orange-600 font-medium mr-0.5">R$</span> {product.price.toFixed(2)}
                  </p>
                </div>
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden shrink-0 relative">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>

      {/* Footer Refinado */}
      <footer className="mt-12 py-12 bg-slate-900 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 opacity-50"></div>
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden mb-2">
                <img src="/logo.png" alt="Sabor de Casa Logo" className="w-full h-full object-cover" />
              </div>
              <p className="text-white font-black text-lg tracking-tight">Sabor de Casa</p>
           </div>
           <p className="text-slate-500 font-bold text-xs max-w-sm">O sabor caseiro entregue com tecnologia e carinho na porta da sua casa.</p>
           
           <div className="h-px w-8 bg-slate-800/50"></div>
           
           <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest mt-2">
             © 2024 Marmita Express • <Link to="/admin/login" className="hover:text-slate-600 transition-colors cursor-default">Todos os direitos reservados</Link>
           </p>
        </div>
      </footer>

      {/* Drawer de Customização Premium */}
      {customizingProduct && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={() => { setCustomizingProduct(null); setEditingCartItemId(null); }}></div>
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-slide-in overflow-hidden md:rounded-l-[3.5rem]">
            {/* Header da Customização */}
            <div className="p-8 md:p-10 border-b border-slate-50 shrink-0 bg-white">
              <div className="flex justify-between items-start mb-6">
                <div>
                   <span className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] mb-2 inline-block">Personalizar Marmita</span>
                   <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight tracking-tight italic">
                     {editingCartItemId ? 'Ajustar Pedido' : customizingProduct.name}
                   </h2>
                </div>
                <button onClick={() => { setCustomizingProduct(null); setEditingCartItemId(null); }} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><X size={20} className="text-slate-300" /></button>
              </div>
              <div className="flex gap-4 items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <img src={customizingProduct.imageUrl} className="w-14 h-14 rounded-xl object-cover shadow-sm" alt={customizingProduct.name} />
                  <div>
                    <h3 className="text-base font-black text-slate-800 tracking-tight leading-none mb-1">{customizingProduct.name}</h3>
                    <p className="text-orange-500 font-extrabold text-sm tracking-tight">R$ {customizingProduct.price.toFixed(2)}</p>
                  </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-10 no-scrollbar">
              {customizingProduct.optionsGroups?.map(group => (
                <div key={group.id} className="space-y-4">
                  <div className="flex justify-between items-end border-b border-slate-50 pb-3">
                    <div>
                      <h4 className="text-base font-black text-slate-800">{group.name}</h4>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        {group.min > 0 ? (
                          <span className="text-orange-500">Obrigatório • Selecione pelo menos {group.min}</span>
                        ) : (
                          <span className="text-slate-400 font-bold">Opcional</span>
                        )}
                        {group.max > 0 && ` • Até ${group.max} itens`}
                        {group.extraPricePerItem ? ` • +R$ ${group.extraPricePerItem.toFixed(2)} por adicional` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {group.items.map(item => (
                      <div 
                        key={item.name} 
                        className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all group/item ${
                          getOptionQuantity(group.id, item.name) > 0 
                          ? 'border-orange-500 bg-orange-50/30' 
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            {item.imageUrl ? (
                              <img src={formatImageUrl(item.imageUrl)!} className="w-16 h-16 rounded-xl object-cover shadow-sm border border-white" alt={item.name} />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300 border border-white">
                                <ShoppingBag size={20} />
                              </div>
                            )}
                            {getOptionQuantity(group.id, item.name) > 0 && (
                              <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-black scale-110 shadow-lg shadow-orange-500/20">
                                {getOptionQuantity(group.id, item.name)}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className={`font-black text-sm tracking-tight transition-colors block ${
                              getOptionQuantity(group.id, item.name) > 0 ? 'text-slate-900' : 'text-slate-600'
                            }`}>
                              {item.name}
                            </span>
                            {item.price && item.price > 0 && (
                              <span className="text-[10px] font-bold text-orange-500 mt-0.5 block">
                                + R$ {item.price.toFixed(2)}
                              </span>
                            )}
                            {group.extraPricePerItem && group.extraPricePerItem > 0 && 
                             Object.values(currentSelections[group.id] || {}).reduce((a, b) => a + b, 0) >= group.max && (
                              <span className="text-[9px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md mt-1 inline-block">
                                + R$ {group.extraPricePerItem.toFixed(2)} adicional
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {getOptionQuantity(group.id, item.name) > 0 && (
                             <button 
                               onClick={() => removeOption(group.id, item.name)}
                               className="p-2 hover:bg-orange-100 text-orange-600 rounded-lg transition-all"
                             >
                                <Minus size={16} />
                             </button>
                          )}
                          {getOptionQuantity(group.id, item.name) > 0 && (
                            <span className="w-8 text-center font-black text-sm text-slate-900">
                               {getOptionQuantity(group.id, item.name)}
                            </span>
                          )}
                          <button 
                            onClick={() => addOption(group.id, item.name, group)}
                            className="p-2 hover:bg-orange-100 text-orange-600 rounded-lg transition-all"
                          >
                             <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="space-y-3">
                 <h4 className="text-base font-black text-slate-800">Observações</h4>
                 <textarea placeholder="Ex: Sem cebola..." className="w-full p-6 bg-slate-50 border border-slate-100 rounded-xl focus:border-orange-400/50 outline-none font-bold min-h-[100px] text-xs transition-all placeholder:text-slate-300" value={observation} onChange={e => setObservation(e.target.value)} />
              </div>
            </div>

            {/* Footer de Ação Refinado */}
            <div className="p-8 border-t border-slate-100 bg-slate-50/50 space-y-5 shrink-0">
               <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-4 bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
                    <button 
                      onClick={() => setItemQuantity(prev => Math.max(1, prev - 1))}
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                    >
                      <Minus size={20} />
                    </button>
                    <span className="w-8 text-center font-black text-lg text-slate-900">{itemQuantity}</span>
                    <button 
                      onClick={() => setItemQuantity(prev => prev + 1)}
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-300 font-black uppercase text-[9px] tracking-[0.2em] mb-1 block">Total do Item</span>
                    <span className="text-2xl font-black text-slate-900 tracking-tight">R$ {(calculateCurrentPrice() * itemQuantity).toFixed(2)}</span>
                  </div>
               </div>
                <button 
                onClick={confirmCustomization} 
                disabled={!isStoreOpen || !isSelectionValid()} 
                className={`w-full py-4 font-black text-sm uppercase tracking-[0.2em] rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-20 disabled:grayscale transition-all ${
                  isStoreOpen ? 'bg-slate-900 text-white hover:bg-black' : 'bg-slate-200 text-slate-500'
                }`}
              >
                 {editingCartItemId ? 'Salvar Alterações' : isStoreOpen ? 'Adicionar à Sacola' : 'Loja Fechada'}
                 {!editingCartItemId && isStoreOpen && <Plus size={18} />}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Carrinho */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Sua Sacola</h2>
                <p className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest">{items.length} itens no pedido</p>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-3 hover:bg-slate-50 rounded-xl transition-all"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-6 no-scrollbar">
              {items.map(item => (
                <div key={item.productId} className="p-5 bg-white rounded-2xl border border-slate-100 space-y-3 relative group hover:border-orange-200 transition-all duration-300">
                  <div className="absolute top-4 right-4 flex gap-1 cursor-pointer">
                    <button onClick={() => handleEditCartItem(item)} className="text-slate-200 hover:text-orange-500 p-1.5 transition-colors"><Edit3 size={16} /></button>
                    <button onClick={() => removeFromCart(item.productId)} className="text-slate-200 hover:text-red-500 p-1.5 transition-colors"><Trash2 size={16} /></button>
                  </div>
                  <h4 className="font-black text-base text-slate-900 pr-12 leading-tight">{item.name}</h4>
                  
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <div className="space-y-1">
                      {item.selectedOptions.map(opt => (
                        <p key={opt.groupName} className="text-[9px] text-slate-400 font-bold leading-tight">
                          <span className="text-orange-500/70 uppercase mr-1">{opt.groupName}:</span> {opt.items.join(', ')}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs font-black text-slate-900 pt-2 border-t border-slate-50">
                    <span className="text-slate-400">Qtd: {item.quantity}</span>
                    <span className="text-orange-600">R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}

              <div className="mt-8 pt-8 border-t border-slate-50">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Código Promocional</p>
                 <div className="flex gap-2">
                    <input 
                      className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-black uppercase outline-none focus:border-orange-500 focus:bg-white transition-all text-xs" 
                      placeholder="EX: TRINTAOFF" 
                      value={couponInput} 
                      onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    />
                    <button onClick={handleApplyCoupon} className="px-5 bg-slate-900 text-white rounded-xl hover:bg-black transition-all shadow-md active:scale-95">
                      <Plus size={20} />
                    </button>
                 </div>
                 {appliedCoupon && (
                   <div className="mt-3 flex items-center justify-between p-3 bg-orange-50 border border-orange-100 rounded-xl animate-fade-in group">
                      <div className="flex items-center gap-2">
                         <Tag size={14} className="text-orange-500" />
                         <span className="text-[10px] font-black text-orange-800 uppercase tracking-widest">{appliedCoupon.code}</span>
                      </div>
                      <button onClick={() => setAppliedCoupon(null)} className="text-slate-300 hover:text-orange-500 transition-colors"><X size={14} /></button>
                   </div>
                 )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-white space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-xs text-green-600">
                    <span>CUPOM: {appliedCoupon.code}</span>
                    <span>- R$ {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-2 border-t border-slate-50">
                  <span className="text-sm font-bold text-slate-900">Total</span>
                  <span className="text-2xl font-black text-orange-500 tracking-tight">R$ {finalTotal.toFixed(2)}</span>
                </div>
              </div>
              <button 
                disabled={!hasMarmitaInCart} 
                onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} 
                className="w-full py-4 bg-orange-500 text-white font-black text-sm uppercase rounded-lg shadow-sm hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale"
              >
                Escolher Endereço
                <ArrowRight size={18} />
              </button>
              
              <button 
                onClick={() => setIsCartOpen(false)} 
                className="w-full py-4 border-2 border-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <ArrowLeft size={14} />
                Continuar Comprando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Premium Organizado */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={() => setIsCheckoutOpen(false)}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col md:flex-row shadow-orange-500/10 border border-white/20">
             {/* Lado Esquerdo - Info Refinada */}
             <div className="hidden md:flex w-72 bg-slate-900 px-10 py-12 flex-col justify-between text-white shrink-0 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600 opacity-60"></div>
                <div className="relative z-10 space-y-6">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                    <Truck size={24} className="text-orange-500" />
                  </div>
                  <h3 className="text-2xl font-black leading-tight tracking-tight italic">Quase lá! 🥘</h3>
                  <p className="text-slate-400 font-bold text-xs leading-relaxed">Confira seus dados para que sua marmita chegue perfeita para você.</p>
                </div>
                <div className="relative z-10 p-5 bg-white/5 rounded-2xl border border-white/10">
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Resumo da Compra</p>
                   <p className="text-2xl font-black text-white tracking-tight">R$ {finalTotal.toFixed(2)}</p>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-8 md:p-12 no-scrollbar bg-white">
                <div className="flex justify-between items-start mb-8 md:mb-10">
                   <div>
                     <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Finalizar Pedido</h2>
                     <p className="text-slate-400 font-bold text-xs mt-1">Sua refeição está a poucos cliques de distância.</p>
                   </div>
                   <button onClick={() => setIsCheckoutOpen(false)} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-300 transition-all">
                      <X size={20} />
                   </button>
                </div>
                
                <form onSubmit={handleCheckout} className="space-y-12">
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-8">
                    <button 
                      type="button" 
                      onClick={() => setDeliveryType('delivery')}
                      className={`py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${deliveryType === 'delivery' ? 'bg-white shadow-sm text-orange-500' : 'text-slate-400'}`}
                    >
                      <Truck size={16} /> Entrega
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setDeliveryType('pickup')}
                      className={`py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${deliveryType === 'pickup' ? 'bg-white shadow-sm text-orange-500' : 'text-slate-400'}`}
                    >
                      <ShoppingBag size={16} /> Retirada
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                        <User size={14} />
                      </div>
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Quem vai receber</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Nome Completo</label>
                        <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-orange-500/50 focus:bg-white transition-all text-sm" placeholder="Nome" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">WhatsApp</label>
                        <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:border-orange-500/50 focus:bg-white transition-all text-sm" placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  {/* Seção 2: Onde Entregar */}
                  {deliveryType === 'delivery' ? (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                          <MapPin size={18} />
                        </div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Onde Entregar</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">CEP</label>
                          <div className="relative">
                            <input required={deliveryType === 'delivery'} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-orange-500 transition-all placeholder:text-slate-300" placeholder="00000-000" value={formData.cep} onChange={e => handleCepChange(e.target.value)} />
                            {isSearchingCep && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-orange-500" size={16} />}
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Bairro</label>
                          <input className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-orange-500 transition-all placeholder:text-slate-300" placeholder="Ex: Centro" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                        </div>
                        
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Rua / Logradouro</label>
                          <input required={deliveryType === 'delivery'} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-orange-500 transition-all placeholder:text-slate-300" placeholder="Nome da rua" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Número</label>
                          <input id="address-number" required={deliveryType === 'delivery'} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-orange-500 transition-all placeholder:text-slate-300" placeholder="123" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-orange-50 p-8 rounded-3xl border border-orange-100 text-center animate-fade-in space-y-4">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-500 shadow-sm">
                        <Building2 size={32} />
                      </div>
                      <div>
                        <h4 className="font-black text-orange-900 text-sm uppercase tracking-widest mb-1">Retirar no Local</h4>
                        <p className="text-slate-700 font-black text-xl leading-tight">{config?.addressBase || 'Endereço não configurado'}</p>
                      </div>
                      <div className="bg-white/60 p-4 rounded-xl inline-block border border-orange-100">
                        <p className="text-[10px] text-orange-800 font-bold uppercase tracking-widest">Tempo estimado de preparo</p>
                        <p className="text-lg font-black text-slate-900">30 - 45 min</p>
                      </div>
                    </div>
                  )}

                  {/* Seção 3: Pagamento */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                        <CreditCard size={18} />
                      </div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Pagamento na Entrega</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: PaymentMethod.PIX, icon: '💠', label: 'Pix' },
                        { id: PaymentMethod.CARD, icon: '💳', label: 'Cartão' },
                        { id: PaymentMethod.CASH, icon: '💵', label: 'Dinheiro' }
                      ].map(method => (
                        <button 
                          key={method.id}
                          type="button"
                          onClick={() => setFormData({...formData, paymentMethod: method.id})}
                          className={`flex flex-col items-center gap-2 p-6 rounded-3xl border-2 transition-all ${
                            formData.paymentMethod === method.id 
                            ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-lg shadow-orange-500/10' 
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-2xl">{method.icon}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">{method.label}</span>
                        </button>
                      ))}
                    </div>
                    
                    {/* Instruções para PIX */}
                    {formData.paymentMethod === PaymentMethod.PIX && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white shrink-0">
                            <MessageSquare size={16} />
                          </div>
                          <div>
                            <h5 className="font-black text-sm text-blue-900 mb-1">Importante!</h5>
                            <p className="text-xs text-blue-700 font-bold leading-relaxed">
                              Após fazer o PIX, envie o comprovante pelo WhatsApp para confirmar seu pedido.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Campo de Troco para Dinheiro */}
                    {formData.paymentMethod === PaymentMethod.CASH && (
                      <div className="mt-4 space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                          Vai pagar com quanto? (Opcional)
                        </label>
                        <input 
                          type="number"
                          step="0.01"
                          placeholder={`Total: R$ ${finalTotal.toFixed(2)}`}
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-orange-500 transition-all placeholder:text-slate-300"
                        />
                        {cashAmount && parseFloat(cashAmount) > finalTotal && (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <Check size={14} className="text-white" />
                              </div>
                              <p className="text-sm font-black text-green-900">
                                Troco: R$ {(parseFloat(cashAmount) - finalTotal).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                   {/* Botão Finalizar */}
                   <div className="pt-6">
                     <button 
                       type="submit" 
                       disabled={!isStoreOpen || (deliveryType === 'delivery' && (isOutsideRadius || !formData.street)) || !formData.customerName || !formData.phone}
                       className="w-full py-7 bg-gradient-to-r from-orange-500 to-red-600 text-white font-black text-xl rounded-[2.5rem] shadow-2xl shadow-orange-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-30 disabled:grayscale"
                     >
                       {!isStoreOpen ? 'Loja Fechada no Momento' : (isOutsideRadius ? 'Fora do Raio de Entrega' : 'Confirmar e Enviar Pedido')}
                       {isStoreOpen && !isOutsideRadius && <ArrowRight size={24} />}
                     </button>
                     {!isStoreOpen && (
                       <p className="text-center text-xs font-bold text-red-500 mt-4">
                         Horário de atendimento: {config?.openingTime} às {config?.closingTime}
                       </p>
                     )}
                   </div>
                </form>
             </div>
          </div>
        </div>
      )}

      {/* Rastreio iFood Style */}
      {orderSuccess && activeOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-none md:rounded-2xl shadow-xl max-w-lg w-full h-full md:h-auto overflow-hidden animate-slide-up flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
                 <h2 className="text-lg font-bold text-slate-900">Acompanhar Pedido</h2>
                 <button onClick={() => setOrderSuccess(null)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-all"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                 <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white shrink-0">
                      <Clock size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 leading-tight capitalize">{activeOrder.status}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Estamos preparando seu pedido</p>
                    </div>
                 </div>

                 {activeOrder.paymentMethod === PaymentMethod.PIX && (
                    <div className="space-y-4 border-t border-slate-100 pt-6">
                       <h4 className="font-bold text-sm text-slate-900">Pagamento Necessário</h4>
                       <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                         <p className="text-center text-lg font-black text-slate-800 mb-2">Chave Pix: 12.345.678/0001-99</p>
                         <p className="text-center text-[10px] font-bold text-slate-400">Copie o CNPJ acima e pague no seu app do banco.</p>
                       </div>
                       <button className="w-full py-3.5 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                         Copiar Chave Pix
                       </button>
                    </div>
                 )}



                  <div className="pt-2 space-y-3">
                    <button 
                      onClick={() => {
                        const whatsappNumber = config?.whatsappNumber?.replace(/\D/g, '') || '5511999999999';
                        const text = encodeURIComponent(`Olá, realizei o pedido #${activeOrder.id?.slice(-6)} e gostaria de falar com o restaurante.`);
                        window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
                      }} 
                      className="w-full py-4 bg-green-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-3 hover:bg-green-600 active:scale-95 transition-all shadow-lg shadow-green-500/20"
                    >
                      <MessageSquare size={18} /> Conversar com a Loja
                    </button>
                    
                    <button 
                      onClick={() => { setOrderSuccess(null); clearCart(); setFormData(INITIAL_FORM_DATA); }} 
                      className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 transition-all mt-4"
                    >
                      Voltar para o Início
                    </button>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* Floating Cart Button (iFood Style) */}
      {items.length > 0 && !isCartOpen && !isCheckoutOpen && !orderSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] w-[calc(100%-2rem)] max-w-lg animate-slide-up">
           <button 
             onClick={() => setIsCartOpen(true)}
             className="w-full bg-orange-500 text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center group active:scale-95 transition-all"
           >
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black">
                    {items.reduce((acc, i) => acc + i.quantity, 0)}
                 </div>
                 <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Ver Sacola</p>
                    <p className="font-black text-sm">Pronto para finalizar?</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <span className="font-black text-lg">R$ {subtotal.toFixed(2)}</span>
                 <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </div>
           </button>
        </div>
      )}

      {/* Meus Pedidos Modal */}
      {isMyOrdersOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-none md:rounded-2xl shadow-xl max-w-2xl w-full h-full md:h-[80vh] overflow-hidden animate-slide-up flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white">
                  <ClipboardList size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 leading-tight">Meus Pedidos</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Histórico e status atual</p>
                </div>
              </div>
              <button onClick={() => setIsMyOrdersOpen(false)} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-300 transition-all"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 no-scrollbar bg-slate-50/50">
              {myOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                   <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                     <ShoppingBag size={32} />
                   </div>
                   <div>
                     <p className="font-black text-slate-800">Você ainda não fez nenhum pedido.</p>
                     <p className="text-xs text-slate-400 font-bold mt-1">Que tal pedir uma marmita deliciosa hoje?</p>
                   </div>
                </div>
              ) : (
                myOrders.map(order => (
                  <div key={order.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:border-orange-200 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pedido #{order.id?.slice(-6)}</p>
                        <p className="text-xs font-bold text-slate-900">{new Date(order.createdAt).toLocaleString('pt-BR')}</p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        order.status === OrderStatus.FINISHED ? 'bg-green-100 text-green-600' :
                        'bg-orange-100 text-orange-600 animate-pulse'
                      }`}>
                        {order.status}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 py-3 border-y border-slate-50">
                      <div className="flex-1">
                        <p className="text-[10px] text-slate-400 font-bold">Itens do Pedido</p>
                        <p className="text-xs font-bold text-slate-800 line-clamp-1 mt-0.5">
                          {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold">Total</p>
                        <p className="text-sm font-black text-orange-500">R$ {order.total.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setActiveOrder(order);
                          setOrderSuccess(order.id!);
                          setIsMyOrdersOpen(false);
                        }}
                        className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                      >
                        Ver Detalhes / Status
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-scale-in { animation: scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }

        @media print {
          body > #root > *:not(.print-receipt) { display: none !important; }
          .print-receipt { 
            display: block !important;
            width: 80mm; 
            padding: 5mm;
            font-family: monospace;
            color: black;
            font-size: 10px;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Comprovante Térmico Invisível (aparece no print) */}
      <div className="print-receipt hidden print:block">
        {activeOrder && (
          <>
             <div className="text-center font-bold text-lg mb-2">MARMITA EXPRESS</div>
             <div className="text-center text-xs mb-4">COMPROVANTE DE PEDIDO</div>
             <div className="text-[10px] mb-2">
               ID: #{activeOrder.id?.slice(-6)}<br/>
               Data: {new Date(activeOrder.createdAt).toLocaleString('pt-BR')}<br/>
               Cliente: {activeOrder.customerName}<br/>
               Whats: {activeOrder.phone}<br/>
             </div>
             <div className="border-t border-dashed border-black my-2"></div>
             <div className="text-[10px]">
               {activeOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                     <span>{item.quantity}x {item.name}</span>
                     <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
               ))}
             </div>
             <div className="border-t border-dashed border-black my-2"></div>
             <div className="text-[10px] space-y-1">
               <div className="flex justify-between"><span>Subtotal:</span><span>R$ {activeOrder.subtotal.toFixed(2)}</span></div>
               <div className="flex justify-between"><span>Entrega:</span><span>R$ {activeOrder.deliveryFee.toFixed(2)}</span></div>
               <div className="flex justify-between"><span>Desconto:</span><span>- R$ {activeOrder.discount?.toFixed(2) || '0.00'}</span></div>
               <div className="flex justify-between font-bold text-xs pt-1"><span>TOTAL:</span><span>R$ {activeOrder.total.toFixed(2)}</span></div>
             </div>
             <div className="border-t border-dashed border-black my-2"></div>
             <div className="text-[10px]">
               Endereço: {activeOrder.address}
             </div>
             <div className="text-[10px] mt-4 text-center">
               Obrigado pela preferência!
             </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Store;
