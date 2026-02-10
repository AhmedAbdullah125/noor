// src/pages/LoginPage.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Phone, Lock } from "lucide-react";
import { loginRequest } from "../services/loginRequest";
import { getRefreshToken } from "./authStorage";
import { refreshToken } from "../services/refreshToken";
import { translations, Locale, getLang } from "../../services/i18n";

interface LoginPageProps {
  onLoginSuccess: () => void;
  lang?: Locale;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, lang: propLang }) => {
  const lang = propLang || getLang();
  const navigate = useNavigate();
  const location = useLocation();
  const t = translations[lang] || translations['ar'];

  const from = (location.state as any)?.from || "/";

  const [formData, setFormData] = useState({ phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // ✅ Auto refresh if refresh_token exists
  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const rt = getRefreshToken?.();
      if (!rt) {
        if (mounted) setCheckingSession(false);
        return;
      }

      const r = await refreshToken(lang);
      if (!mounted) return;

      if (r.ok) {
        onLoginSuccess();
        navigate(from, { replace: true });
        return;
      }

      // refresh failed -> show login form
      setCheckingSession(false);
    };

    run();

    return () => {
      mounted = false;
    };
  }, [lang, navigate, from, onLoginSuccess]);

  // Convert Arabic-Indic numerals (٠-٩) to English numerals (0-9)
  const convertArabicToEnglishNumbers = (str: string): string => {
    const arabicToEnglish: { [key: string]: string } = {
      '٠': '0',
      '١': '1',
      '٢': '2',
      '٣': '3',
      '٤': '4',
      '٥': '5',
      '٦': '6',
      '٧': '7',
      '٨': '8',
      '٩': '9',
    };
    return str.replace(/[٠-٩]/g, (digit) => arabicToEnglish[digit] || digit);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Convert Arabic numerals to English for phone field
    if (e.target.name === 'phone') {
      value = convertArabicToEnglishNumbers(value);
    }

    setFormData((p) => ({ ...p, [e.target.name]: value }));
    setError(null);
  };

  const handleLogin = async () => {
    setError(null);

    if (!formData.phone || !formData.password) {
      setError(t.enterPhonePassword);
      return;
    }

    const res = await loginRequest(formData, setLoading, lang);

    if (!res.ok) {
      setError(res.error || t.loginError);
      return;
    }

    onLoginSuccess();
    navigate(from, { replace: true });
  };

  if (checkingSession) {
    return (
      <div className="flex flex-col h-full bg-app-bg relative font-active overflow-hidden min-h-screen items-center justify-center">
        <div className="bg-white border border-app-card/50 rounded-2xl px-6 py-4 shadow-sm text-app-text">
          {t.checkingSession}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-app-bg relative font-active overflow-hidden min-h-screen" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-12 pb-10 flex flex-col justify-center">
        <div className="text-center mb-10">
          <h1 className="text-xl font-semibold text-app-text mb-2">{t.loginTitle}</h1>
          <p className="text-sm text-app-textSec">{t.welcomeBack}</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="relative">
            <input
              type="tel"
              name="phone"
              placeholder={t.phone}
              className="w-full p-4 pr-12 rounded-2xl border border-app-card/50 bg-white outline-none focus:border-app-gold text-start text-app-text placeholder:text-app-textSec/50"
              value={formData.phone}
              onChange={handleChange}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            />
            <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-app-textSec/50" size={20} />
          </div>

          <div className="relative">
            <input
              type="password"
              name="password"
              placeholder={t.password}
              className="w-full p-4 pr-12 rounded-2xl border border-app-card/50 bg-white outline-none focus:border-app-gold text-start text-app-text placeholder:text-app-textSec/50"
              value={formData.password}
              onChange={handleChange}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            />
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-app-textSec/50" size={20} />
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-xs font-semibold text-center mb-6 bg-red-50 py-2 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform mb-6 disabled:opacity-60 disabled:active:scale-100"
        >
          {loading ? t.loggingIn : t.signIn}
        </button>

        <button
          onClick={() => navigate("/signup")}
          className="w-full text-app-textSec text-sm font-normal underline decoration-app-textSec/30 underline-offset-4 active:opacity-70"
        >
          {t.noAccount}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
