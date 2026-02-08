import React, { useEffect, useState } from "react";
import { Camera, Save } from "lucide-react";
import AppHeader from "../AppHeader";

type Props = {
    profile: any | null;
    isGuest: boolean;
    lang: string;
    onBack: () => void;
    onSaved: () => void;
    updateMut: {
        mutateAsync: (payload: any) => Promise<any>;
        isPending: boolean;
        isError: boolean;
    };
};

import { translations, getLang } from "../../services/i18n";

export default function EditProfileScreen({
    profile,
    isGuest,
    onBack,
    onSaved,
    updateMut,
}: Props) {
    const lang = getLang();
    const t = translations[lang] || translations['ar'];

    const [name, setName] = useState(profile?.name || "");
    const [email, setEmail] = useState(profile?.email || "");
    const [phone, setPhone] = useState(profile?.phone || "");
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    const [photoPreview, setPhotoPreview] = useState<string>(profile?.photo || "");

    useEffect(() => {
        setName(profile?.name || "");
        setEmail(profile?.email || "");
        setPhone(profile?.phone || "");
        setPhotoPreview(profile?.photo || "");
        setPhotoFile(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.name, profile?.email, profile?.phone, profile?.photo]);

    useEffect(() => {
        if (!photoFile) return;
        const url = URL.createObjectURL(photoFile);
        setPhotoPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [photoFile]);

    const handleSave = async () => {
        if (isGuest) return;
        if (!name.trim()) return;

        await updateMut.mutateAsync({
            name,
            email,
            phone,
            photo: photoFile,
        });

        if (!updateMut.isError) onSaved();
    };

    return (
        <div className="animate-fadeIn flex flex-col h-full bg-app-bg" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <AppHeader title={t.editAccount} onBack={onBack} />

            <div className="overflow-y-auto no-scrollbar px-6 pt-24 pb-10">
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30 space-y-6">
                    {/* Photo */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col text-start">
                            <span className="text-sm font-semibold text-app-text">{t.image}</span>
                            <span className="text-[11px] text-app-textSec">{t.optional}</span>
                        </div>

                        <label className="relative cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                            />
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-app-gold/15 bg-app-bg flex items-center justify-center">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                                ) : (
                                    <Camera size={22} className="text-app-gold" />
                                )}
                            </div>
                            <div className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-app-gold text-white flex items-center justify-center shadow-lg">
                                <Camera size={14} />
                            </div>
                        </label>
                    </div>

                    <Field label={t.name}>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-4 bg-app-bg border border-app-card/50 rounded-2xl outline-none focus:border-app-gold text-start font-semibold text-app-text"
                            placeholder={t.name}
                        />
                    </Field>

                    <Field label={t.email}>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-4 bg-app-bg border border-app-card/50 rounded-2xl outline-none focus:border-app-gold text-start font-semibold text-app-text"
                            placeholder="email@example.com"
                            dir="ltr"
                        />
                    </Field>

                    <Field label={t.phone}>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full p-4 bg-app-bg border border-app-card/50 rounded-2xl outline-none focus:border-app-gold text-start font-semibold text-app-text"
                            dir="ltr"
                            placeholder={t.phone}
                        />
                    </Field>
                </div>
            </div>

            <div className="p-6 border-t border-app-card/30">
                <button
                    onClick={handleSave}
                    disabled={updateMut.isPending || isGuest}
                    className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {updateMut.isPending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Save size={20} />
                            <span>{t.saveChanges}</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-app-text mb-2">{label}</label>
            {children}
        </div>
    );
}
