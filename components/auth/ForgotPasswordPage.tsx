// src/pages/ForgotPasswordPage.tsx
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, ArrowLeft } from "lucide-react";
import { forgotPasswordRequest, resetPasswordRequest } from "../services/forgotPassword";
import { translations, Locale, getLang } from "../../services/i18n";
import CountryCodeSelect from "./CountryCodeSelect";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";

interface ForgotPasswordPageProps {
  lang?: Locale;
}



const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  lang: propLang,
}) => {
  const lang = propLang || getLang();
  const navigate = useNavigate();
  const t = translations[lang] || translations["ar"];

  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+965");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [complete, setComplete] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);

  const isRtl = lang === "ar";

  // Convert Arabic-Indic numerals (٠-٩) to English numerals (0-9)
  const convertArabicToEnglishNumbers = (str: string): string => {
    const arabicToEnglish: { [key: string]: string } = {
      "٠": "0",
      "١": "1",
      "٢": "2",
      "٣": "3",
      "٤": "4",
      "٥": "5",
      "٦": "6",
      "٧": "7",
      "٨": "8",
      "٩": "9",
    };
    return str.replace(/[٠-٩]/g, (digit) => arabicToEnglish[digit] || digit);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = convertArabicToEnglishNumbers(e.target.value);
    setPhone(value);
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!phone) {
      setError(t.forgotPasswordPhoneRequired);
      return;
    }

    const res = await forgotPasswordRequest(
      { phone, country_code: countryCode },
      setLoading,
      lang
    );

    if (!res.ok) {
      setError(res.error || t.forgotPasswordError);
      return;
    }

    setSuccess(true);
  };

  const handleReset = async (code = resetCode, password = newPassword) => {
    setError(null);
    if (!/^\d{4}$/.test(code) || password.length < 8) {
      setError(lang === "ar" ? "أدخلي رمزاً من 4 أرقام وكلمة مرور من 8 أحرف على الأقل" : "Enter the 4-digit code and a password of at least 8 characters.");
      return;
    }
    // The OTP fires this automatically on its last digit, so guard against a
    // second in-flight submit if the button is tapped at the same moment.
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const res = await resetPasswordRequest({ phone, country_code: countryCode, code, password }, setLoading, lang);
      if (!res.ok) { setError(res.error || t.forgotPasswordError); return; }
      setComplete(true);
    } finally {
      submittingRef.current = false;
    }
  };

  const handleCodeChange = (value: string) => {
    const code = convertArabicToEnglishNumbers(value).replace(/\D/g, "").slice(0, 4);
    setResetCode(code);
    setError(null);
    if (code.length !== 4) return;
    // Submit as soon as the code is complete; if the password is still missing
    // there is nothing to send yet, so send the user there instead.
    if (newPassword.length >= 8) handleReset(code, newPassword);
    else passwordRef.current?.focus();
  };

  return (
    <div
      className="flex flex-col h-full bg-app-bg relative font-active overflow-hidden min-h-screen"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-12 pb-10 flex flex-col justify-center">
        {/* Back button */}
        <button
          onClick={() => navigate("/login")}
          className="absolute top-6 left-6 flex items-center gap-1 text-app-textSec text-sm active:opacity-70"
          style={{ left: isRtl ? "auto" : "1.5rem", right: isRtl ? "1.5rem" : "auto" }}
        >
          <ArrowLeft
            size={18}
            style={{ transform: isRtl ? "rotate(180deg)" : "none" }}
          />
          <span>{t.back}</span>
        </button>

        <div className="text-center mb-10">
          <h1 className="text-xl font-semibold text-app-text mb-2">
            {t.forgotPasswordTitle}
          </h1>
          <p className="text-sm text-app-textSec">{t.forgotPasswordSubtitle}</p>
        </div>

        {complete ? (
          /* Success state */
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-app-text font-medium">{lang === "ar" ? "تم تغيير كلمة المرور بنجاح" : "Your password has been reset."}</p>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform mt-4"
            >
              {t.backToLogin}
            </button>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <p className="text-center text-app-textSec">{lang === "ar" ? "أدخل كلمة المرور الجديدة ثم الرمز المرسل إليك." : "Enter your new password, then the code we sent."}</p>
            <div className="flex justify-center pt-2" dir="ltr">
              <InputOTP maxLength={4} value={resetCode} onChange={handleCodeChange} disabled={loading}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <input ref={passwordRef} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder={lang === "ar" ? "كلمة المرور الجديدة" : "New password"} className="w-full p-4 rounded-2xl border border-app-card/50 bg-white outline-none focus:border-app-gold text-app-text" />


            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <button onClick={() => handleReset()} disabled={loading} className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl disabled:opacity-60">{loading ? t.forgotPasswordSending : (lang === "ar" ? "تغيير كلمة المرور" : "Reset password")}</button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {/* Phone + country code row */}
              <div className="flex gap-2" dir="ltr">
                <CountryCodeSelect
                  value={countryCode}
                  onChange={setCountryCode}
                  searchPlaceholder={isRtl ? 'بحث...' : 'Search...'}
                />

                <div className="relative flex-1">
                  <input
                    type="tel"
                    name="phone"
                    placeholder={t.phone}
                    className="w-full p-4 pr-12 rounded-2xl border border-app-card/50 bg-white outline-none focus:border-app-gold text-start text-app-text placeholder:text-app-textSec/50"
                    value={phone}
                    onChange={handlePhoneChange}
                    dir={isRtl ? "rtl" : "ltr"}
                  />
                  <Phone
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-app-textSec/50"
                    size={20}
                  />
                </div>
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
              className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform mb-6 disabled:opacity-60 disabled:active:scale-100"
            >
              {loading ? t.forgotPasswordSending : t.forgotPasswordSubmit}
            </button>

            <button
              onClick={() => navigate("/login")}
              className="w-full text-app-textSec text-sm font-normal underline decoration-app-textSec/30 underline-offset-4 active:opacity-70"
            >
              {t.backToLogin}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
