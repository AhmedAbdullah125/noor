import React from "react";
import { AlertTriangle } from "lucide-react";
import { translations, getLang } from "../../services/i18n";

export default function DeleteAccountModal({
    isDeleting,
    onCancel,
    onConfirm,
}: {
    isDeleting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    const lang = getLang();
    const t = translations[lang] || translations['ar'];

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fadeIn" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div
                className="bg-white w-full max-w-[320px] rounded-[2rem] p-6 shadow-2xl animate-scaleIn text-center relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-sm font-semibold text-app-text mb-2 font-active">{t.confirmDeleteTitle}</h2>
                <p className="text-xs text-app-textSec leading-loose mb-6 font-active">
                    {t.confirmDeleteDesc}
                </p>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="w-full py-3.5 bg-red-50 text-red-500 font-semibold rounded-xl text-xs active:scale-95 transition-transform font-active disabled:opacity-70"
                    >
                        {isDeleting ? t.deleting : t.confirmDeleteAction}
                    </button>

                    <button
                        onClick={onCancel}
                        className="w-full py-3.5 bg-app-bg text-app-text font-semibold rounded-xl text-xs active:scale-95 transition-transform font-active"
                    >
                        {t.cancel}
                    </button>
                </div>
            </div>
        </div>
    );
}
