
import React, { useState, useEffect } from 'react';
import { getAllProducts, addProduct, updateProduct, deleteProduct } from '../services/database';
import { Product, OptionGroup, OptionItem } from '../types';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, X, ImageIcon, Info, ExternalLink, Minus, Wand2, Calendar
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { useToast } from '../components/Toast';

// Novos componentes refatorados
import AdminProductCard from '../components/Admin/AdminProductCard';
import AdminProductModal from '../components/Admin/AdminProductModal';

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

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(true);
  const { showToast } = useToast();
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

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar produtos', 'error');
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
    setFormData((prev: any) => {
      const days = prev.availableDays || [];
      if (days.includes(dayValue)) {
        return { ...prev, availableDays: days.filter((d: number) => d !== dayValue) };
      }
      return { ...prev, availableDays: [...days, dayValue] };
    });
  };

  const applyTemplate = (template: typeof DISH_TEMPLATES[0]) => {
    setFormData((prev: any) => ({
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
    if (!formData.name || !formData.price) return showToast('Nome e Preço são obrigatórios', 'error');

    const payload = {
      ...formData,
      price: parseFloat(formData.price)
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id!, payload);
        showToast('Produto atualizado com sucesso!');
      } else {
        await addProduct(payload);
        showToast('Produto criado com sucesso!');
      }
      setIsModalOpen(false);
      loadProducts();
    } catch (err) {
      showToast('Erro ao salvar produto.', 'error');
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await updateProduct(product.id!, { active: !product.active });
      loadProducts();
      showToast(product.active ? 'Produto desativado' : 'Produto ativado');
    } catch (err) {
      showToast('Erro ao atualizar status', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      loadProducts();
      showToast('Produto removido com sucesso!');
    } catch (err) {
      showToast('Erro ao remover produto', 'error');
    }
  };

  return (
    <AdminLayout>
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 font-outfit">Seus Produtos</h2>
            <p className="text-slate-500 font-medium font-outfit">Gerencie seu cardápio, categorias e promoções</p>
          </div>
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
             <button 
                onClick={() => setShowTutorial(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white text-slate-900 rounded-2xl font-black border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
              >
                <Info size={20} className="text-orange-500" /> Tutorial
              </button>
              <button 
                onClick={() => handleOpenModal()}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 text-white rounded-2xl font-black shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all"
              >
                <Plus size={20} /> Novo Produto
              </button>
          </div>
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
                <AdminProductCard 
                  key={product.id}
                  product={product}
                  onEdit={handleOpenModal}
                  onDuplicate={handleDuplicateProduct}
                  onDelete={handleDeleteProduct}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </div>
          )}
        </div>

      {isModalOpen && (
        <AdminProductModal 
          editingProduct={editingProduct}
          formData={formData}
          setFormData={setFormData}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          toggleDay={toggleDay}
          applyTemplate={applyTemplate}
          applyPresetGroup={applyPresetGroup}
          addOptionGroup={addOptionGroup}
          updateGroup={updateGroup}
          removeGroup={removeGroup}
          addOptionItem={addOptionItem}
          updateOptionItem={updateOptionItem}
          formatImageUrl={formatImageUrl}
          WEEK_DAYS={WEEK_DAYS}
          DISH_TEMPLATES={DISH_TEMPLATES}
          PRESET_GROUPS={PRESET_GROUPS}
          GROUPED_ASSETS={GROUPED_ASSETS}
          AVAILABLE_ASSETS={AVAILABLE_ASSETS}
        />
      )}

      <style>{`
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </AdminLayout>
  );
};

export default AdminProducts;
