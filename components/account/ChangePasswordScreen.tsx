import React, { useState } from "react";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import AppHeader from "../AppHeader";
import { changePasswordRequest } from "../services/changePassword";
import { translations, getLang } from "../../services/i18n";

type Props = {
  onBack: () => void;
  onSuccess?: () => void;
};

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  name,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  name?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-semibold text-app-text mb-2">{label}</label>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-app-textSec/40" size={18} />
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir="ltr"
          className="w-full pl-11 pr-12 py-4 bg-app-bg border border-app-card/50 rounded-2xl outline-none focus:border-app-gold text-start font-semibold text-app-text placeholder:text-app-textSec/40 placeholder:font-normal"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-app-textSec/40 hover:text-app-textSec transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordScreen({ onBack, onSuccess }: Props) {
  const lang = getLang();
  const t = translations[lang] || translations["ar"];
  const isRtl = lang === "ar";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t.fillAllFields);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    const res = await changePasswordRequest(
      {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      },
      setLoading,
      lang
    );

    if (!res.ok) {
      setError(res.error || t.changePasswordError);
      return;
    }

    setSuccess(true);
  };

  return (
    <div
      className="animate-fadeIn flex flex-col h-full bg-app-bg"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <AppHeader title={t.changePassword} onBack={onBack} />

      <div className=" overflow-y-auto no-scrollbar px-6 pt-24 pb-10">
        {success ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center justify-center h-full gap-4 pb-10">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center shadow-sm">
              <ShieldCheck size={40} className="text-green-500" strokeWidth={1.5} />
            </div>
            <p className="text-app-text font-semibold text-base text-center">
              {t.changePasswordSuccess}
            </p>
            <button
              onClick={onBack}
              className="mt-2 w-full max-w-xs bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform"
            >
              {t.back}
            </button>
          </div>
        ) : (
          <>
            {/* ── Form ── */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30 space-y-5 mb-6">
              <PasswordField
                label={t.currentPassword}
                value={currentPassword}
                onChange={(v) => { setCurrentPassword(v); setError(null); }}
                placeholder="••••••••"
                name="current_password"
              />
              <PasswordField
                label={t.newPassword}
                value={newPassword}
                onChange={(v) => { setNewPassword(v); setError(null); }}
                placeholder="••••••••"
                name="password"
              />
              <PasswordField
                label={t.confirmPassword}
                value={confirmPassword}
                onChange={(v) => { setConfirmPassword(v); setError(null); }}
                placeholder="••••••••"
                name="password_confirmation"
              />
            </div>

            {error && (
              <div className="text-red-500 text-xs font-semibold text-center mb-5 bg-red-50 py-2.5 rounded-xl border border-red-100">
                {error}
              </div>
            )}
          </>
        )}
      </div>

      {!success && (
        <div className="p-6 border-t border-app-card/30">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-60 disabled:active:scale-100"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck size={20} />
                <span>{t.changePasswordSubmit}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
