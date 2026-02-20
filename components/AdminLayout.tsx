
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase-config';
import { 
  LayoutDashboard, ClipboardList, ShoppingBag, PieChart, Settings2, 
  LogOut, Menu, X, Eye, ChefHat 
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeOrdersCount?: number;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeOrdersCount = 0 }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/admin/login');
        return;
      }

      // Verifica se o usuário entrou via email e senha (provedor de admin)
      // No modelo White Label, qualquer conta criada no Auth via Email/Senha é Admin
      const isPasswordProvider = user.providerData.some(p => p.providerId === 'password');
      
      if (!isPasswordProvider) {
        // Se não for admin (ex: cliente logado com Google), desloga e manda pra login
        signOut(auth).then(() => navigate('/admin/login'));
        return;
      }

      setIsVerifying(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/orders', icon: ClipboardList, label: 'Pedidos', badge: activeOrdersCount },
    { path: '/admin/products', icon: ShoppingBag, label: 'Produtos' },
    { path: '/admin/finances', icon: PieChart, label: 'Financeiro' },
    { path: '/admin/settings', icon: Settings2, label: 'Configurações' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/admin/login');
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  if (isVerifying) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="text-white font-black text-xs uppercase tracking-[0.2em] animate-pulse">Verificando Acesso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-lg">Sabor<span className="text-orange-500">Admin</span></span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-50 transform transition-transform duration-300 md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col shrink-0
      `}>
        <div className="p-6 border-b border-slate-800 hidden md:block">
          <h1 className="text-xl font-black flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
              <img src="/logo.png" alt="Sabor de Casa Logo" className="w-full h-full object-cover" />
            </div>
            Sabor<span className="text-orange-500">Admin</span>
          </h1>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.path}
                to={item.path} 
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-3 p-4 rounded-2xl transition-all font-bold
                  ${isActive 
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'}
                `}
              >
                <Icon size={20} /> 
                {item.label}
                {item.badge ? (
                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-orange-500' : 'bg-orange-500 text-white'}`}>
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
          
          <Link to="/" className="flex items-center gap-3 p-4 rounded-2xl text-orange-400 hover:bg-orange-500/10 transition-all font-bold mt-10">
            <Eye size={20} /> Ver Loja
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 p-4 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all font-bold text-left">
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto no-scrollbar max-w-full">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
