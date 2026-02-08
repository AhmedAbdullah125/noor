// src/pages/SignUpPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, Lock } from "lucide-react";
import { registerRequest } from "../services/register";
import { translations, Locale, getLang } from "../../services/i18n";

interface SignUpPageProps {
  onLoginSuccess?: () => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onLoginSuccess }) => {
  const lang = getLang();
  const navigate = useNavigate();
  const t = translations[lang] || translations['ar'];

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.password || !formData.confirmPassword) {
      setError(t.fillAllFields);
      return;
    }
    if (!/^\+?\d{8,}$/.test(formData.phone)) {
      setError(t.phoneValidation);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    // Call register API
    const res = await registerRequest(
      { name: formData.name, phone: formData.phone, password: formData.password },
      setLoading,
      lang
    );

    if (!res.ok) {
      setError(res.error || t.registerFailed);
      return;
    }

    // Navigate to OTP page after successful registration
    navigate("/verify", {
      state: {
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
      },
    });
  };

  const handleGuestLogin = () => {
    onLoginSuccess?.();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex flex-col h-full bg-app-bg relative font-active overflow-hidden min-h-screen" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-12 pb-10 flex flex-col justify-center">
        <div className="text-center mb-10">
          <h1 className="text-xl font-semibold text-app-text mb-2">{t.createAccountTitle}</h1>
          <p className="text-sm text-app-textSec">{t.createAccountSubtitle}</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="relative">
            <input
              type="text"
              name="name"
              placeholder={t.name}
              className="w-full p-4 pr-12 rounded-2xl border border-app-card/50 bg-white outline-none focus:border-app-gold text-start text-app-text placeholder:text-app-textSec/50"
              value={formData.name}
              onChange={handleChange}
            />
            <User className="absolute right-4 top-1/2 -translate-y-1/2 text-app-textSec/50" size={20} />
          </div>

          <div className="relative">
            <input
              type="tel"
              name="phone"
              placeholder={t.phone}
              className="w-full p-4 pr-12 rounded-2xl border border-app-card/50 bg-white outline-none focus:border-app-gold text-start text-app-text placeholder:text-app-textSec/50"
              value={formData.phone}
              onChange={handleChange}
              dir="ltr"
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
              dir="ltr"
            />
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-app-textSec/50" size={20} />
          </div>

          <div className="relative">
            <input
              type="password"
              name="confirmPassword"
              placeholder={t.confirmPassword}
              className="w-full p-4 pr-12 rounded-2xl border border-app-card/50 bg-white outline-none focus:border-app-gold text-start text-app-text placeholder:text-app-textSec/50"
              value={formData.confirmPassword}
              onChange={handleChange}
              dir="ltr"
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
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform disabled:opacity-60 disabled:active:scale-100 mb-6"
        >
          {loading ? t.registering : t.createAccountTitle}
        </button>

        <button
          onClick={() => navigate("/login")}
          className="w-full text-app-textSec text-sm font-normal underline decoration-app-textSec/30 underline-offset-4 active:opacity-70 mb-4"
        >
          {t.haveAccount}
        </button>

        <button
          onClick={handleGuestLogin}
          className="w-full border border-app-gold text-app-gold font-semibold py-4 rounded-2xl active:bg-app-gold/5 transition-colors"
        >
          {t.guestLogin}
        </button>
      </div>
    </div>
  );
};

export default SignUpPage;
