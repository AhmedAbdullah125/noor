"use client";

import React from "react";
import { X, User, Video, ShoppingBag, BookOpen, HelpCircle, MessageCircle, Globe } from "lucide-react";
import { translations, Locale } from "../../services/i18n";

interface Props {
    open: boolean;
    onClose: () => void;
    onNavigate: (path: string) => void;
    socialLinks?: { id: number; name: string; link: string; icon: string }[];
    lang?: Locale;
    onToggleLang?: () => void;
}

export default function HomeDrawer({ open, onClose, onNavigate, socialLinks = [], lang = 'ar', onToggleLang }: Props) {
    if (!open) return null;
    const t = translations[lang];

    return (
        <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div
                className="absolute right-0 top-0 bottom-0 max-w-[350px] bg-white shadow-2xl animate-slideLeftRtl flex flex-col fixed h-full"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 flex items-center justify-between border-b border-app-card/30 bg-white z-10">
                    <button onClick={onClose} className="p-2 hover:bg-app-bg rounded-full transition-colors text-app-text">
                        <X size={24} />
                    </button>
                    {onToggleLang && (
                        <button
                            onClick={() => { onToggleLang(); onClose(); }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-app-card/30 text-xs font-semibold text-app-text hover:bg-app-bg transition-colors"
                        >
                            <Globe size={15} />
                            {lang === 'ar' ? 'English' : 'عربي'}
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar py-4 flex flex-col">


                    <div className="px-6 mt-6 space-y-3">
                        <button
                            onClick={() => {
                                onNavigate("/account");
                                onClose();
                            }}
                            className="w-full py-3.5 rounded-xl border border-app-gold px-2 text-app-gold font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <User size={18} />
                            <span>{t.mySubscriptions}</span>
                        </button>

                        <button
                            onClick={() => {
                                onNavigate("/brand/64");
                                onClose();
                            }}
                            className="w-full py-3.5 rounded-xl border border-app-gold px-2 text-app-gold font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <BookOpen size={18} />
                            <span>{t.electronicNotes}</span>
                        </button>

                        <button
                            onClick={() => {
                                onNavigate("/brand/64");
                                onClose();
                            }}
                            className="w-full py-3.5 rounded-xl border border-app-gold px-2 text-app-gold font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <HelpCircle size={18} />
                            <span>{t.suitableForMe}</span>
                        </button>


                        <a
                            href={
                                /android/i.test(navigator.userAgent)
                                    ? "https://play.google.com/store/apps/details?id=com.Raiyansoft.TrandyHair"
                                    : "https://apps.apple.com/kw/app/%D9%86%D9%88%D8%B1-%D8%AA%D8%B1%D9%86%D8%AF%D9%8A-%D9%87%D9%8A%D8%B1/id6758231066"
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={onClose}
                            className="w-full py-3.5 rounded-xl border border-app-gold px-2 text-app-gold font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <ShoppingBag size={18} />
                            <span>{t.buyProducts}</span>
                        </a>
                        <button
                            onClick={() => {
                                onNavigate("/product/94");
                                onClose();
                            }}
                            className="w-full py-3.5 rounded-xl border border-app-gold px-2 text-white bg-app-gold font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <MessageCircle size={18} />
                            <span>{t.bookConsultation}</span>
                        </button>
                    </div>
                    <div className="px-6 mt-4 grid grid-cols-2 gap-3">
                        {socialLinks.map((social) => (
                            <a
                                key={social.id}
                                href={social.link}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100/50 hover:bg-gray-100 transition-colors"
                            >
                                <img src={social.icon} alt={social.name} className="w-5 h-5" />
                                <span className="text-xs font-semibold text-app-text">{social.name}</span>
                            </a>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-app-card/30 bg-app-bg/30">
                    <a
                        href="https://raiyansoft.net"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-app-textSec text-center font-active block hover:opacity-70 active:opacity-50 transition-opacity"
                    >
                        {t.poweredBy}
                    </a>
                </div>
            </div>
        </div>
    );
}
