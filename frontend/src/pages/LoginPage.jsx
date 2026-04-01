import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAPI } from '../api';
import { LogIn, Building2, User, Lock, Activity, ShieldCheck, Zap } from 'lucide-react';

export default function LoginPage({ setAuthData }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [empresaId, setEmpresaId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Preparaciones extras en mount de ser necesarias
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await loginAPI(username, password, empresaId || undefined);
      if (res.data.access_token) {
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('empresa_id', res.data.user.empresa_id || '');
        localStorage.setItem('user_role', res.data.user.role);
        localStorage.setItem('username', res.data.user.username);
        // Guardar módulos como JSON string stringificado
        localStorage.setItem('modules', JSON.stringify(res.data.user.modules || []));
        
        setAuthData({
          isAuthenticated: true,
          user: res.data.user
        });
        
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Credenciales inválidas o error de red');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200 flex items-center justify-center p-4 relative overflow-hidden bg-grid">
      
      {/* Efectos de Blur Decorativos de Fondo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] right-[0%] w-[40%] h-[60%] bg-emerald-600/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-fade-up">
        {/* Logo / Título Principal fuera de la tarjeta para diseño más limpio */}
        <div className="text-center mb-8 animate-stagger">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 mb-4 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-white/5 backdrop-blur-sm relative">
             <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-md"></div>
             <Activity className="h-7 w-7 text-blue-400 relative z-10" />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-white mb-2">CXP Dashboard</h1>
          <p className="text-slate-400 tracking-wide text-sm font-medium">Plataforma Segura de Contabilidad</p>
        </div>

        {/* Tarjeta de Login (Glassmorphism) */}
        <div className="card-hover p-8 sm:p-10 space-y-6 animate-stagger">
          
          <form onSubmit={handleLogin} className="space-y-6">
            
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl flex items-start gap-3 text-sm animate-fade-up shadow-sm">
                <ShieldCheck className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-5">
              {/* Campo Usuario */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-widest mb-1.5 ml-1">
                  Usuario
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4.5 w-4.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    className="pl-10 w-full bg-slate-900/60 border border-slate-700/60 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all placeholder-slate-500 backdrop-blur-sm hover:border-slate-600"
                    placeholder="admin o nombre de usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-widest mb-1.5 ml-1">
                  Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4.5 w-4.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    className="pl-10 w-full bg-slate-900/60 border border-slate-700/60 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all placeholder-slate-500 backdrop-blur-sm hover:border-slate-600"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Campo ID Empresa */}
              <div>
                 <label className="block text-xs font-semibold text-slate-300 uppercase tracking-widest mb-1.5 ml-1 flex justify-between items-center">
                  <span>ID Empresa</span>
                  <span className="text-slate-500 font-normal lowercase tracking-normal text-[11px] bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">Opcional</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Building2 className="h-4.5 w-4.5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    className="pl-10 w-full bg-slate-900/60 border border-slate-700/60 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all placeholder-slate-600 backdrop-blur-sm hover:border-slate-600"
                    placeholder="Dejar vacío si eres admin"
                    value={empresaId}
                    onChange={(e) => setEmpresaId(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full relative group overflow-hidden flex justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-all duration-300 active:scale-[0.98] ${loading ? 'opacity-80 cursor-wait' : ''}`}
            >
              {/* Brillo dinámico hover */}
              <div className="absolute top-0 -left-[100%] h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:left-[150%] transition-all duration-700 ease-in-out" />
              
              {loading ? (
                <span className="flex items-center gap-2 relative z-10">
                  <svg className="animate-spin h-4.5 w-4.5 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando Acceso...
                </span>
              ) : (
                <span className="flex items-center gap-2 relative z-10 tracking-wide">
                  Iniciar Sesión <Zap className="h-4.5 w-4.5 text-blue-200" />
                </span>
              )}
            </button>
            
          </form>
          
        </div>
        
        {/* Footer info texto */}
        <p className="text-center text-slate-500 text-xs mt-6 mb-2">
          &copy; {new Date().getFullYear()} Soluciones INGECM. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}

