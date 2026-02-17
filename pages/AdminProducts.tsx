
import React, { useState, useEffect } from 'react';
import { getAllProducts, addProduct, updateProduct, deleteProduct } from '../services/database';
import { Product, OptionGroup, OptionItem } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase-config';
import { 
  Package, ShoppingBag, Plus, Edit2, Trash2, Save, X, 
  LayoutDashboard, ToggleLeft as Toggle, Image as ImageIcon,
  Tag as TagIcon, ListFilter, Database, Eye, LogOut, Settings2, PlusCircle, ExternalLink, Minus,
  Camera, Copy, Zap, Info, ChevronRight, Wand2, Utensils, Check, Calendar, ClipboardList, PieChart
} from 'lucide-react';

const WEEK_DAYS = [
  { label: 'Dom', value: 0 },
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 }
];

const DISH_TEMPLATES = [
  {
    label: 'Marmita Comercial',
    icon: '🍱',
    data: {
      name: 'Marmita Comercial do Dia',
      description: 'Arroz branco soltinho, feijão carioca temperado, uma proteína a escolha e guarnição simples.',
      category: 'Marmitas',
      imageUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?q=80&w=800&auto=format&fit=crop'
    }
  },
  {
    label: 'Marmita Executiva',
    icon: '🥩',
    data: {
      name: 'Marmita Executiva Premium',
      description: 'Prato completo com arroz, feijão, proteína grelhada na hora, duas guarnições e salada fresca.',
      category: 'Marmitas',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop'
    }
  },
  {
    label: 'Marmita Fit',
    icon: '🥗',
    data: {
      name: 'Marmita Fit Equilibrada',
      description: 'Arroz integral, feijão (opcional), proteína magra grelhada e mix de legumes no vapor.',
      category: 'Marmitas',
      imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800&auto=format&fit=crop'
    }
  }
];

