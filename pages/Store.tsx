
import React, { useState, useEffect, useMemo } from 'react';
import { getActiveProducts, createOrder, addProduct, subscribeToOrder, updateProduct, deleteProduct, getRestaurantConfig, getCoupons } from '../services/database';
import { Product, PaymentMethod, OptionGroup, SelectedOption, Order, OrderStatus, RestaurantConfig, Coupon } from '../types';
import { useCart } from '../App';
import { 
  ShoppingCart, X, Search, UtensilsCrossed, CheckCircle, AlertCircle, Sparkles, Plus, Minus, Info, Lock, MapPin, Navigation, Home, Building2, Loader2, Clock, Truck, PackageCheck, ChevronRight, Heart, Star, Timer, Flame,
  LayoutDashboard, ShoppingBag, Trash2, ShieldCheck, ChevronDown, Tag, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Store: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<RestaurantConfig | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponInput, setCouponInput] = useState('');
  
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
  const [currentSelections, setCurrentSelections] = useState<Record<string, string[]>>({});
  const [observation, setObservation] = useState('');

  const { items, addToCart, removeFromCart, clearCart, total: subtotal } = useCart();

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

  const hasMarmitaInCart = useMemo(() => {
    return items.some(item => {
      const originalProduct = products.find(p => p.name === item.name);
      return originalProduct?.category === 'Marmitas';
    });
  }, [items, products]);

  const deliveryFee = useMemo(() => {
    if (!config) return 0;
    if (isOutsideRadius) return 0; 
    if (config.isDeliveryFree) return 0;
    if (subtotal >= config.freeDeliveryOver) return 0;
    return config.deliveryFee;
  }, [config, subtotal, isOutsideRadius]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return (subtotal * appliedCoupon.discountPercentage) / 100;
  }, [appliedCoupon, subtotal]);

  const finalTotal = useMemo(() => {
    return subtotal + deliveryFee - discountAmount;
  }, [subtotal, deliveryFee, discountAmount]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!hasMarmitaInCart && items.length > 0 && selectedCategory !== 'Marmitas' && selectedCategory !== 'Todos') {
      setSelectedCategory('Marmitas');
    }
  }, [hasMarmitaInCart, items, selectedCategory]);

  useEffect(() => {
    if (trackingOrderId) {
      const unsubscribe = subscribeToOrder(trackingOrderId, (order) => {
        if (order) {
          setActiveOrder(order);
        } else {
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleApplyCoupon = () => {
    const coupon = coupons.find(c => c.code === couponInput.toUpperCase() && c.active);
    if (coupon) {
      setAppliedCoupon(coupon);
      alert('Cupom aplicado com sucesso!');
    } else {
      alert('Cupom inválido ou expirado.');
    }
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

          if (geoData && geoData.length > 0 && config?.latitude && config?.longitude) {
            const clientLat = parseFloat(geoData[0].lat);
            const clientLon = parseFloat(geoData[0].lon);
            const distance = calculateDistance(config.latitude, config.longitude, clientLat, clientLon);
            
            setDeliveryDistance(distance);
            if (distance > (config.deliveryRadiusKm || 10)) {
              setIsOutsideRadius(true);
            }
          }

          const numInput = document.getElementById('address-number');
          if (numInput) numInput.focus();
        } else {
          alert('CEP não encontrado.');
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  const handleAddAction = (product: Product) => {
    if (!product.optionsGroups || product.optionsGroups.length === 0) {
      addToCart({
        productId: product.id! + '-' + Date.now(),
        name: product.name,
        price: product.price,
        quantity: 1,
        selectedOptions: [],
        observation: '',
        restaurantId: product.restaurantId
      });
      setIsCartOpen(true);
    } else {
      handleOpenCustomization(product);
    }
  };

  const handleOpenCustomization = (product: Product) => {
    setCustomizingProduct(product);
    setCurrentSelections({});
    setObservation('');
    if (product.optionsGroups) {
      const initial: Record<string, string[]> = {};
      product.optionsGroups.forEach(g => {
        initial[g.id] = [];
      });
      setCurrentSelections(initial);
    }
  };

  const toggleOption = (groupId: string, itemName: string, max: number) => {
    setCurrentSelections(prev => {
      const currentGroup = prev[groupId] || [];
      if (currentGroup.includes(itemName)) {
        return { ...prev, [groupId]: currentGroup.filter(i => i !== itemName) };
      }
      if (currentGroup.length < (max || 99)) {
        return { ...prev, [groupId]: [...currentGroup, itemName] };
      }
      if (max === 1) {
        return { ...prev, [groupId]: [itemName] };
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
    if (!customizingProduct.optionsGroups || customizingProduct.optionsGroups.length === 0) return true;
    return customizingProduct.optionsGroups.every(g => {
      const count = (currentSelections[g.id] || []).length;
      return count >= g.min && count <= (g.max || 99);
    });
  };

  const confirmCustomization = () => {
    if (!customizingProduct || !isSelectionValid()) return;
    const selectedOptions: SelectedOption[] = customizingProduct.optionsGroups?.map(g => ({
      groupName: g.name,
      items: currentSelections[g.id] || []
    })) || [];
    addToCart({
      productId: customizingProduct.id! + '-' + Date.now(),
      name: customizingProduct.name,
      price: calculateCurrentPrice(),
      quantity: 1,
      selectedOptions,
      observation,
      restaurantId: customizingProduct.restaurantId
    });
    setCustomizingProduct(null);
    setIsCartOpen(true);
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category || 'Outros')));
    return ['Todos', ...cats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.description.toLowerCase().includes(searchTerm.toLowerCase());
      if (items.length === 0 || !hasMarmitaInCart) {
        return matchesSearch && p.category === 'Marmitas';
      }
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory, items, hasMarmitaInCart]);

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
          price: i.price,
          selectedOptions: i.selectedOptions,
          observation: i.observation
        })),
        subtotal,
        deliveryFee,
        discount: discountAmount,
        couponCode: appliedCoupon?.code,
        distanceKm: deliveryDistance || undefined,
        total: finalTotal
      };
      const docRef = await createOrder(orderData);
      setOrderSuccess(docRef.id);
      setTrackingOrderId(docRef.id);
      localStorage.setItem('trackingOrderId', docRef.id);
      clearCart();
      setIsCheckoutOpen(false);
    } catch (err) {
      alert('Erro ao criar pedido.');
    }
  };

  const stopTracking = () => {
    setTrackingOrderId(null);
    setActiveOrder(null);
    localStorage.removeItem('trackingOrderId');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-orange-500 selection:text-white">
      <header className="sticky top-0 z-[60] glass-header border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tight">Marmita<span className="text-orange-500">Express</span></h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Aberto agora</p>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {trackingOrderId && activeOrder && (
              <button onClick={() => setOrderSuccess(trackingOrderId)} className="hidden md:flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-900/10">
                <Timer size={18} className="text-orange-500 animate-spin" /> {activeOrder.status}
              </button>
            )}
            <button onClick={() => setIsCartOpen(true)} className="relative p-4 bg-white border border-slate-200 rounded-[1.25rem] shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <ShoppingCart size={24} className="text-slate-800" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-600 text-white text-[10px] font-black min-w-[24px] h-[24px] flex items-center justify-center rounded-full ring-4 ring-white shadow-lg animate-bounce px-1">
                  {items.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

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
                      <h3 className="text-3xl font-black mb-1">Status: {activeOrder.status}!</h3>
                      <p className="text-slate-400 font-bold">Relaxe, estamos preparando o melhor sabor para você.</p>
                   </div>
                </div>
                <button onClick={() => setOrderSuccess(trackingOrderId)} className="px-10 py-5 bg-white text-slate-900 font-black rounded-2xl hover:bg-orange-50 transition-all flex items-center gap-3">
                  Ver Progresso <ChevronRight size={20} />
                </button>
             </div>
          </div>
        )}

        {(items.length === 0 || !hasMarmitaInCart) ? (
            <section className="relative mb-20 text-center space-y-8 py-10">
                <div className="space-y-4">
                    <span className="inline-block px-6 py-2 bg-orange-100 text-orange-600 rounded-full text-xs font-black uppercase tracking-widest animate-pulse">
                    🚀 Entrega em até {config?.deliveryRadiusKm || 10}km
                    </span>
                    <h2 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter">
                    A fome de <br /> 
                    <span className="bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 bg-clip-text text-transparent inline-block">sucesso começa aqui.</span>
                    </h2>
                    <p className="text-slate-400 font-bold text-lg max-w-lg mx-auto">Selecione primeiro uma deliciosa marmita para liberar o cardápio completo de bebidas e doces!</p>
                </div>
                <div className="max-w-3xl mx-auto relative group">
                    <div className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors pointer-events-none">
                    <Search size={26} />
                    </div>
                    <input type="text" placeholder="Pesquisar por pratos, ingredientes ou categorias..." className="w-full pl-20 pr-10 py-7 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-sm focus:outline-none focus:border-orange-400 focus:shadow-2xl focus:shadow-orange-200/50 transition-all text-xl font-bold placeholder:text-slate-300" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </section>
        ) : (
            <div className="mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
                 <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
                    Continue montando <br/><span className="text-orange-500">seu pedido...</span>
                 </h2>
                 <div className="w-full md:max-w-md relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Search size={20} />
                    </div>
                    <input type="text" placeholder="Buscar algo mais..." className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-orange-400 transition-all font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                 </div>
            </div>
        )}

        {!loading && products.length > 0 && hasMarmitaInCart && (
          <div className="flex gap-4 overflow-x-auto pb-8 no-scrollbar mb-12 -mx-6 px-6 scroll-smooth">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-10 py-5 rounded-[1.5rem] font-black whitespace-nowrap transition-all border-2 text-sm flex items-center gap-3 ${selectedCategory === cat ? 'bg-slate-900 border-slate-900 text-white shadow-2xl -translate-y-1' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:-translate-y-0.5'}`}>
                {cat === 'Todos' && <LayoutDashboard size={18} />}
                {cat === 'Marmitas' && <UtensilsCrossed size={18} />}
                {cat === 'Bebidas' && <Star size={18} />}
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-[500px] bg-white rounded-[3rem] animate-pulse border border-slate-100" />)}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[4rem] border-4 border-dashed border-slate-100 space-y-6">
             <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
               <ShoppingBag size={64} />
             </div>
             <div>
               <h3 className="text-3xl font-black text-slate-400">Cardápio em construção...</h3>
               <p className="text-slate-300 font-bold mt-2">Nenhum item disponível no momento.</p>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-[3.5rem] overflow-hidden border border-slate-100 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] hover:-translate-y-3 transition-all duration-500 flex flex-col group">
                <div className="h-72 overflow-hidden relative">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute top-6 right-6 flex flex-col gap-2">
                    <button className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl text-slate-400 hover:text-red-500 transition-colors">
                      <Heart size={20} />
                    </button>
                  </div>
                  <div className="absolute bottom-6 left-6 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xl shadow-2xl">
                    R$ {product.price.toFixed(2)}
                  </div>
                </div>
                <div className="p-10 flex-1 flex flex-col">
                  <div className="flex-1 mb-8">
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest px-3 py-1 bg-orange-50 rounded-lg">{product.category}</span>
                    <h3 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-orange-600 transition-colors mt-2">{product.name}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium line-clamp-3">{product.description}</p>
                  </div>
                  <button 
                    onClick={() => handleAddAction(product)} 
                    className="w-full py-6 bg-slate-900 text-white hover:bg-black rounded-[2rem] font-black text-lg transition-all shadow-2xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-3"
                  >
                    {product.optionsGroups && product.optionsGroups.length > 0 ? 'Customizar Marmita' : 'Adicionar à Sacola'}
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-16 mt-32">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div className="space-y-6">
             <div className="flex items-center justify-center md:justify-start gap-4">
                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white">
                  <UtensilsCrossed size={24} />
                </div>
                <h4 className="text-2xl font-black text-slate-900">Marmita Express</h4>
             </div>
             <p className="text-slate-500 font-medium">Levando sabor e praticidade para o seu dia a dia com os melhores ingredientes da região.</p>
          </div>
          <div className="flex flex-col gap-4 items-center">
             <h5 className="font-black uppercase tracking-widest text-xs text-slate-400">Links Úteis</h5>
             <Link to="/admin/login" className="text-slate-900 font-black hover:text-orange-500 transition-colors flex items-center gap-2">
               <Lock size={16} /> Painel Administrativo (Login)
             </Link>
             <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-slate-900 font-black hover:text-orange-500 transition-colors">Voltar ao topo</button>
          </div>
          <div className="flex flex-col items-center md:items-end gap-6">
             <div className="text-right">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Dúvidas?</p>
                <p className="text-xl font-black text-slate-900">(11) 99999-9999</p>
             </div>
             <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">© {new Date().getFullYear()} Marmita Express. Design Premium.</p>
          </div>
        </div>
      </footer>

      {/* Customization Drawer */}
      {customizingProduct && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setCustomizingProduct(null)}></div>
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-slide-in overflow-hidden">
            <div className="p-10 border-b border-slate-100 shrink-0">
               <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-black text-slate-900">O seu jeito</h2>
                  <button onClick={() => setCustomizingProduct(null)} className="p-4 bg-slate-50 rounded-[1.5rem] hover:bg-slate-100 transition-all"><X size={24} /></button>
               </div>
               <div className="flex gap-6 items-center">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-xl">
                    <img src={customizingProduct.imageUrl} className="w-full h-full object-cover" alt={customizingProduct.name} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">{customizingProduct.name}</h3>
                    <p className="text-orange-500 font-black text-lg">R$ {customizingProduct.price.toFixed(2)}</p>
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12">
              {customizingProduct.optionsGroups?.map(group => (
                <div key={group.id} className="space-y-6">
                  <div className="flex justify-between items-end border-b-2 border-slate-50 pb-4">
                    <div>
                      <h4 className="text-xl font-black text-slate-800">{group.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        {group.min > 0 ? `Obrigatório • ` : ''} Selecione {group.min === group.max ? group.min : `${group.min} a ${group.max}`}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {group.items.map(item => (
                      <label 
                        key={item.name} 
                        className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all cursor-pointer select-none ${
                          currentSelections[group.id]?.includes(item.name) 
                          ? 'border-orange-500 bg-orange-50 ring-4 ring-orange-500/10' 
                          : 'border-slate-50 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            currentSelections[group.id]?.includes(item.name) ? 'bg-orange-500 border-orange-500' : 'border-slate-300'
                          }`}>
                            {currentSelections[group.id]?.includes(item.name) && <CheckCircle size={14} className="text-white" />}
                          </div>
                          <span className={`font-black text-lg ${currentSelections[group.id]?.includes(item.name) ? 'text-orange-900' : 'text-slate-600'}`}>{item.name}</span>
                        </div>
                        <input 
                          type={group.max === 1 ? 'radio' : 'checkbox'} 
                          className="hidden"
                          checked={currentSelections[group.id]?.includes(item.name) || false}
                          onChange={() => toggleOption(group.id, item.name, group.max)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="space-y-4">
                 <h4 className="text-xl font-black text-slate-800">Observações Especiais</h4>
                 <textarea 
                  placeholder="Ex: Tirar cebola, colocar mais molho, etc..."
                  className="w-full p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] focus:border-orange-400 focus:outline-none font-bold transition-all min-h-[150px] text-slate-700"
                  value={observation}
                  onChange={e => setObservation(e.target.value)}
                 />
              </div>
            </div>

            <div className="p-10 border-t border-slate-100 bg-slate-50/50 space-y-6 shrink-0">
               <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-black uppercase text-xs tracking-widest">Subtotal do item</span>
                  <span className="text-4xl font-black text-slate-900">R$ {calculateCurrentPrice().toFixed(2)}</span>
               </div>
               <button 
                onClick={confirmCustomization}
                disabled={!isSelectionValid()}
                className="w-full py-7 bg-orange-500 hover:bg-orange-600 text-white font-black text-xl rounded-[2.5rem] shadow-2xl shadow-orange-500/30 transition-all disabled:opacity-50 disabled:grayscale active:scale-95"
               >
                 {!isSelectionValid() ? 'Escolha os itens obrigatórios' : 'Confirmar e Adicionar'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-md:max-w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Sua Sacola</h2>
                <p className="text-slate-400 font-bold text-sm">Pronto para saborear?</p>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-4 bg-slate-50 rounded-[1.5rem]"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-6 no-scrollbar">
              {items.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingBag size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-bold">Sua sacola está vazia.</p>
                </div>
              ) : items.map(item => (
                <div key={item.productId} className="group p-6 bg-white rounded-[2rem] border-2 border-slate-100 hover:border-orange-200 transition-all space-y-4 relative">
                  <button onClick={() => removeFromCart(item.productId)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={20} /></button>
                  <div>
                    <h4 className="font-black text-xl text-slate-900 pr-8">{item.name}</h4>
                    <p className="text-orange-500 font-black">R$ {item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                    <span className="font-black text-slate-900">{item.quantity}x</span>
                    <span className="font-black text-slate-900">R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              
              {items.length > 0 && (
                <div className="space-y-4 pt-6">
                   <div className="flex gap-2">
                     <input placeholder="CUPOM" className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase outline-none text-sm" value={couponInput} onChange={e => setCouponInput(e.target.value)} />
                     <button onClick={handleApplyCoupon} className="px-5 bg-orange-500 text-white rounded-xl font-black text-xs hover:bg-orange-600 transition-all">Aplicar</button>
                   </div>
                   {appliedCoupon && (
                     <div className="flex justify-between items-center text-green-600 font-bold text-sm bg-green-50 p-4 rounded-xl">
                        <span className="flex items-center gap-2"><Tag size={16} /> Cupom {appliedCoupon.code}</span>
                        <button onClick={() => setAppliedCoupon(null)}><X size={16} /></button>
                     </div>
                   )}
                </div>
              )}
            </div>

            <div className="p-10 border-t border-slate-100 bg-slate-50/50 space-y-4 shrink-0">
              <div className="space-y-2 text-sm font-bold text-slate-500">
                <div className="flex justify-between"><span>Subtotal</span><span className="text-slate-900 font-black">R$ {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Entrega</span><span className="text-slate-900 font-black">{deliveryFee === 0 ? (isOutsideRadius ? '---' : 'GRÁTIS') : `R$ ${deliveryFee.toFixed(2)}`}</span></div>
                {discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Desconto</span><span>- R$ {discountAmount.toFixed(2)}</span></div>}
              </div>
              <div className="flex justify-between items-center font-black pt-2">
                <span className="text-slate-400 uppercase text-xs tracking-widest">Total Geral</span>
                <span className="text-4xl text-slate-900">R$ {finalTotal.toFixed(2)}</span>
              </div>
              <button disabled={items.length === 0 || !hasMarmitaInCart} onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} className="w-full py-7 bg-slate-900 text-white font-black text-xl rounded-[2.5rem] shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50">
                {!hasMarmitaInCart && items.length > 0 ? 'Adicione uma marmita' : 'Checkout Seguro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={() => setIsCheckoutOpen(false)}></div>
          <div className="relative bg-white rounded-[4rem] shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col md:flex-row">
             <div className="hidden md:flex w-72 bg-slate-900 p-12 flex-col justify-between text-white shrink-0">
                <div className="space-y-12">
                   <div className="w-16 h-16 bg-orange-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/40 animate-float"><PackageCheck size={32} /></div>
                   <h3 className="text-3xl font-black leading-tight">Quase lá!</h3>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Marmita Express v2.3</p>
             </div>
             <div className="flex-1 overflow-y-auto p-10 md:p-16">
                <h2 className="text-4xl font-black text-slate-900 mb-12 tracking-tighter">Finalizar Pedido</h2>
                <form onSubmit={handleCheckout} className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input required className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold outline-none focus:border-orange-400" placeholder="Nome Completo" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                    <input required className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold outline-none focus:border-orange-400" placeholder="WhatsApp" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    
                    <div className="md:col-span-2 space-y-2">
                      <div className="flex gap-4">
                        <input required className="flex-1 px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold outline-none focus:border-orange-400" placeholder="CEP (8 dígitos)" value={formData.cep} onChange={e => handleCepChange(e.target.value)} />
                        {isSearchingCep && <Loader2 className="animate-spin text-orange-500 mt-5" />}
                      </div>
                      {deliveryDistance !== null && (
                         <div className={`p-4 rounded-xl flex items-center gap-3 border ${isOutsideRadius ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-600'}`}>
                            {isOutsideRadius ? <AlertTriangle size={20} /> : <MapPin size={20} />}
                            <span className="text-xs font-black uppercase tracking-widest">Distância: {deliveryDistance.toFixed(1)} km - {isOutsideRadius ? 'FORA DO RAIO DE ENTREGA' : 'ENTREGAMOS AQUI!'}</span>
                         </div>
                      )}
                    </div>

                    <input required className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold outline-none md:col-span-2 focus:border-orange-400" placeholder="Logradouro / Rua" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
                    
                    <div className="grid grid-cols-2 gap-4 md:col-span-2">
                        <input id="address-number" required className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold outline-none focus:border-orange-400" placeholder="Número" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
                        <input className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold outline-none focus:border-orange-400" placeholder="Complemento" value={formData.complement} onChange={e => setFormData({...formData, complement: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase ml-4">Bairro</label>
                            <input required className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold outline-none focus:border-orange-400" placeholder="Bairro" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase ml-4">Cidade</label>
                            <input required className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-bold outline-none focus:border-orange-400" placeholder="Cidade" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                        </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Forma de Pagamento</p>
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
                     <div className="text-center md:text-left">
                        <span className="text-slate-400 font-black text-[10px] uppercase">Total com entrega</span>
                        <h4 className="text-4xl font-black text-slate-900 tracking-tighter">R$ {finalTotal.toFixed(2)}</h4>
                     </div>
                     <button 
                      type="submit" 
                      disabled={isOutsideRadius || items.length === 0}
                      className="w-full md:w-auto px-16 py-6 bg-orange-500 text-white font-black rounded-3xl shadow-xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                     >
                        {isOutsideRadius ? 'Não Entregamos Aqui' : 'Confirmar Pedido'}
                     </button>
                  </div>
                </form>
             </div>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {(orderSuccess || activeOrder) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-2xl animate-fade-in">
           <div className="bg-white rounded-[4rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-in">
              <div className="p-12 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div><h2 className="text-3xl font-black text-slate-900">Status do Pedido</h2></div>
                 <button onClick={() => { setOrderSuccess(null); setActiveOrder(null); localStorage.removeItem('trackingOrderId'); }} className="p-5 text-slate-400"><X size={28} /></button>
              </div>
              <div className="p-12 space-y-12 text-center">
                 <div className="bg-slate-900 p-10 rounded-[3rem] space-y-4 shadow-2xl">
                    <h3 className="text-5xl font-black text-white tracking-tighter capitalize">{activeOrder?.status || 'Recebido'}</h3>
                    <p className="text-slate-400 font-medium text-lg">Atualizado agora mesmo!</p>
                 </div>
                 {activeOrder?.paymentMethod === PaymentMethod.PIX && (
                    <div className="bg-orange-50 p-8 rounded-[2rem] border-2 border-orange-100 space-y-4">
                       <h4 className="font-black text-orange-800">Pagamento via Pix</h4>
                       <p className="text-sm font-bold text-orange-600">Chave: 12.345.678/0001-99 (CNPJ)</p>
                       <p className="text-xs text-orange-500 italic">Envie o comprovante pelo WhatsApp para agilizar!</p>
                    </div>
                 )}
              </div>
              <div className="p-12 bg-slate-50 border-t border-slate-100">
                 {activeOrder?.status === OrderStatus.FINISHED ? <button onClick={stopTracking} className="w-full py-7 bg-orange-500 text-white font-black text-xl rounded-[2.5rem]">Finalizar</button> : <p className="text-center text-slate-400 font-black text-xs animate-pulse tracking-widest uppercase">Atualizando em tempo real</p>}
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
      `}</style>
    </div>
  );
};

export default Store;
