
import React, { useState, useEffect } from 'react';
import { subscribeToOrders, updateOrderStatus } from '../services/database';
import { Order, OrderStatus } from '../types';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase-config';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LogOut, Package, Clock, Truck, CheckCircle2, LayoutDashboard, ShoppingBag, 
  Settings2, ClipboardList, PieChart, Eye, Phone, MessageSquare, ExternalLink,
  Archive, RotateCcw, Search, Filter
} from 'lucide-react';

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'finished'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = subscribeToOrders((newOrders) => {
      setOrders(newOrders);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (order: Order, status: OrderStatus) => {
    try {
      await updateOrderStatus(order.id!, status);
      const cleanPhone = order.phone.replace(/\D/g, '');
      let message = '';
      if (status === OrderStatus.PREPARING) {
        message = `Olá *${order.customerName}*! 👋\n\nSeu pedido na *Marmita Express* entrou em preparo! 🍱🔥`;
      } else if (status === OrderStatus.DELIVERING) {
        message = `Olá *${order.customerName}*! 👋\n\nSeu pedido *saiu para entrega*! 🛵💨`;
      }
      if (message) {
        window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
      }
    } catch (err) {
      alert('Erro ao atualizar status');
    }
  };

  const filteredOrders = orders.filter(order => {
    const isTabMatch = activeTab === 'active' 
      ? order.status !== OrderStatus.FINISHED 
      : order.status === OrderStatus.FINISHED;
    
    const isSearchMatch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.phone.includes(searchTerm);
    
    return isTabMatch && isSearchMatch;
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.RECEIVED: return 'bg-blue-100 text-blue-700 border-blue-200';
      case OrderStatus.PREPARING: return 'bg-orange-100 text-orange-700 border-orange-200';
      case OrderStatus.DELIVERING: return 'bg-purple-100 text-purple-700 border-purple-200';
      case OrderStatus.FINISHED: return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const activeCount = orders.filter(o => o.status !== OrderStatus.FINISHED).length;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-black flex items-center gap-2">
            <Package className="text-orange-500" /> Marmita<span className="text-orange-500">Admin</span>
          </h1>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-2">
          <Link to="/admin" className="flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-bold">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/admin/orders" className="flex items-center gap-3 p-4 rounded-2xl bg-orange-500 text-white font-black shadow-lg">
            <ClipboardList size={20} /> Pedidos
          </Link>
          <Link to="/admin/products" className="flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-bold">
            <ShoppingBag size={20} /> Produtos
          </Link>
          <Link to="/admin/finances" className="flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-bold">
            <PieChart size={20} /> Financeiro
          </Link>
          <Link to="/admin/settings" className="flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-bold">
            <Settings2 size={20} /> Configurações
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

      <main className="flex-1 flex flex-col max-h-screen overflow-hidden">
        <header className="bg-white p-8 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shrink-0">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Gestão de Pedidos</h2>
            <p className="text-slate-500 font-medium">Acompanhamento operacional em tempo real</p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200 w-full lg:w-auto">
             <div className="relative flex-1 lg:w-64">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar por nome ou fone..." 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-orange-500 transition-all"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             <button onClick={() => navigate('/')} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all" title="Ver Loja">
                <ExternalLink size={20} />
             </button>
          </div>
        </header>

        {/* Abas e Filtros */}
        <div className="bg-white border-b border-slate-100 px-8 flex gap-8 shrink-0">
           <button 
            onClick={() => setActiveTab('active')}
            className={`py-6 text-sm font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'active' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
           >
             Em Aberto ({activeCount})
           </button>
           <button 
            onClick={() => setActiveTab('finished')}
            className={`py-6 text-sm font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'finished' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
           >
             Finalizados
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar bg-slate-50/50">
          {filteredOrders.length === 0 ? (
            <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
              <ClipboardList size={64} className="mx-auto mb-4 text-slate-200" />
              <p className="text-slate-500 text-lg font-bold">Nenhum pedido encontrado nesta aba.</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all">
                <div className="flex flex-col lg:flex-row justify-between gap-10">
                  <div className="flex-1 space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cliente</span>
                        <h3 className="text-2xl font-black text-slate-900">{order.customerName}</h3>
                        <div className="flex items-center gap-4 mt-1">
                           <p className="text-slate-400 text-xs font-bold flex items-center gap-1"><Clock size={12} /> {new Date(order.createdAt).toLocaleTimeString()}</p>
                           <a href={`https://wa.me/55${order.phone.replace(/\D/g,'')}`} target="_blank" className="text-green-600 text-xs font-bold flex items-center gap-1 hover:underline"><Phone size={12} /> WhatsApp</a>
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black border ${getStatusColor(order.status)} uppercase tracking-widest`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex items-start gap-3">
                        <Truck size={20} className="text-slate-400 mt-1" />
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Entrega em</p>
                          <p className="text-slate-700 font-bold">{order.address}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">Itens do Pedido</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                            <p className="font-black text-slate-900">{item.quantity}x {item.name}</p>
                            {item.selectedOptions && item.selectedOptions.map(opt => (
                              <p key={opt.groupName} className="text-[10px] text-slate-400 font-bold uppercase mt-1">{opt.groupName}: {opt.items.join(' • ')}</p>
                            ))}
                            {item.observation && <p className="mt-2 text-xs font-bold text-orange-600 italic">"{item.observation}"</p>}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-6 bg-slate-900 rounded-[2rem] text-white">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Pagamento: {order.paymentMethod}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Total</p>
                          <p className="text-2xl font-black text-orange-400">R$ {order.total.toFixed(2)}</p>
                        </div>
                    </div>
                  </div>

                  {activeTab === 'active' && (
                    <div className="lg:w-72 space-y-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Ações</p>
                      <button onClick={() => handleStatusChange(order, OrderStatus.PREPARING)} className="w-full flex items-center justify-between px-6 py-4 bg-orange-50 text-orange-600 rounded-2xl font-black hover:bg-orange-100 border border-orange-100 transition-all">
                        <span>Preparo</span> <Clock size={20} />
                      </button>
                      <button onClick={() => handleStatusChange(order, OrderStatus.DELIVERING)} className="w-full flex items-center justify-between px-6 py-4 bg-purple-50 text-purple-600 rounded-2xl font-black hover:bg-purple-100 border border-purple-100 transition-all">
                        <span>Saiu p/ Entrega</span> <Truck size={20} />
                      </button>
                      <button onClick={() => handleStatusChange(order, OrderStatus.FINISHED)} className="w-full flex items-center justify-between px-6 py-4 bg-green-50 text-green-600 rounded-2xl font-black hover:bg-green-100 border border-green-100 transition-all">
                        <span>Finalizar</span> <CheckCircle2 size={20} />
                      </button>
                    </div>
                  )}

                  {activeTab === 'finished' && (
                    <div className="lg:w-72">
                      <button onClick={() => handleStatusChange(order, OrderStatus.RECEIVED)} className="w-full flex items-center justify-between px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 border border-slate-200 transition-all">
                         <span>Reabrir Pedido</span> <RotateCcw size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminOrders;
