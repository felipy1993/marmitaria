
import React, { useState, useEffect, useMemo } from 'react';
import { subscribeToOrders, getAllProducts, getOrdersByPeriod, getTransactionsByPeriod } from '../services/database';
import { Order, OrderStatus, Product, Transaction } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TrendingUp, Activity, Wallet, ArrowUpRight, ArrowDownRight,
  ClipboardList, ChevronRight, ShoppingBag, LayoutPanelLeft, BarChart3, PieChart as PieChartIcon, Target
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [monthTransactions, setMonthTransactions] = useState<Transaction[]>([]);
  const [activeProductsCount, setActiveProductsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const endOfDay = new Date().setHours(23, 59, 59, 999);

    const unsubscribeOrders = subscribeToOrders((newOrders: Order[]) => {
      setOrders(newOrders);
    });

    const loadMetrics = async () => {
      try {
        const [allProds, trans] = await Promise.all([
          getAllProducts(),
          getTransactionsByPeriod(startOfMonth, endOfDay)
        ]);
        setActiveProductsCount(allProds.filter((p: Product) => p.active).length);
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
    const todayOrders = orders.filter((o: Order) => o.createdAt >= today && o.status === OrderStatus.FINISHED);
    const revenue = todayOrders.reduce((acc: number, curr: Order) => acc + curr.total, 0);
    return {
      revenue,
      count: todayOrders.length,
      avgTicket: todayOrders.length > 0 ? revenue / todayOrders.length : 0
    };
  }, [orders]);

  // Saúde Financeira Mensal (Pedidos Finalizados + Entradas - Despesas)
  const monthlyHealth = useMemo(() => {
    const finishedOrders = orders.filter((o: Order) => o.status === OrderStatus.FINISHED);
    const orderRevenue = finishedOrders.reduce((acc: number, curr: Order) => acc + curr.total, 0);
    const manualIncome = monthTransactions.filter((t: Transaction) => t.type === 'income').reduce((acc: number, curr: Transaction) => acc + curr.amount, 0);
    const expenses = monthTransactions.filter((t: Transaction) => t.type === 'expense').reduce((acc: number, curr: Transaction) => acc + curr.amount, 0);
    
    const totalIncome = orderRevenue + manualIncome;
    const profit = totalIncome - expenses;

    return { totalIncome, expenses, profit };
  }, [orders, monthTransactions]);

  // Dados para os Gráficos
  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });

    return last7Days.map(timestamp => {
      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt).setHours(0, 0, 0, 0);
        return orderDate === timestamp && o.status === OrderStatus.FINISHED;
      });
      
      const total = dayOrders.reduce((acc, curr) => acc + curr.total, 0);
      return {
        name: new Date(timestamp).toLocaleDateString('pt-BR', { weekday: 'short' }),
        vendas: total
      };
    });
  }, [orders]);

  const topProductsData = useMemo(() => {
    const productsMap: Record<string, number> = {};
    orders.filter(o => o.status === OrderStatus.FINISHED).forEach(order => {
      order.items.forEach(item => {
        productsMap[item.name] = (productsMap[item.name] || 0) + item.quantity;
      });
    });

    return Object.entries(productsMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [orders]);

  const activeOrdersCount = orders.filter((o: Order) => o.status !== OrderStatus.FINISHED).length;

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
  );

  return (
    <AdminLayout activeOrdersCount={activeOrdersCount}>
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

        {/* Seção de Gráficos Profissionais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <section className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900">Tendência de Vendas</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faturamento dos últimos 7 dias</p>
              </div>
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                <BarChart3 size={20} />
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                    cursor={{ stroke: '#f1f5f9' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vendas" 
                    stroke="#f97316" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900">Produtos Destaque</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top 5 marmitas mais vendidas</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                <Target size={20} />
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }}
                    width={100}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 10, 10, 0]} barSize={20}>
                    {topProductsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'][index % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
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
    </AdminLayout>
  );
};

export default AdminDashboard;
