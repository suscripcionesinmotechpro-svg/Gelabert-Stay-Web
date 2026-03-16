import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.tsx';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Lock } from 'lucide-react';

export const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    // Forzar siempre español en el login administrativo
    if (i18n.language !== 'es') {
      i18n.changeLanguage('es');
    }
  }, [i18n]);

  useEffect(() => {
    if (user) {
      navigate(`/admin/dashboard`);
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('admin.login.errors.missing_fields'));
      return;
    }
    setLoading(true);
    setError(null);
    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
    } else {
      navigate(`/admin/dashboard`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 relative">
      {/* Top Bar Switcher */}
      {/* LanguageSwitcher removed */}

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10 gap-3">
          <h1 className="font-secondary text-4xl text-[#C9A962] tracking-widest drop-shadow-sm">Gelabert Stay</h1>
          <p className="font-primary text-[#666666] text-xs tracking-[0.3em] uppercase">Panel de Administración</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#161616] border border-[#1F1F1F] p-8 flex flex-col gap-6"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-[#1F1F1F]">
            <Lock className="w-5 h-5 text-[#C9A962]" />
            <h2 className="font-primary text-[#FAF8F5] font-bold text-lg tracking-tight">Acceso Privado</h2>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 px-4 py-3">
              <p className="font-primary text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="font-primary text-[#888888] text-[10px] uppercase tracking-[0.2em]">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@gelabertstay.es"
              className="h-12 bg-[#0A0A0A] border border-[#1F1F1F] px-4 font-primary text-[#FAF8F5] outline-none focus:border-[#C9A962] transition-all text-sm rounded-none"
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-primary text-[#888888] text-[10px] uppercase tracking-[0.2em]">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 bg-[#0A0A0A] border border-[#1F1F1F] px-4 pr-12 font-primary text-[#FAF8F5] outline-none focus:border-[#C9A962] transition-all text-sm rounded-none"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#C9A962] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-12 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#D4B673] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2 rounded-none"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
                VERIFICANDO...
              </>
            ) : "Entrar al Panel"}
          </button>
        </form>

        <p className="text-center font-primary text-[#444444] text-[10px] mt-8 uppercase tracking-widest opacity-60">
          Solo acceso para administradores autorizados
        </p>
      </div>
    </div>
  );
};
