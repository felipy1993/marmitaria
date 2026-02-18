
import React, { useState, useEffect } from 'react';
import { getRestaurantConfig, updateRestaurantConfig, getCoupons, addCoupon, deleteCoupon } from '../services/database';
import { RestaurantConfig, Coupon } from '../types';
import { LayoutDashboard, ShoppingBag, Settings, LogOut, Package, Save, Plus, Trash2, Tag, Truck, MapPin, Navigation, Search, Loader2, Coins, Target, ClipboardList, PieChart, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase-config';

const AdminSettings: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<RestaurantConfig>({
    deliveryRadiusKm: 10,
    deliveryFee: 5,
    isDeliveryFree: false,
    freeDeliveryOver: 50,
    addressBase: '',
    latitude: -23.55052,
    longitude: -46.633308,
    cep: '',
    whatsappNumber: '',
    openingTime: '10:00',
    closingTime: '23:00'
  });
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [newCoupon, setNewCoupon] = useState({ 
    code: '', 
    discountPercentage: 10,
    minOrderValue: 0,
    availableQuantity: 100
  });
  const [loading, setLoading] = useState(true);
  const [isFetchingGeo, setIsFetchingGeo] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [conf, coup] = await Promise.all([getRestaurantConfig(), getCoupons()]);
      if (conf) {
        setConfig(prev => ({ ...prev, ...conf }));
      }
      setCoupons(coup);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoordinates = async () => {
    if (!config.addressBase && !config.cep) {
      alert("Preencha o CEP ou Endereço da loja para buscar as coordenadas.");
      return;
    }

    setIsFetchingGeo(true);
    try {
      const query = config.cep || config.addressBase;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Brasil")}&limit=1`);
      const data = await response.json();

      if (data && data.length > 0) {
        setConfig(prev => ({
          ...prev,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        }));
        alert("Coordenadas atualizadas com sucesso com base no mapa!");
      } else {
        alert("Não encontramos coordenadas para este endereço. Tente ser mais específico.");
      }
    } catch (err) {
      alert("Erro ao buscar coordenadas no serviço de mapa.");
    } finally {
      setIsFetchingGeo(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateRestaurantConfig(config);
      alert('Configurações salvas!');
    } catch (err) {
      alert('Erro ao salvar configurações.');
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) return;
    try {
      await addCoupon({ 
        ...newCoupon, 
        active: true,
        usedCount: 0 
      });
      setNewCoupon({ code: '', discountPercentage: 10, minOrderValue: 0, availableQuantity: 100 });
      const coup = await getCoupons();
      setCoupons(coup);
    } catch (err) {
      alert('Erro ao criar cupom.');
    }
  };

  const handleCepChange = async (val: string) => {
    // Formata CEP (apenas números e hifen opcional, mas aqui deixamos livre e limpamos pra API)
    setConfig(prev => ({ ...prev, cep: val }));
    
    const cleanCep = val.replace(/\D/g, '');
    if (cleanCep.length === 8) {
       setIsFetchingGeo(true);
       try {
         const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
         const data = await res.json();
         if (!data.erro) {
           const address = `${data.logradouro}, , ${data.bairro}, ${data.localidade} - ${data.uf}`;
           setConfig(prev => ({ ...prev, addressBase: address }));
           alert("Endereço base encontrado! Por favor, adicione o NÚMERO no campo de endereço para calcular as coordenadas com precisão.");
         }
       } catch (err) {
         console.error("Erro ao buscar CEP", err);
       } finally {
         setIsFetchingGeo(false);
       }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-black flex items-center gap-2">
            <Package className="text-orange-500" /> Marmita<span className="text-orange-500">Admin</span>
          </h1>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-3">
          <Link to="/admin" className="flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-bold">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/admin/orders" className="flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-bold">
            <ClipboardList size={20} /> Pedidos
          </Link>
          <Link to="/admin/products" className="flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-bold">
            <ShoppingBag size={20} /> Produtos
          </Link>
          <Link to="/admin/finances" className="flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-bold">
            <PieChart size={20} /> Financeiro
          </Link>
          <Link to="/admin/settings" className="flex items-center gap-3 p-4 rounded-2xl bg-orange-500 text-white font-black shadow-lg shadow-orange-500/20">
            <Settings size={20} /> Configurações
          </Link>
          <Link to="/" className="flex items-center gap-3 p-4 rounded-2xl text-orange-400 hover:bg-orange-500/10 transition-all font-bold mt-10">
            <Eye size={20} /> Ver Loja
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={() => { signOut(auth); navigate('/admin/login'); }} className="w-full flex items-center gap-3 p-4 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all font-bold">
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-12">
          <h2 className="text-3xl font-black text-slate-900">Configurações Gerais</h2>
          <p className="text-slate-500 font-medium">Logística, Frete e Promoções</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <section className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
            <div className="flex items-center gap-3 text-orange-500">
              <Truck size={24} />
              <h3 className="text-xl font-black text-slate-900">Logística de Entrega</h3>
            </div>
            <form onSubmit={handleSaveConfig} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">CEP da Loja</label>
                  <input 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" 
                    placeholder="00000-000"
                    value={config.cep} 
                    onChange={e => handleCepChange(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Raio Máximo (km)</label>
                  <input 
                    type="number" 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" 
                    value={config.deliveryRadiusKm} 
                    onChange={e => setConfig({...config, deliveryRadiusKm: parseInt(e.target.value)})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Endereço Completo</label>
                <div className="flex gap-2">
                  <input 
                    className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" 
                    placeholder="Rua, Número, Bairro, Cidade"
                    value={config.addressBase} 
                    onChange={e => setConfig({...config, addressBase: e.target.value})} 
                  />
                  <button 
                    type="button"
                    onClick={fetchCoordinates}
                    disabled={isFetchingGeo}
                    className="p-4 bg-orange-100 text-orange-600 rounded-2xl hover:bg-orange-200 transition-all"
                    title="Obter Coordenadas do Mapa"
                  >
                    {isFetchingGeo ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2">WhatsApp da Loja</label>
                <input 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" 
                  placeholder="5511999999999 (apenas números)"
                  value={config.whatsappNumber || ''} 
                  onChange={e => setConfig({...config, whatsappNumber: e.target.value})} 
                />
                <p className="text-[10px] text-slate-400 font-bold mt-2 ml-1">
                  Digite apenas números, incluindo código do país e DDD (ex: 5511999999999)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Horário de Abertura</label>
                  <input 
                    type="time" 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" 
                    value={config.openingTime || '10:00'} 
                    onChange={e => setConfig({...config, openingTime: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Horário de Fechamento</label>
                  <input 
                    type="time" 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" 
                    value={config.closingTime || '23:00'} 
                    onChange={e => setConfig({...config, closingTime: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-200">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Latitude</label>
                  <input readOnly className="w-full bg-transparent border-none font-black text-slate-900 focus:ring-0" value={config.latitude} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Longitude</label>
                  <input readOnly className="w-full bg-transparent border-none font-black text-slate-900 focus:ring-0" value={config.longitude} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Taxa (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" 
                    value={config.deliveryFee} 
                    onChange={e => setConfig({...config, deliveryFee: parseFloat(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Grátis acima de (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" 
                    value={config.freeDeliveryOver} 
                    onChange={e => setConfig({...config, freeDeliveryOver: parseFloat(e.target.value)})} 
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">
                <Save size={20} /> Salvar Configurações
              </button>
            </form>
          </section>


          <section className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
            <div className="flex items-center gap-3 text-orange-500">
              <Tag size={24} />
              <h3 className="text-xl font-black text-slate-900">Cupons de Desconto</h3>
            </div>
            
            <form onSubmit={handleAddCoupon} className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Código do Cupom</label>
                  <input 
                    placeholder="EX: TRINTAOFF" 
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-black uppercase outline-none focus:border-orange-500" 
                    value={newCoupon.code} 
                    onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Desconto (%)</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-black outline-none" 
                    value={newCoupon.discountPercentage} 
                    onChange={e => setNewCoupon({...newCoupon, discountPercentage: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Mínimo (R$)</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-black outline-none" 
                    value={newCoupon.minOrderValue} 
                    onChange={e => setNewCoupon({...newCoupon, minOrderValue: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Qtde. Disponível</label>
                  <input 
                    type="number" 
                    placeholder="Qtde total" 
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-black outline-none" 
                    value={newCoupon.availableQuantity} 
                    onChange={e => setNewCoupon({...newCoupon, availableQuantity: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-orange-500 text-white font-black rounded-2xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center justify-center gap-2">
                <Plus size={20} /> Criar Cupom
              </button>
            </form>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
              {coupons.map(coupon => (
                <div key={coupon.id} className="flex justify-between items-center p-6 bg-slate-50 rounded-2xl border border-slate-200 group relative overflow-hidden">
                  <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-[10px] font-black text-white bg-orange-500 px-3 py-1 rounded-full uppercase tracking-widest">{coupon.code}</span>
                       <span className="text-[10px] font-black text-orange-600 bg-orange-100 px-3 py-1 rounded-full uppercase tracking-widest">{coupon.discountPercentage}% OFF</span>
                    </div>
                    <div className="flex flex-col gap-1">
                       <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Coins size={10}/> Pedido Mínimo: R$ {coupon.minOrderValue.toFixed(2)}</p>
                       <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Target size={10}/> Disponível: {coupon.availableQuantity - (coupon.usedCount || 0)} / {coupon.availableQuantity}</p>
                    </div>
                  </div>
                  <button onClick={async () => { if(confirm('Excluir cupom?')) { await deleteCoupon(coupon.id!); loadData(); } }} className="text-slate-300 hover:text-red-500 p-2 relative z-10">
                    <Trash2 size={20} />
                  </button>
                  <div className="absolute top-0 right-0 h-full w-1 bg-orange-500/10"></div>
                </div>
              ))}
              {coupons.length === 0 && <p className="text-center text-slate-400 font-bold py-10">Nenhum cupom ativo.</p>}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
