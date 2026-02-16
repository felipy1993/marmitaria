
import React, { useState, useEffect, useMemo } from 'react';
import { subscribeToOrders, getAllProducts, getOrdersByPeriod, getTransactionsByPeriod } from '../services/database';
import { Order, OrderStatus, Product, Transaction } from '../types';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase-config';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LogOut, Package, Clock, Truck, LayoutDashboard, ShoppingBag, 
  ExternalLink, Phone, Eye, Settings2, TrendingUp, DollarSign, 
  Users, Activity, Wallet, PieChart, ArrowUpRight, ArrowDownRight,
  ClipboardList, ChevronRight
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [monthTransactions, setMonthTransactions] = useState<Transaction[]>([]);
  const [activeProductsCount, setActiveProductsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const endOfDay = new Date().setHours(23, 59, 59, 999);

    const unsubscribeOrders = subscribeToOrders((newOrders) => {
      setOrders(newOrders);
    });

    const loadMetrics = async () => {
      try {
        const [allProds, trans] = await Promise.all([
          getAllProducts(),
          getTransactionsByPeriod(startOfMonth, endOfDay)
        ]);
        setActiveProductsCount(allProds.filter(p => p.active).length);
        setMonthTransactions(trans);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadMetrics();
    return () => unsubscribeOrders();
  }, []);

  // Métricas de Hoje
  const todayStats = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(o => o.createdAt >= today && o.status === OrderStatus.FINISHED);
    const revenue = todayOrders.reduce((acc, curr) => acc + curr.total, 0);
    return {
      revenue,
      count: todayOrders.length,
      avgTicket: todayOrders.length > 0 ? revenue / todayOrders.length : 0
    };
  }, [orders]);

  // Saúde Financeira Mensal (Pedidos Finalizados + Entradas - Despesas)
  const monthlyHealth = useMemo(() => {
    const finishedOrders = orders.filter(o => o.status === OrderStatus.FINISHED);
    const orderRevenue = finishedOrders.reduce((acc, curr) => acc + curr.total, 0);
    const manualIncome = monthTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    
    const totalIncome = orderRevenue + manualIncome;
    const profit = totalIncome - expenses;

    return { totalIncome, expenses, profit };
  }, [orders, monthTransactions]);

  const activeOrdersCount = orders.filter(o => o.status !== OrderStatus.FINISHED).length;

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
  );

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
          <Link to="/admin" className="flex items-center gap-3 p-4 rounded-2xl bg-orange-500 text-white font-black shadow-lg">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/admin/orders" className="flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-bold">
            <ClipboardList size={20} /> Pedidos 
            {activeOrdersCount > 0 && <span className="ml-auto bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">{activeOrdersCount}</span>}
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

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto no-scrollbar">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Saúde do Negócio</h2>
            <p className="text-slate-500 font-medium">Visão geral de hoje e desempenho financeiro</p>
          </div>
          <button onClick={() => navigate('/admin/orders')} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-black transition-all flex items-center gap-3">
             <ClipboardList size={20} /> Gerenciar Pedidos
          </button>
        </header>

        {/* Cards de Métricas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
             <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp size={24} />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vendas de Hoje</p>
             <h3 className="text-3xl font-black text-slate-900">R$ {todayStats.revenue.toFixed(2)}</h3>
             <p className="text-[10px] text-orange-500 font-bold mt-2">{todayStats.count} marmitas finalizadas</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
             <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                <Activity size={24} />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ticket Médio</p>
             <h3 className="text-3xl font-black text-slate-900">R$ {todayStats.avgTicket.toFixed(2)}</h3>
             <p className="text-[10px] text-blue-500 font-bold mt-2">Média por pedido</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
             <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 mb-6 group-hover:scale-110 transition-transform">
                <Wallet size={24} />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lucro Estimado (Mês)</p>
             <h3 className={`text-3xl font-black ${monthlyHealth.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {monthlyHealth.profit.toFixed(2)}
             </h3>
             <p className="text-[10px] text-slate-400 font-bold mt-2">Saldo mensal real</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
             <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 mb-6 group-hover:scale-110 transition-transform">
                <ShoppingBag size={24} />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cardápio Ativo</p>
             <h3 className="text-3xl font-black text-slate-900">{activeProductsCount} Itens</h3>
             <p className="text-[10px] text-green-500 font-bold mt-2">Itens disponíveis na loja</p>
          </div>
        </div>

        {/* Seção Central - Saúde Financeira vs Operação */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Gráfico/Resumo Financeiro */}
          <section className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900">Saúde Financeira do Mês</h3>
                <Link to="/admin/finances" className="text-orange-500 font-black text-xs uppercase tracking-widest hover:underline">Ver Detalhes</Link>
             </div>
             
             <div className="space-y-8">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Receitas (Bruto)</p>
                      <h4 className="text-4xl font-black text-slate-900">R$ {monthlyHealth.totalIncome.toFixed(2)}</h4>
                   </div>
                   <ArrowUpRight size={48} className="text-green-500 bg-green-50 p-3 rounded-2xl" />
                </div>

                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
                   <div 
                    className="h-full bg-green-500 transition-all duration-1000" 
                    style={{ width: `${(monthlyHealth.profit / (monthlyHealth.totalIncome || 1)) * 100}%` }}
                   ></div>
                   <div 
                    className="h-full bg-red-500 transition-all duration-1000" 
                    style={{ width: `${(monthlyHealth.expenses / (monthlyHealth.totalIncome || 1)) * 100}%` }}
                   ></div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <div className="p-6 bg-red-50 rounded-[2rem] border border-red-100">
                      <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Despesas</p>
                      <p className="text-xl font-black text-red-600">R$ {monthlyHealth.expenses.toFixed(2)}</p>
                   </div>
                   <div className="p-6 bg-green-50 rounded-[2rem] border border-green-100">
                      <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Lucro Líquido</p>
                      <p className="text-xl font-black text-green-600">R$ {monthlyHealth.profit.toFixed(2)}</p>
                   </div>
                </div>
             </div>
          </section>

          {/* Status da Operação */}
          <section className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-10 -mt-10 blur-3xl"></div>
             
             <h3 className="text-xl font-black mb-8 relative z-10">Operação Agora</h3>
             
             <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-bold">Recebidos</span>
                   </div>
                   <span className="font-black text-lg">{orders.filter(o => o.status === OrderStatus.RECEIVED).length}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm font-bold">Em Preparo</span>
                   </div>
                   <span className="font-black text-lg">{orders.filter(o => o.status === OrderStatus.PREPARING).length}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-bold">Em Entrega</span>
                   </div>
                   <span className="font-black text-lg">{orders.filter(o => o.status === OrderStatus.DELIVERING).length}</span>
                </div>

                <button 
                  onClick={() => navigate('/admin/orders')}
                  className="w-full mt-6 py-5 bg-orange-500 text-white font-black rounded-2xl shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                >
                  {/* Fixed error on line 251 by adding missing ChevronRight import */}
                  Ver Pedidos <ChevronRight size={18} />
                </button>
             </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