const PRESET_GROUPS = [
  {
    label: 'Base (Arroz/Feijão)',
    icon: '🍚',
    group: {
      name: 'Acompanhamentos Base',
      min: 1,
      max: 3,
      items: [
        { name: 'Arroz Branco' },
        { name: 'Arroz Integral' },
        { name: 'Feijão Carioca' },
        { name: 'Feijão Preto' },
        { name: 'Feijão Gorda (com bacon)' }
      ]
    }
  },
  {
    label: 'Carnes e Aves',
    icon: '🍗',
    group: {
      name: 'Escolha sua Proteína',
      min: 1,
      max: 1,
      items: [
        { name: 'Bife Acebolado' },
        { name: 'Filé de Frango Grelhado' },
        { name: 'Frango a Milanesa' },
        { name: 'Bisteca Suína' },
        { name: 'Carne de Panela com Batata' },
        { name: 'Omelete com Queijo' }
      ]
    }
  },
  {
    label: 'Guarnições (Extras)',
    icon: '🍟',
    group: {
      name: 'Guarnições',
      min: 0,
      max: 2,
      items: [
        { name: 'Batata Frita' },
        { name: 'Purê de Batata' },
        { name: 'Farofa Especial' },
        { name: 'Macarrão ao Sugo' },
        { name: 'Ovo Frito' },
        { name: 'Banana Frita' }
      ]
    }
  },
  {
    label: 'Saladas',
    icon: '🥬',
    group: {
      name: 'Mix de Saladas',
      min: 0,
      max: 3,
      items: [
        { name: 'Alface Americana' },
        { name: 'Tomate fatiado' },
        { name: 'Cenoura Ralada' },
        { name: 'Beterraba Cozida' },
        { name: 'Maionese de Legumes' }
      ]
    }
  },
  {
    label: 'Bebidas',
    icon: '🥤',
    group: {
      name: 'Bebidas e Refrigerantes',
      min: 0,
      max: 50,
      items: [
        { name: 'Coca-Cola 350ml', imageUrl: 'coca-cola-350ml.png', price: 6.00 },
        { name: 'Coca-Cola 600ml', imageUrl: 'coca-cola-600ml.png', price: 8.50 },
        { name: 'Coca-Cola Zero 600ml', imageUrl: 'coca-cola-zero-600ml.png', price: 8.50 },
        { name: 'Fanta Laranja 350ml', imageUrl: 'fanta-laranja-350ml.png', price: 5.50 },
        { name: 'Guaraná Kuat 350ml', imageUrl: 'guaraná-kuat-350ml.png', price: 5.50 },
        { name: 'Sprite Limão 350ml', imageUrl: 'sprite-limao-350ml.png', price: 5.50 }
      ]
    }
  }
];

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(true);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: 'Marmitas',
    active: true,
    availableDays: [0, 1, 2, 3, 4, 5, 6],
    optionsGroups: [] as OptionGroup[]
  });

  const formatImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return url;
    return `/assets/options/${url}`;
  };

  const GROUPED_ASSETS = {
    'Bases': ['arroz-branco.png', 'feijao-carioca.png', 'feijoada.png', 'farofa.png'],
    'Carnes e Proteínas': ['bife-frito.png', 'bisteca-suina.png', 'carne-de-panela.png', 'frango-grelhado.png', 'ovo-frito.png'],
    'Guarnições e Saladas': ['alface.png', 'batata-frita.png', 'pate-de-alho.png', 'vinagrete.png'],
    'Bebidas': [
      'coca-cola-350ml.png', 'coca-cola-600ml.png', 'coca-cola-zero-600ml.png',
      'fanta-laranja-350ml.png', 'guaraná-kuat-350ml.png', 'sprite-limao-350ml.png'
    ]
  };

  const AVAILABLE_ASSETS = Object.values(GROUPED_ASSETS).flat();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        imageUrl: product.imageUrl,
        category: product.category || 'Marmitas',
        active: product.active,
        availableDays: product.availableDays || [0, 1, 2, 3, 4, 5, 6],
        optionsGroups: product.optionsGroups || []
      });
    } else {
      setEditingProduct(null);
      setFormData({ 
        name: '', 
        description: '', 
        price: '', 
        imageUrl: '', 
        category: 'Marmitas', 
        active: true, 
        availableDays: [0, 1, 2, 3, 4, 5, 6],
        optionsGroups: [] 
      });
    }
    setIsModalOpen(true);
  };

  const toggleDay = (dayValue: number) => {
    setFormData(prev => {
      const days = prev.availableDays || [];
      if (days.includes(dayValue)) {
        return { ...prev, availableDays: days.filter(d => d !== dayValue) };
      }
      return { ...prev, availableDays: [...days, dayValue] };
    });
  };

  const applyTemplate = (template: typeof DISH_TEMPLATES[0]) => {
    setFormData(prev => ({
      ...prev,
      name: template.data.name,
      description: template.data.description,
      category: template.data.category,
      imageUrl: template.data.imageUrl
    }));
  };

  const applyPresetGroup = (presetGroup: typeof PRESET_GROUPS[0]) => {
    const newGroup: OptionGroup = {
      ...presetGroup.group,
      id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      extraPricePerItem: 0
    };
    setFormData(prev => ({
      ...prev,
      optionsGroups: [...prev.optionsGroups, newGroup]
    }));
  };

  const handleDuplicateProduct = (product: Product) => {
    setEditingProduct(null);
    const duplicatedGroups = product.optionsGroups ? JSON.parse(JSON.stringify(product.optionsGroups)).map((group: OptionGroup) => ({
      ...group,
      id: `copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    })) : [];

    setFormData({
      name: `${product.name} (Cópia)`,
      description: product.description,
      price: product.price.toString(),
      imageUrl: product.imageUrl,
      category: product.category || 'Marmitas',
      active: product.active,
      availableDays: product.availableDays || [0, 1, 2, 3, 4, 5, 6],
      optionsGroups: duplicatedGroups
    });
    setIsModalOpen(true);
  };

  const addOptionGroup = () => {
    const newGroup: OptionGroup = {
      id: Date.now().toString(),
      name: '',
      min: 1,
      max: 1,
      items: [{ name: '' }]
    };
    setFormData(prev => ({ ...prev, optionsGroups: [...prev.optionsGroups, newGroup] }));
  };

  const updateGroup = (id: string, updates: Partial<OptionGroup>) => {
    setFormData(prev => ({
      ...prev,
      optionsGroups: prev.optionsGroups.map(g => g.id === id ? { ...g, ...updates } : g)
    }));
  };

  const addOptionItem = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      optionsGroups: prev.optionsGroups.map(g => 
        g.id === groupId ? { ...g, items: [...g.items, { name: '' }] } : g
      )
    }));
  };

  const updateOptionItem = (groupId: string, itemIdx: number, updates: Partial<OptionItem>) => {
    setFormData(prev => ({
      ...prev,
      optionsGroups: prev.optionsGroups.map(g => 
        g.id === groupId ? { 
          ...g, 
          items: g.items.map((item, idx) => idx === itemIdx ? { ...item, ...updates } : item) 
        } : g
      )
    }));
  };

  const removeGroup = (id: string) => {
    setFormData(prev => ({ ...prev, optionsGroups: prev.optionsGroups.filter(g => g.id !== id) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return alert('Nome e Preço são obrigatórios');

    const payload = {
      ...formData,
      price: parseFloat(formData.price)
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id!, payload);
      } else {
        await addProduct(payload);
      }
      setIsModalOpen(false);
      loadProducts();
    } catch (err) {
      alert('Erro ao salvar produto.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
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
          <Link to="/admin/products" className="flex items-center gap-3 p-4 rounded-2xl bg-orange-500 text-white font-black shadow-lg shadow-orange-500/20">
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

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Catálogo</h2>
            <p className="text-slate-500 font-medium">Gerencie o que seus clientes podem comprar</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-[1.5rem] font-black shadow-xl transition-all active:scale-95"
          >
            <Plus size={20} /> Novo Item
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          {showTutorial && (
            <div className="bg-[#0f172a] rounded-xl border border-slate-700 overflow-hidden shadow-2xl animate-fade-in">
              <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-[#1e293b]">
                <div className="flex items-center gap-2 text-orange-400">
                  <ImageIcon size={20} />
                  <h3 className="font-bold text-sm tracking-tight">Dica: Adicionando Fotos Profissionais</h3>
                </div>
                <button onClick={() => setShowTutorial(false)} className="text-slate-400 hover:text-white p-1">
                  <Minus size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-slate-400 text-sm leading-relaxed">Use o <strong>PostImages.org</strong> para hospedar suas fotos. Suba a foto, copie o "Link Direto" e cole no formulário abaixo.</p>
                <div className="pt-2">
                  <a href="https://postimages.org/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#d4a017] hover:bg-[#b8860b] text-slate-900 font-black px-6 py-3 rounded-lg transition-all text-sm shadow-lg shadow-black/20">
                    <ExternalLink size={18} /> Hospedar Imagens
                  </a>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              <p className="text-slate-400 font-medium animate-pulse">Carregando itens...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                  <div className="h-44 relative">
                    <img src={product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'} alt={product.name} className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${!product.active && 'grayscale brightness-50'}`} />
                    <button 
                      onClick={async () => { await updateProduct(product.id!, { active: !product.active }); loadProducts(); }}
                      className={`absolute top-4 left-4 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase shadow-lg transition-all ${product.active ? 'bg-green-500 text-white' : 'bg-slate-700 text-white opacity-90'}`}
                    >
                      {product.active ? 'No Cardápio' : 'Fora do Ar'}
                    </button>
                    {product.optionsGroups && product.optionsGroups.length > 0 && (
                      <div className="absolute top-4 right-4 bg-orange-500 text-white p-2 rounded-xl shadow-lg">
                        <Settings2 size={16} />
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="min-h-[64px]">
                      <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest px-2 py-0.5 bg-orange-50 rounded-lg">{product.category}</span>
                      <h3 className="font-black text-slate-900 leading-tight mb-1 group-hover:text-orange-600 transition-colors truncate mt-1">{product.name}</h3>
                      <p className="text-sm font-black text-slate-900">R$ {product.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex gap-1">
                        <button onClick={() => handleOpenModal(product)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                        <button onClick={() => handleDuplicateProduct(product)} className="p-2.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"><Copy size={16} /></button>
                        <button onClick={async () => { if(confirm('Excluir este item?')) { await deleteProduct(product.id!); loadProducts(); } }} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl relative z-10 animate-scale-in max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-8 md:p-10 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-3xl font-black text-slate-900">{editingProduct ? 'Editar' : 'Novo'} Item</h2>
                    <p className="text-slate-400 font-bold text-sm">Configure a visibilidade e os detalhes do seu item.</p>
                </div>
                <div className="flex items-center gap-6">
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Visível no Cardápio</span>
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, active: !formData.active})}
                        className={`w-14 h-8 rounded-full relative transition-all flex items-center px-1 ${formData.active ? 'bg-green-500' : 'bg-slate-200'}`}
                      >
                         <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all ${formData.active ? 'translate-x-6' : 'translate-x-0'}`}></div>
                      </button>
                   </label>
                   <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"><X size={20} /></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-10 no-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-12">
                {/* Seção de Modelos Rápidos */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2 text-orange-500 mb-4">
                      <Wand2 size={20} />
                      <h3 className="font-black uppercase tracking-widest text-xs">Modelos Rápidos</h3>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {DISH_TEMPLATES.map((tpl, i) => (
                        <button key={i} type="button" onClick={() => applyTemplate(tpl)} className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] hover:border-orange-500 hover:bg-orange-50 transition-all group">
                           <span className="text-3xl group-hover:scale-110 transition-transform">{tpl.icon}</span>
                           <div className="text-left">
                              <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{tpl.label}</p>
                              <p className="text-[10px] text-slate-400 font-bold">Auto-preencher formulário</p>
                           </div>
                        </button>
                      ))}
                   </div>
                </div>

                {/* Dados Básicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Nome do Prato/Produto</label>
                    <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-orange-500 font-bold outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Marmita de Bife Acebolado" />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-black text-slate-400 uppercase">Descrição Curta</label>
                    </div>
                    <textarea required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-orange-500 font-bold outline-none h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Descreva os ingredientes principais..." />
                  </div>

                  {/* NOVO: Disponibilidade por Dia da Semana */}
                  <div className="md:col-span-2 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200">
                    <div className="flex items-center gap-3 mb-6 text-slate-700">
                      <Calendar size={20} className="text-orange-500" />
                      <h3 className="font-black uppercase tracking-widest text-xs">Disponibilidade Semanal</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {WEEK_DAYS.map(day => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`w-14 h-14 rounded-2xl font-black text-xs transition-all border-2 flex flex-col items-center justify-center gap-1 ${
                            formData.availableDays.includes(day.value) 
                            ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          {day.label}
                          {formData.availableDays.includes(day.value) && <Check size={12} className="text-orange-500" />}
                        </button>
                      ))}
                    </div>
                    <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      O item aparecerá automaticamente no cardápio apenas nos dias selecionados acima.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Link da Imagem</label>
                    <div className="flex flex-col gap-4">
                      <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-orange-500 font-bold outline-none" placeholder="https://..." value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                      <div className="h-40 w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden">
                        {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <Camera size={24} className="text-slate-300" />}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">Preço Base (R$)</label>
                      <input required type="number" step="0.01" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-orange-500 font-bold outline-none text-xl" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0,00" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">Categoria</label>
                      <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-orange-500 font-bold outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        <option value="Marmitas">🍱 Marmitas</option>
                        <option value="Bebidas">🥤 Bebidas</option>
                        <option value="Sobremesas">🍩 Sobremesas</option>
                        <option value="Outros">📦 Outros</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Personalização / Opções */}
                <div className="space-y-8 pt-10 border-t border-slate-100">
                  <div className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100">
                    <div className="flex items-center gap-3 mb-6 text-orange-600">
                      <Zap size={20} className="fill-orange-600" />
                      <h3 className="font-black uppercase tracking-widest text-xs">Presets Rápidos de Grupos</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {PRESET_GROUPS.map((preset, idx) => (
                        <button key={idx} type="button" onClick={() => applyPresetGroup(preset)} className="flex flex-col items-center gap-2 p-4 bg-white border border-orange-200 rounded-2xl hover:shadow-lg hover:border-orange-400 transition-all group">
                          <span className="text-3xl group-hover:scale-125 transition-transform">{preset.icon}</span>
                          <span className="text-[10px] font-black text-slate-600 uppercase text-center">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center px-2">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Grupos de Personalização</h3>
                      <p className="text-sm font-medium text-slate-500">O que o cliente pode escolher nesta marmita?</p>
                    </div>
                    <button type="button" onClick={addOptionGroup} className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-black transition-all">
                      <PlusCircle size={16} /> Novo Grupo Manual
                    </button>
                  </div>

                  <div className="space-y-6">
                    {formData.optionsGroups.map((group, gIdx) => (
                      <div key={group.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 space-y-6 animate-fade-in relative group/card">
                        <button type="button" onClick={() => removeGroup(group.id)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/card:opacity-100"><Trash2 size={20} /></button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="md:col-span-1">
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Título do Grupo</label>
                              <input className="w-full px-5 py-3 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-orange-500" value={group.name} onChange={e => updateGroup(group.id, { name: e.target.value })} placeholder="Ex: Escolha o acompanhamento" />
                           </div>
                           <div className="flex gap-4">
                              <div className="flex-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Mínimo</label>
                                <input type="number" className="w-full px-5 py-3 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-orange-500" value={group.min} onChange={e => updateGroup(group.id, { min: parseInt(e.target.value) })} />
                              </div>
                              <div className="flex-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Máximo</label>
                                <input type="number" className="w-full px-5 py-3 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-orange-500" value={group.max} onChange={e => updateGroup(group.id, { max: parseInt(e.target.value) })} />
                              </div>
                           </div>
                           <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Preço Extra por Item (R$)</label>
                              <input type="number" step="0.01" className="w-full px-5 py-3 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-orange-500" value={group.extraPricePerItem || 0} onChange={e => updateGroup(group.id, { extraPricePerItem: parseFloat(e.target.value) })} />
                           </div>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-slate-400 uppercase px-1">Itens Disponíveis</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {group.items.map((item, iIdx) => (
                              <div key={iIdx} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 relative group/opt">
                                <button type="button" onClick={() => updateGroup(group.id, { items: group.items.filter((_, i) => i !== iIdx) })} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/opt:opacity-100"><X size={14} /></button>
                                
                                <div className="space-y-2">
                                  <label className="block text-[8px] font-black text-slate-400 uppercase">Nome</label>
                                  <input className="w-full px-3 py-2 rounded-lg border border-slate-100 text-xs font-bold focus:border-orange-500 outline-none" value={item.name} onChange={e => updateOptionItem(group.id, iIdx, { name: e.target.value })} placeholder="Nome do item" />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-2">
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-tighter truncate">Preço Adic. (R$)</label>
                                    <input type="number" step="0.01" className="w-full px-3 py-2 rounded-lg border border-slate-100 text-xs font-bold focus:border-orange-500 outline-none" value={item.price || ''} onChange={e => updateOptionItem(group.id, iIdx, { price: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="block text-[8px] font-black text-slate-400 uppercase">Imagem do Item</label>
                                    <div className="flex gap-2">
                                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                        {item.imageUrl ? (
                                          <img 
                                            src={formatImageUrl(item.imageUrl)!} 
                                            className="w-full h-full object-cover" 
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40?text=?'; }}
                                          />
                                        ) : (
                                          <ImageIcon size={16} className="text-slate-300" />
                                        )}
                                      </div>
                                      <div className="flex-1 space-y-1">
                                        <select 
                                          className="w-full px-3 py-2 rounded-lg border border-slate-100 text-[10px] font-bold focus:border-orange-500 outline-none bg-white"
                                          value={AVAILABLE_ASSETS.includes(item.imageUrl || '') ? item.imageUrl : ''}
                                          onChange={e => updateOptionItem(group.id, iIdx, { imageUrl: e.target.value })}
                                        >
                                          <option value="">{item.imageUrl && !AVAILABLE_ASSETS.includes(item.imageUrl) ? '-- Link Externo --' : 'Selecionar da Pasta'}</option>
                                          {Object.entries(GROUPED_ASSETS).map(([category, assets]) => (
                                            <optgroup key={category} label={category}>
                                              {assets.map(asset => (
                                                <option key={asset} value={asset}>{asset.replace('.png', '').replace(/-/g, ' ')}</option>
                                              ))}
                                            </optgroup>
                                          ))}
                                          <option value="CUSTOM">-- Outro (Link Manual) --</option>
                                        </select>
                                        
                                        {(!AVAILABLE_ASSETS.includes(item.imageUrl || '') || item.imageUrl === 'CUSTOM') && (
                                          <input 
                                            className="w-full px-3 py-1.5 mt-1 rounded-lg border border-slate-100 text-[9px] font-bold focus:border-orange-500 outline-none" 
                                            value={item.imageUrl === 'CUSTOM' ? '' : item.imageUrl || ''} 
                                            onChange={e => updateOptionItem(group.id, iIdx, { imageUrl: e.target.value })} 
                                            placeholder="Cole o link aqui..."
                                          />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <button type="button" onClick={() => addOptionItem(group.id)} className="px-4 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 hover:border-orange-400 hover:text-orange-500 transition-all flex flex-col items-center justify-center gap-2 bg-white">
                               <Plus size={18} /> Nova Opção
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            <div className="p-8 md:p-10 border-t border-slate-100 bg-slate-50/50 shrink-0">
               <div className="flex gap-4 max-w-xl mx-auto">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-white text-slate-500 font-black rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all">Cancelar</button>
                  <button type="button" onClick={handleSubmit} className="flex-1 py-5 bg-orange-500 text-white font-black rounded-2xl shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <Save size={20} /> Salvar Item
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default AdminProducts;
