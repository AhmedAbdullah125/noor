import React from "react";
import AppHeader from "../AppHeader";
import { translations, getLang } from "../../services/i18n";
import { Info, Globe, Mail, Phone, MapPin } from "lucide-react";

interface Props {
    onBack: () => void;
}

export default function AboutScreen({ onBack }: Props) {
    const lang = getLang();
    const t = translations[lang] || translations["ar"];

    return (
        <div className="animate-fadeIn flex flex-col h-full bg-app-bg" dir={lang === "ar" ? "rtl" : "ltr"}>
            <AppHeader title={t.aboutApp} onBack={onBack} />

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-28 pt-24">
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-app-card/30 mb-6 flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-app-bg rounded-full flex items-center justify-center mb-6">
                        <img
                            src="https://raiyansoft.com/wp-content/uploads/2025/12/fav.png"
                            alt="Logo"
                            className="w-16 h-16 object-contain"
                        />
                    </div>
                    <h2 className="text-xl font-bold text-app-text mb-2">{t.appName}</h2>
                    <p className="text-sm text-app-textSec leading-relaxed">
                        {lang === 'ar'
                            ? "ميزو دو نور هو وجهتك الأولى للعناية المتكاملة بالشعر وفروة الرأس. نحن نجمع بين الخبرة الطبية واللمسة الجمالية لنقدم لك أفضل الحلول والخدمات."
                            : "Maison de Noor is your premier destination for integrated hair and scalp care. We combine medical expertise with an aesthetic touch to provide you with the best solutions and services."}
                    </p>
                </div>

                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30 space-y-6">
                    <h3 className="font-semibold text-app-text text-sm border-b border-app-bg pb-3">
                        {lang === 'ar' ? 'معلومات التواصل' : 'Contact Information'}
                    </h3>



                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-app-bg rounded-2xl text-app-gold">
                            <Mail size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-app-textSec uppercase tracking-wider">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</span>
                            <a href="mailto:contact@mezodonoor.com" className="text-sm font-semibold text-app-text hover:text-app-gold transition-colors">
                                contact@mezodonoor.com
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-app-bg rounded-2xl text-app-gold">
                            <Phone size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-app-textSec uppercase tracking-wider">{lang === 'ar' ? 'الهاتف' : 'Phone'}</span>
                            <a href="tel:+96554647655" className="text-sm font-semibold text-app-text hover:text-app-gold transition-colors" dir="ltr">
                                +965 54647655
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-app-bg rounded-2xl text-app-gold">
                            <MapPin size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-app-textSec uppercase tracking-wider">{lang === 'ar' ? 'العنوان' : 'Address'}</span>
                            <span className="text-sm font-semibold text-app-text">
                                {lang === 'ar' ? 'الكويت، مدينة الكويت' : 'Kuwait, Kuwait City'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center px-4">
                    <p className="text-[10px] text-app-textSec opacity-60">
                        Version 1.0.0 (Building 2026.04)
                    </p>
                    <p className="text-[10px] text-app-textSec opacity-60 mt-1">
                        &copy; 2026 Maison de Noor. {lang === 'ar' ? 'جميع الحقوق محفوظة' : 'All Rights Reserved'}.
                    </p>
                </div>
            </div>
        </div>
    );
}
