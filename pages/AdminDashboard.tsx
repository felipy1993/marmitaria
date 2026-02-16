
import React, { useState, useEffect } from 'react';
import { subscribeToOrders, updateOrderStatus } from '../services/database';
import { Order, OrderStatus } from '../types';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase-config';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LogOut, 
  Package, 
  ChevronRight, 
  Clock, 
  Truck, 
  CheckCircle2, 
  LayoutDashboard, 
  ShoppingBag,
  ExternalLink,
  Phone,
  MessageSquare,
  Eye
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
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
      
      // Lógica de Notificação via WhatsApp
      const cleanPhone = order.phone.replace(/\D/g, '');
      let message = '';

      if (status === OrderStatus.PREPARING) {
        message = `Olá *${order.customerName}*! 👋\n\nPassando para avisar que seu pedido da *Marmita Express* já entrou em preparo aqui na cozinha e logo sairá para entrega! 🍱🔥`;
      } else if (status === OrderStatus.DELIVERING) {
        message = `Olá *${order.customerName}*! 👋\n\nÓtimas notícias: seu pedido acabou de *sair para entrega*! O entregador já está a caminho. 🛵💨`;
      }

      if (message) {
        const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (err) {
      alert('Erro ao atualizar status');
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.RECEIVED: return 'bg-blue-100 text-blue-700 border-blue-200';
      case OrderStatus.PREPARING: return 'bg-orange-100 text-orange-700 border-orange-200';
      case OrderStatus.DELIVERING: return 'bg-purple-100 text-purple-700 border-purple-200';
      case OrderStatus.FINISHED: return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Unificada */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-black flex items-center gap-2">
            <Package className="text-orange-500" /> Marmita<span className="text-orange-500">Admin</span>
          </h1>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2">
          <Link to="/admin" className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800 text-white font-black shadow-lg">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/admin/products" className="flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-bold">
            <ShoppingBag size={20} /> Produtos
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-h-screen overflow-hidden">
        <header className="bg-white p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Painel de Pedidos</h2>
            <p className="text-slate-500 font-medium">Acompanhe a produção em tempo real</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-slate-50 px-6 py-3 rounded-2xl text-sm font-black border border-slate-200 text-slate-600">
               {orders.filter(o => o.status !== OrderStatus.FINISHED).length} ATIVOS
             </div>
             <button onClick={() => navigate('/')} className="p-3 bg-orange-50 text-orange-500 rounded-2xl hover:bg-orange-100 transition-all" title="Ver Cardápio Público">
                <ExternalLink size={20} />
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {orders.length === 0 ? (
            <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
              <Package size={64} className="mx-auto mb-4 text-slate-200" />
              <p className="text-slate-500 text-lg font-bold">Nenhum pedido hoje ainda.</p>
            </div>
          ) : (
            orders.map((order) => (
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
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Endereço de Entrega</p>
                          <p className="text-slate-700 font-bold">{order.address}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                        <ShoppingBag size={16} className="text-orange-500" /> Itens do Pedido
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                            <div className="flex justify-between items-start mb-3">
                              <span className="font-black text-slate-900">{item.quantity}x {item.name}</span>
                              <span className="font-black text-slate-400 text-sm">R$ {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                            
                            {item.selectedOptions && item.selectedOptions.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200/50">
                                {item.selectedOptions.map(opt => (
                                  <div key={opt.groupName}>
                                    <p className="text-[10px] font-black text-orange-500 uppercase mb-1">{opt.groupName}</p>
                                    <p className="text-sm font-bold text-slate-700">{opt.items.join(' • ')}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {item.observation && (
                              <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-2">
                                <MessageSquare size={14} className="text-orange-500 mt-0.5" />
                                <p className="text-xs font-bold text-orange-800 italic">"{item.observation}"</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-6 bg-slate-900 rounded-[2rem] text-white">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Pagamento</p>
                          <p className="font-bold text-sm">{order.paymentMethod}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Total do Pedido</p>
                          <p className="text-2xl font-black text-orange-400">R$ {order.total.toFixed(2)}</p>
                        </div>
                    </div>
                  </div>

                  <div className="lg:w-72 space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Ações de Produção</p>
                    <button onClick={() => handleStatusChange(order, OrderStatus.PREPARING)} className="w-full flex items-center justify-between px-6 py-5 bg-orange-50 text-orange-600 rounded-2xl font-black hover:bg-orange-100 transition-all border border-orange-100 group">
                      <span>Começar Preparo</span> <Clock size={20} className="group-hover:rotate-12 transition-transform" />
                    </button>
                    <button onClick={() => handleStatusChange(order, OrderStatus.DELIVERING)} className="w-full flex items-center justify-between px-6 py-5 bg-purple-50 text-purple-600 rounded-2xl font-black hover:bg-purple-100 transition-all border border-purple-100 group">
                      <span>Saiu p/ Entrega</span> <Truck size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button onClick={() => handleStatusChange(order, OrderStatus.FINISHED)} className="w-full flex items-center justify-between px-6 py-5 bg-green-50 text-green-600 rounded-2xl font-black hover:bg-green-100 transition-all border border-green-100 group">
                      <span>Finalizar Pedido</span> <CheckCircle2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
