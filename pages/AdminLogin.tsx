
import React, { useState } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../firebase-config';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Smartphone, Eye, EyeOff, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');
    
    try {
      // Configura persistência baseado na escolha do usuário
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin');
    } catch (err: any) {
      console.error("Erro de login:", err.code);
      
      // Mensagens de erro amigáveis baseadas no código do Firebase
      switch (err.code) {
        case 'auth/invalid-email':
          setError('O formato do e-mail é inválido.');
          break;
        case 'auth/user-not-found':
          setError('Este e-mail não está cadastrado.');
          break;
        case 'auth/wrong-password':
          setError('Senha incorreta. Tente novamente.');
          break;
        case 'auth/invalid-credential':
          setError('E-mail ou senha incorretos.');
          break;
        case 'auth/too-many-requests':
          setError('Muitas tentativas falhas. Tente novamente mais tarde.');
          break;
        default:
          setError('Ocorreu um erro ao tentar entrar. Verifique sua conexão.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 selection:bg-orange-500 selection:text-white">
      {/* Botão de Sair/Voltar para a Loja */}
      <div className="absolute top-8 left-8">
        <Link 
          to="/" 
          className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all font-black text-xs uppercase tracking-widest border border-white/10"
        >
          <ArrowLeft size={16} /> Sair do Painel
        </Link>
      </div>

      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-orange-500/20 mx-auto mb-6 animate-float">
            <Smartphone size={40} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Painel de Controle</h1>
          <p className="text-slate-400 font-medium mt-2">Gestão em tempo real da sua marmitaria</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Administrativo</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
                <input 
                  required
                  type="email" 
                  autoFocus
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-orange-400 focus:bg-white transition-all font-bold text-slate-700"
                  placeholder="admin@exemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Sua Senha</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
                <input 
                  required
                  type={showPassword ? "text" : "password"} 
                  className="w-full pl-14 pr-14 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-orange-400 focus:bg-white transition-all font-bold text-slate-700"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                  />
                  <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${rememberMe ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/30' : 'bg-slate-50 border-slate-200'}`}>
                    {rememberMe && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                </div>
                <span className="text-sm font-black text-slate-500 group-hover:text-slate-700 transition-colors">Manter conectado</span>
              </label>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-shake">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-xs font-black uppercase tracking-tight">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-slate-900 hover:bg-black text-white font-black rounded-2xl transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>Acessar Painel</span>
              )}
            </button>
          </form>
        </div>
        
        <p className="mt-10 text-center text-slate-500 font-bold text-sm">
          Acesso exclusivo para administradores da <br/>
          <span className="text-orange-500">Marmita Express</span>
        </p>
      </div>

      <style>{`
        @keyframes scale-in { 
          from { transform: scale(0.95); opacity: 0; } 
          to { transform: scale(1); opacity: 1; } 
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-scale-in { animation: scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

export default AdminLogin;
