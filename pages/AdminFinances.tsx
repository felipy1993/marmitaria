import React, { useState, useEffect, useMemo } from 'react';
import { getOrdersByPeriod, getTransactionsByPeriod, addTransaction, deleteTransaction, getAllProducts } from '../services/database';
import { Order, Transaction, Product, OrderStatus } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase-config';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, 
  Calendar, Filter, Plus, Trash2, Star, 
  ChevronRight, ArrowUpRight, ArrowDownLeft, Wallet, Receipt, X, ClipboardList, Eye
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';

const AdminFinances: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEntry, setNewEntry] = useState<Omit<Transaction, 'id' | 'date'>>({
    description: '',
    amount: 0,
    type: 'expense',
    category: 'Geral'
  });

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      
      const [o, t, p] = await Promise.all([
        getOrdersByPeriod(start, end),
        getTransactionsByPeriod(start, end),
        getAllProducts()
      ]);
      
      setOrders(o);
      setTransactions(t);
      setProducts(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const billedFromOrders = useMemo(() => {
    return orders
      .filter((o: Order) => o.status === OrderStatus.FINISHED)
      .reduce((acc: number, curr: Order) => acc + curr.total, 0);
  }, [orders]);

  const manualIncome = useMemo(() => {
    return transactions
      .filter((t: Transaction) => t.type === 'income')
      .reduce((acc: number, curr: Transaction) => acc + curr.amount, 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t: Transaction) => t.type === 'expense')
      .reduce((acc: number, curr: Transaction) => acc + curr.amount, 0);
  }, [transactions]);

  const totalRevenue = billedFromOrders + manualIncome;
  const netProfit = totalRevenue - totalExpenses;

  const salesRanking = useMemo(() => {
    const counts: Record<string, { count: number, revenue: number, category: string }> = {};
    
    orders.forEach((order: Order) => {
      order.items.forEach((item: any) => {
        const prod = products.find((p: Product) => p.name === item.name);
        if (selectedCategory !== 'Todos' && prod?.category !== selectedCategory) return;

        if (!counts[item.name]) {
          counts[item.name] = { count: 0, revenue: 0, category: prod?.category || 'Geral' };
        }
        counts[item.name].count += item.quantity;
        counts[item.name].revenue += item.price * item.quantity;
      });
    });

    return Object.entries(counts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [orders, products, selectedCategory]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addTransaction({
        ...newEntry,
        date: Date.now()
      });
      setIsModalOpen(false);
      loadData();
      setNewEntry({ description: '', amount: 0, type: 'expense', category: 'Geral' });
    } catch (err) {
      alert('Erro ao salvar lançamento');
    }
  };

  const categories = ['Todos', ...Array.from(new Set(products.map((p: Product) => p.category)))];

  return (
    <AdminLayout>
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Financeiro</h2>
            <p className="text-slate-500 font-medium">Controle de entradas, saídas e ranking de vendas</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
              <Calendar size={16} className="text-slate-400" />
              <input type="date" className="bg-transparent text-xs font-black outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <span className="text-slate-300">até</span>
              <input type="date" className="bg-transparent text-xs font-black outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
              <Filter size={16} className="text-slate-400" />
              <select className="bg-transparent text-xs font-black outline-none cursor-pointer" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                {categories.map((cat: any) => <option key={String(cat)} value={String(cat)}>{String(cat)}</option>)}
              </select>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-black transition-all"
            >
              <Plus size={20} /> Lançar Valor
            </button>
          </div>
        </header>

        {/* Cards de Métricas */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 mb-6">
                <TrendingUp size={24} />
             </div>
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Receita Total</p>
             <h3 className="text-3xl font-black text-green-600">R$ {totalRevenue.toFixed(2)}</h3>
             <p className="text-[10px] text-slate-400 font-bold mt-2">Vendas + Entradas Manuais</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6">
                <TrendingDown size={24} />
             </div>
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Despesas</p>
             <h3 className="text-3xl font-black text-red-500">R$ {totalExpenses.toFixed(2)}</h3>
             <p className="text-[10px] text-slate-400 font-bold mt-2">Lançamentos de Saída</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-6">
                <Wallet size={24} />
             </div>
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Lucro Líquido</p>
             <h3 className="text-3xl font-black text-blue-600">R$ {netProfit.toFixed(2)}</h3>
             <p className="text-[10px] text-slate-400 font-bold mt-2">Resultado Final do Período</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mb-6">
                <Package size={24} />
             </div>
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Billed (Pedidos)</p>
             <h3 className="text-3xl font-black text-slate-900">R$ {billedFromOrders.toFixed(2)}</h3>
             <p className="text-[10px] text-slate-400 font-bold mt-2">{orders.filter((o: Order) => o.status === OrderStatus.FINISHED).length} pedidos finalizados</p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Ranking de Vendas */}
          <section className="lg:col-span-1 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Star className="text-orange-500 fill-orange-500" size={20} /> Ranking de Vendas
              </h3>
            </div>
            
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-4">
              {salesRanking.length > 0 ? (
                salesRanking.map((item: any, index: number) => (
                  <div key={item.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-orange-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {index + 1}º
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm truncate max-w-[120px]">{item.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="font-black text-slate-900">{item.count} un.</p>
                       <p className="text-[10px] font-bold text-orange-500">R$ {item.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center space-y-3">
                  <Package className="mx-auto text-slate-200" size={48} />
                  <p className="text-slate-400 font-bold">Sem vendas no período.</p>
                </div>
              )}
            </div>
          </section>

          {/* Últimos Lançamentos Financeiros */}
          <section className="lg:col-span-2 space-y-6">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <DollarSign className="text-orange-500" size={20} /> Fluxo de Caixa Manual
                </h3>
             </div>

             <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map((t: Transaction) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-8 py-6 text-xs font-bold text-slate-400">
                          {new Date(t.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-8 py-6 font-black text-slate-900 text-sm">
                          {t.description}
                        </td>
                        <td className="px-8 py-6">
                           <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase">
                             {t.category}
                           </span>
                        </td>
                        <td className={`px-8 py-6 text-right font-black ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                           {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                        </td>
                        <td className="px-8 py-6 text-center">
                           <button onClick={async () => { if(confirm('Excluir lançamento?')) { await deleteTransaction(t.id!); loadData(); } }} className="text-slate-300 hover:text-red-500 p-2">
                             <Trash2 size={16} />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </section>
        </div>
      {/* Modal Lançamento Financeiro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-900">Novo Lançamento</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-2xl"><X size={20} /></button>
             </div>
             
             <form onSubmit={handleAddEntry} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <button 
                    type="button" 
                    onClick={() => setNewEntry({...newEntry, type: 'income'})}
                    className={`p-5 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all ${newEntry.type === 'income' ? 'bg-green-500 border-green-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}
                   >
                     Receita (+)
                   </button>
                   <button 
                    type="button" 
                    onClick={() => setNewEntry({...newEntry, type: 'expense'})}
                    className={`p-5 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all ${newEntry.type === 'expense' ? 'bg-red-500 border-red-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}
                   >
                     Despesa (-)
                   </button>
                </div>

                <div className="space-y-4">
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Descrição</label>
                      <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-orange-500" placeholder="Ex: Compra de embalagens" value={newEntry.description} onChange={e => setNewEntry({...newEntry, description: e.target.value})} />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Valor (R$)</label>
                        <input required type="number" step="0.01" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-orange-500" placeholder="0,00" value={newEntry.amount} onChange={e => setNewEntry({...newEntry, amount: parseFloat(e.target.value)})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Categoria</label>
                        <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-orange-500 cursor-pointer" value={newEntry.category} onChange={e => setNewEntry({...newEntry, category: e.target.value})}>
                          <option value="Insumos">Alimentos/Insumos</option>
                          <option value="Embalagens">Embalagens</option>
                          <option value="Infraestrutura">Água/Luz/Gás</option>
                          <option value="Marketing">Marketing/Anúncios</option>
                          <option value="Pessoal">Salários/Pessoal</option>
                          <option value="Geral">Outros/Geral</option>
                        </select>
                      </div>
                   </div>
                </div>

                <button type="submit" className="w-full py-6 bg-slate-900 text-white font-black rounded-[2rem] shadow-xl hover:bg-black transition-all">
                  Confirmar Lançamento
                </button>
             </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </AdminLayout>
  );
};

export default AdminFinances;
