
import React, { useState, useEffect } from 'react';
import { getRestaurantConfig, updateRestaurantConfig, getCoupons, addCoupon, deleteCoupon } from '../services/database';
import { RestaurantConfig, Coupon } from '../types';
import { LayoutDashboard, ShoppingBag, Settings, LogOut, Package, Save, Plus, Trash2, Tag, Truck, MapPin, Navigation, Search, Loader2 } from 'lucide-react';
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
    cep: ''
  });
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discountPercentage: 10 });
  const [loading, setLoading] = useState(true);
  const [isFetchingGeo, setIsFetchingGeo] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [conf, coup] = await Promise.all([getRestaurantConfig(), getCoupons()]);
      if (conf) setConfig(conf);
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
      await addCoupon({ ...newCoupon, active: true });
      setNewCoupon({ code: '', discountPercentage: 10 });
      const coup = await getCoupons();
      setCoupons(coup);
    } catch (err) {
      alert('Erro ao criar cupom.');
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
          <Link to="/admin/products" className="flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-bold">
            <ShoppingBag size={20} /> Produtos
          </Link>
          <Link to="/admin/settings" className="flex items-center gap-3 p-4 rounded-2xl bg-orange-500 text-white font-black shadow-lg shadow-orange-500/20">
            <Settings size={20} /> Configurações
          </Link>
          <Link to="/" className="flex items-center gap-3 p-4 rounded-2xl text-orange-400 hover:bg-orange-500/10 transition-all font-bold mt-10">
            <Navigation size={20} /> Ver Loja
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
                    onChange={e => setConfig({...config, cep: e.target.value})} 
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
            
            <form onSubmit={handleAddCoupon} className="flex gap-4">
              <input 
                placeholder="CÓDIGO" 
                className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black uppercase outline-none" 
                value={newCoupon.code} 
                onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
              />
              <input 
                type="number" 
                placeholder="%" 
                className="w-24 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none" 
                value={newCoupon.discountPercentage} 
                onChange={e => setNewCoupon({...newCoupon, discountPercentage: parseInt(e.target.value)})}
              />
              <button type="submit" className="p-4 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 shadow-lg shadow-orange-500/20">
                <Plus size={24} />
              </button>
            </form>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
              {coupons.map(coupon => (
                <div key={coupon.id} className="flex justify-between items-center p-6 bg-slate-50 rounded-2xl border border-slate-200 group">
                  <div>
                    <span className="text-xs font-black text-orange-500 bg-orange-100 px-3 py-1 rounded-lg mr-3">{coupon.discountPercentage}% OFF</span>
                    <span className="font-black text-slate-900 tracking-widest">{coupon.code}</span>
                  </div>
                  <button onClick={async () => { if(confirm('Excluir cupom?')) { await deleteCoupon(coupon.id!); loadData(); } }} className="text-slate-300 hover:text-red-500 p-2">
                    <Trash2 size={20} />
                  </button>
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
