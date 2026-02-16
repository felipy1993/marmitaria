
import React, { useState, useEffect, useMemo } from 'react';
import { getActiveProducts, createOrder, getRestaurantConfig, getCoupons, subscribeToOrder, incrementCouponUsage } from '../services/database';
import { Product, PaymentMethod, OptionGroup, SelectedOption, Order, OrderStatus, RestaurantConfig, Coupon, OrderItem } from '../types';
import { useCart } from '../App';
import { 
  ShoppingCart, X, Search, UtensilsCrossed, CheckCircle, AlertCircle, Sparkles, Plus, Minus, Info, Lock, MapPin, Navigation, Home, Building2, Loader2, Clock, Truck, PackageCheck, ChevronRight, Heart, Star, Timer, Flame,
  LayoutDashboard, ShoppingBag, Trash2, ShieldCheck, ChevronDown, Tag, AlertTriangle, Settings, Edit3, LogIn, User, LogOut, Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { auth, googleProvider } from '../firebase-config';
import { signInWithPopup, onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';

const Store: React.FC = () => {
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
  
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(localStorage.getItem('trackingOrderId'));

  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [editingCartItemId, setEditingCartItemId] = useState<string | null>(null);
  const [currentSelections, setCurrentSelections] = useState<Record<string, string[]>>({});
  const [observation, setObservation] = useState('');

  const { items, addToCart, updateCartItem, removeFromCart, clearCart, total: subtotal } = useCart();

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    paymentMethod: PaymentMethod.PIX,
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: ''
  });

  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && !formData.customerName) {
        setFormData(prev => ({ ...prev, customerName: user.displayName || '' }));
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

  const hasMarmitaInCart = useMemo(() => {
    return items.some(item => {
      const originalProduct = products.find(p => p.name === item.name);
      return originalProduct?.category === 'Marmitas';
    });
  }, [items, products]);

  const deliveryFee = useMemo(() => {
    if (!config || isOutsideRadius) return 0; 
    if (config.isDeliveryFree) return 0;
    if (subtotal >= config.freeDeliveryOver) return 0;
    return config.deliveryFee || 0;
  }, [config, subtotal, isOutsideRadius]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return (subtotal * appliedCoupon.discountPercentage) / 100;
  }, [appliedCoupon, subtotal]);

  const finalTotal = useMemo(() => {
    const total = subtotal + deliveryFee - discountAmount;
    return total > 0 ? total : 0;
  }, [subtotal, deliveryFee, discountAmount]);

  useEffect(() => {
    loadInitialData();
  }, []);

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
          
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanCep + ", Brasil")}&limit=1`);
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

  const toggleOption = (groupId: string, itemName: string, group: OptionGroup) => {
    setCurrentSelections(prev => {
      const currentGroup = prev[groupId] || [];
      const isSelected = currentGroup.includes(itemName);

      if (isSelected) {
        return { ...prev, [groupId]: currentGroup.filter(i => i !== itemName) };
      }

      const hasExtraPrice = group.extraPricePerItem && group.extraPricePerItem > 0;
      
      if (hasExtraPrice || currentGroup.length < (group.max || 99)) {
        if (group.max === 1 && !hasExtraPrice) {
            return { ...prev, [groupId]: [itemName] };
        }
        return { ...prev, [groupId]: [...currentGroup, itemName] };
      }

      return prev;
    });
  };

  const calculateCurrentPrice = () => {
    if (!customizingProduct) return 0;
    let extraTotal = 0;
    customizingProduct.optionsGroups?.forEach(g => {
      const selections = currentSelections[g.id] || [];
      if (g.extraPricePerItem && selections.length > g.max) {
        extraTotal += (selections.length - g.max) * g.extraPricePerItem;
      }
    });
    return customizingProduct.price + extraTotal;
  };

  const isSelectionValid = () => {
    if (!customizingProduct) return false;
    if (!customizingProduct.optionsGroups?.length) return true;
    return customizingProduct.optionsGroups.every(g => {
      const count = (currentSelections[g.id] || []).length;
      return count >= g.min;
    });
  };

  const confirmCustomization = () => {
    if (!customizingProduct || !isSelectionValid()) return;
    const selectedOptions: SelectedOption[] = customizingProduct.optionsGroups?.map(g => ({
      groupName: g.name,
      items: currentSelections[g.id] || []
    })) || [];
    
    const itemData = {
      productId: editingCartItemId || `${customizingProduct.id}-${Date.now()}`,
      name: customizingProduct.name,
      price: calculateCurrentPrice(),
      quantity: 1, 
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
  };

  const handleEditCartItem = (item: OrderItem) => {
    const product = products.find(p => p.name === item.name);
    if (!product) return;

    setCustomizingProduct(product);
    setEditingCartItemId(item.productId);
    
    const newSelections: Record<string, string[]> = {};
    product.optionsGroups?.forEach(group => {
      const savedOpt = item.selectedOptions?.find(so => so.groupName === group.name);
      if (savedOpt) {
        newSelections[group.id] = savedOpt.items;
      }
    });

    setCurrentSelections(newSelections);
    setObservation(item.observation || '');
    setIsCartOpen(false);
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
    setIsCartOpen(true);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || isOutsideRadius) return;
    
    try {
      const fullAddress = `${formData.street}, ${formData.number}${formData.complement ? ' (' + formData.complement + ')' : ''} - ${formData.neighborhood}, ${formData.city} (CEP: ${formData.cep})`;
      
      const orderData = {
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
      {/* Header */}
      <header className="sticky top-0 z-[60] glass-header border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-105 transition-transform">
              <UtensilsCrossed size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tight">Marmita<span className="text-orange-500">Express</span></h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Cozinha Ativa</p>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {/* User Profile / Login */}
            <div className="relative">
               {currentUser && currentUser.providerData.some(p => p.providerId === 'google.com') ? (
                 <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-full shadow-sm hover:shadow-md transition-all">
                    <img src={currentUser.photoURL || ''} alt={currentUser.displayName || ''} className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-500/20" />
                    <ChevronDown size={14} className={`mr-2 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                 </button>
               ) : (
                 <button onClick={handleGoogleLogin} className="hidden md:flex items-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                   <LogIn size={18} className="text-orange-500" /> Entrar
                 </button>
               )}
               
               {isUserMenuOpen && currentUser && (
                 <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 animate-scale-in">
                    <div className="p-4 border-b border-slate-50 mb-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Olá,</p>
                       <p className="text-sm font-black text-slate-800 truncate">{currentUser.displayName}</p>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 rounded-2xl text-red-500 hover:bg-red-50 font-black text-xs uppercase tracking-widest transition-all">
                       <LogOut size={18} /> Sair da Conta
                    </button>
                 </div>
               )}
            </div>

            <button onClick={() => setIsCartOpen(true)} className="relative p-4 bg-white border border-slate-200 rounded-[1.25rem] shadow-sm hover:shadow-xl transition-all">
              <ShoppingCart size={24} className="text-slate-800" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-600 text-white text-[10px] font-black min-w-[24px] h-[24px] flex items-center justify-center rounded-full ring-4 ring-white animate-bounce">
                  {items.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

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

        {/* Busca e Título */}
        <section className="relative mb-20 text-center space-y-8 py-10">
            <div className="space-y-4">
                <span className="inline-block px-6 py-2 bg-orange-100 text-orange-600 rounded-full text-xs font-black uppercase tracking-widest animate-pulse">
                🛵 Entrega Expressa até {config?.deliveryRadiusKm || 10}km
                </span>
                <h2 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter">
                Refeição de <br /> 
                <span className="bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 bg-clip-text text-transparent inline-block">verdade.</span>
                </h2>
                {!hasMarmitaInCart && (
                  <p className="text-slate-400 font-bold text-lg max-w-lg mx-auto">Escolha sua marmita principal para liberar bebidas e acompanhamentos extras!</p>
                )}
            </div>
            <div className="max-w-3xl mx-auto relative group">
                <div className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors pointer-events-none">
                  <Search size={26} />
                </div>
                <input type="text" placeholder="O que vamos comer hoje?" className="w-full pl-20 pr-10 py-7 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-sm focus:outline-none focus:border-orange-400 focus:shadow-2xl transition-all text-xl font-bold placeholder:text-slate-300" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
        </section>

        {/* Categorias */}
        {products.length > 0 && hasMarmitaInCart && (
          <div className="flex gap-4 overflow-x-auto pb-8 no-scrollbar mb-12 -mx-6 px-6 scroll-smooth">
            {Array.from(new Set(['Todos', ...products.map(p => p.category)])).map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-10 py-5 rounded-[1.5rem] font-black whitespace-nowrap transition-all border-2 text-sm flex items-center gap-3 ${selectedCategory === cat ? 'bg-slate-900 border-slate-900 text-white shadow-2xl -translate-y-1' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Grid de Produtos */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[1, 2, 3].map(i => <div key={i} className="h-96 bg-white rounded-[3rem] animate-pulse border border-slate-100" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-[3.5rem] overflow-hidden border border-slate-100 hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 flex flex-col group">
                <div className="h-72 overflow-hidden relative">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute bottom-6 left-6 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xl">
                    R$ {product.price.toFixed(2)}
                  </div>
                </div>
                <div className="p-10 flex-1 flex flex-col">
                  <div className="flex-1 mb-8">
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest px-3 py-1 bg-orange-50 rounded-lg">{product.category}</span>
                    <h3 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-orange-600 transition-colors mt-2">{product.name}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium line-clamp-2">{product.description}</p>
                  </div>
                  <button onClick={() => product.optionsGroups?.length ? handleOpenCustomization(product) : handleAddAction(product)} className="w-full py-6 bg-slate-900 text-white hover:bg-black rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-3">
                    {product.optionsGroups?.length ? 'Personalizar' : 'Adicionar Sacola'}
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer com link Admin */}
      <footer className="mt-20 py-16 bg-slate-900 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500"></div>
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-8">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
                <UtensilsCrossed size={20} />
              </div>
              <p className="text-white font-black text-xl tracking-tight">Marmita Express</p>
           </div>
           <p className="text-slate-500 font-bold text-sm max-w-md">O sabor caseiro entregue com tecnologia e carinho na porta da sua casa.</p>
           
           <div className="h-px w-20 bg-slate-800"></div>
           
           <Link 
            to="/admin/login" 
            className="group flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl transition-all border border-white/5 hover:border-white/10"
           >
             <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Painel Administrativo</span>
           </Link>
           
           <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mt-4">© 2024 Marmita Express • Todos os direitos reservados</p>
        </div>
      </footer>

      {/* Drawer de Customização */}
      {customizingProduct && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => { setCustomizingProduct(null); setEditingCartItemId(null); }}></div>
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-slide-in overflow-hidden">
            <div className="p-10 border-b border-slate-100 shrink-0">
               <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-black text-slate-900">{editingCartItemId ? 'Alterar Escolhas' : 'Personalize'}</h2>
                  <button onClick={() => { setCustomizingProduct(null); setEditingCartItemId(null); }} className="p-4 bg-slate-50 rounded-[1.5rem]"><X size={24} /></button>
               </div>
               <div className="flex gap-6 items-center">
                  <img src={customizingProduct.imageUrl} className="w-24 h-24 rounded-3xl object-cover shadow-xl" alt={customizingProduct.name} />
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">{customizingProduct.name}</h3>
                    <p className="text-orange-500 font-black">R$ {customizingProduct.price.toFixed(2)}</p>
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
              {customizingProduct.optionsGroups?.map(group => (
                <div key={group.id} className="space-y-6">
                  <div className="flex justify-between items-end border-b-2 border-slate-50 pb-4">
                    <div>
                      <h4 className="text-xl font-black text-slate-800">{group.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        {group.min > 0 ? `Obrigatório • ` : ''} 
                        Até {group.max} itens grátis
                        {group.extraPricePerItem ? ` • +R$ ${group.extraPricePerItem.toFixed(2)} por adicional` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {group.items.map(item => (
                      <label key={item.name} className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all cursor-pointer ${currentSelections[group.id]?.includes(item.name) ? 'border-orange-500 bg-orange-50' : 'border-slate-50 hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${currentSelections[group.id]?.includes(item.name) ? 'bg-orange-500 border-orange-500' : 'border-slate-300'}`}>
                            {currentSelections[group.id]?.includes(item.name) && <CheckCircle size={14} className="text-white" />}
                          </div>
                          <span className="font-black text-lg text-slate-700">{item.name}</span>
                        </div>
                        {group.extraPricePerItem && (currentSelections[group.id] || []).length >= group.max && !currentSelections[group.id]?.includes(item.name) && (
                          <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-3 py-1 rounded-lg">+ R$ {group.extraPricePerItem.toFixed(2)}</span>
                        )}
                        <input type="checkbox" className="hidden" checked={currentSelections[group.id]?.includes(item.name)} onChange={() => toggleOption(group.id, item.name, group)} />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="space-y-4">
                 <h4 className="text-xl font-black text-slate-800">Observações</h4>
                 <textarea placeholder="Ex: Sem cebola..." className="w-full p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] focus:border-orange-400 outline-none font-bold min-h-[120px]" value={observation} onChange={e => setObservation(e.target.value)} />
              </div>
            </div>

            <div className="p-10 border-t border-slate-100 bg-slate-50/50 space-y-6 shrink-0">
               <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-black uppercase text-xs">Total do Item</span>
                  <span className="text-4xl font-black text-slate-900">R$ {calculateCurrentPrice().toFixed(2)}</span>
               </div>
               <button onClick={confirmCustomization} disabled={!isSelectionValid()} className="w-full py-7 bg-orange-500 text-white font-black text-xl rounded-[2.5rem] shadow-xl disabled:opacity-50">
                 {editingCartItemId ? 'Salvar Alterações' : 'Confirmar Escolha'}
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
            <div className="p-10 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Sua Sacola</h2>
                <p className="text-slate-400 font-bold text-sm">{items.length} itens selecionados</p>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-4 bg-slate-50 rounded-[1.5rem]"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-6 no-scrollbar">
              {items.map(item => (
                <div key={item.productId} className="p-6 bg-white rounded-[2rem] border-2 border-slate-100 space-y-4 relative group">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={() => handleEditCartItem(item)} className="text-slate-300 hover:text-orange-500 p-2"><Edit3 size={18} /></button>
                    <button onClick={() => removeFromCart(item.productId)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                  </div>
                  <h4 className="font-black text-xl text-slate-900 pr-16">{item.name}</h4>
                  
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <div className="space-y-1">
                      {item.selectedOptions.map(opt => (
                        <p key={opt.groupName} className="text-[10px] text-slate-400 font-bold leading-tight">
                          <span className="text-orange-500 uppercase">{opt.groupName}:</span> {opt.items.join(', ')}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm font-black text-orange-500">
                    <span>{item.quantity}x</span>
                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}

              <div className="mt-8 pt-8 border-t border-slate-100">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Tem um Cupom?</p>
                 <div className="flex gap-2">
                    <input 
                      className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black uppercase outline-none focus:border-orange-500 transition-all text-sm" 
                      placeholder="CÓDIGO" 
                      value={couponInput} 
                      onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    />
                    <button onClick={handleApplyCoupon} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all">
                      <Plus size={24} />
                    </button>
                 </div>
                 {appliedCoupon && (
                   <div className="mt-3 flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-2xl animate-fade-in">
                      <div className="flex items-center gap-2">
                         <Tag size={16} className="text-orange-500" />
                         <span className="text-xs font-black text-orange-800 uppercase tracking-widest">{appliedCoupon.code}</span>
                      </div>
                      <button onClick={() => setAppliedCoupon(null)} className="text-orange-500"><X size={16} /></button>
                   </div>
                 )}
              </div>
            </div>
            <div className="p-10 border-t border-slate-100 bg-slate-50/50 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-xs font-bold text-orange-500">
                    <span>Desconto ({appliedCoupon.discountPercentage}%)</span>
                    <span>- R$ {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-black">
                  <span className="text-slate-400 uppercase text-xs">Total</span>
                  <span className="text-4xl text-slate-900">R$ {finalTotal.toFixed(2)}</span>
                </div>
              </div>
              <button disabled={!hasMarmitaInCart} onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} className="w-full py-7 bg-slate-900 text-white font-black text-xl rounded-[2.5rem] disabled:opacity-50">
                Finalizar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={() => setIsCheckoutOpen(false)}></div>
          <div className="relative bg-white rounded-[4rem] shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col md:flex-row">
             <div className="hidden md:flex w-72 bg-slate-900 p-12 flex-col justify-between text-white shrink-0">
                <h3 className="text-3xl font-black leading-tight">Quase pronto para a entrega!</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Marmita Express v2.5</p>
             </div>
             <div className="flex-1 overflow-y-auto p-10 md:p-16 no-scrollbar">
                <div className="flex justify-between items-start mb-12">
                   <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Dados de Entrega</h2>
                   {!currentUser && (
                     <button onClick={handleGoogleLogin} className="flex items-center gap-2 text-xs font-black text-orange-500 uppercase bg-orange-50 px-4 py-2 rounded-xl border border-orange-100">
                        <User size={14} /> Logar com Google
                     </button>
                   )}
                </div>
                
                <form onSubmit={handleCheckout} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input required className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold outline-none focus:border-orange-400" placeholder="Nome" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                    <input required className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold outline-none focus:border-orange-400" placeholder="WhatsApp" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    
                    <div className="md:col-span-2 space-y-2">
                      <div className="flex gap-4">
                        <input required className="flex-1 px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold outline-none focus:border-orange-400" placeholder="CEP" value={formData.cep} onChange={e => handleCepChange(e.target.value)} />
                        {isSearchingCep && <Loader2 className="animate-spin text-orange-500 mt-5" />}
                      </div>
                      {deliveryDistance !== null && (
                         <div className={`p-4 rounded-xl flex items-center gap-3 border ${isOutsideRadius ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-600'}`}>
                            {isOutsideRadius ? <AlertTriangle size={20} /> : <MapPin size={20} />}
                            <span className="text-xs font-black uppercase tracking-widest">{isOutsideRadius ? 'Fora do raio' : 'Entregamos em seu endereço'} ({deliveryDistance.toFixed(1)}km)</span>
                         </div>
                      )}
                    </div>

                    <input required className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold outline-none md:col-span-2 focus:border-orange-400" placeholder="Rua" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4 md:col-span-2">
                        <input id="address-number" required className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold outline-none focus:border-orange-400" placeholder="Nº" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
                        <input className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold outline-none focus:border-orange-400" placeholder="Compl." value={formData.complement} onChange={e => setFormData({...formData, complement: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pagamento</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.values(PaymentMethod).map(m => (
                        <label key={m} className={`p-6 border-2 rounded-[1.5rem] cursor-pointer text-center font-black text-xs transition-all ${formData.paymentMethod === m ? 'border-orange-500 bg-orange-50' : 'border-slate-50'}`}>
                          <input type="radio" className="hidden" checked={formData.paymentMethod === m} onChange={() => setFormData({...formData, paymentMethod: m})} />
                          {m}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 border-t-2 border-dashed border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
                     <h4 className="text-4xl font-black text-slate-900 tracking-tighter">R$ {finalTotal.toFixed(2)}</h4>
                     <button type="submit" disabled={isOutsideRadius || items.length === 0} className="w-full md:w-auto px-16 py-6 bg-orange-500 text-white font-black rounded-3xl shadow-xl transition-all disabled:opacity-50">
                        Confirmar Pedido
                     </button>
                  </div>
                </form>
             </div>
          </div>
        </div>
      )}

      {/* Rastreio */}
      {(orderSuccess || trackingOrderId) && activeOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-2xl animate-fade-in">
           <div className="bg-white rounded-[4rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-in">
              <div className="p-12 border-b border-slate-100 flex justify-between items-center">
                 <h2 className="text-3xl font-black text-slate-900">Seu Pedido</h2>
                 <button onClick={() => setOrderSuccess(null)} className="p-5 text-slate-400"><X size={28} /></button>
              </div>
              <div className="p-12 space-y-12 text-center">
                 <div className="bg-slate-900 p-10 rounded-[3rem] space-y-4">
                    <h3 className="text-5xl font-black text-white tracking-tighter capitalize">{activeOrder.status}</h3>
                    <p className="text-slate-400 font-medium">Estamos trabalhando no seu pedido!</p>
                 </div>
                 {activeOrder.paymentMethod === PaymentMethod.PIX && (
                    <div className="bg-orange-50 p-8 rounded-[2rem] border-2 border-orange-100 space-y-4">
                       <h4 className="font-black text-orange-800">Pagamento Pix</h4>
                       <p className="text-sm font-bold text-orange-600">CNPJ: 12.345.678/0001-99</p>
                       <p className="text-xs text-orange-500 italic">Envie o comprovante pelo Whats!</p>
                    </div>
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
      `}</style>
    </div>
  );
};

export default Store;
