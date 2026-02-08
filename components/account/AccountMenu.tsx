import React from "react";
import {
    Heart,
    ClipboardList,
    Info,
    Mail,
    Phone,
    ChevronLeft,
    XCircle,
    Wallet,
    Video,
    Check,
    ShoppingBag,
    LogOut,
    FileText,
    AlertTriangle,
    UserCog,
    ChevronRight,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useGetQuestionnaire } from "../services/useGetQuestionnaire";


import AppHeader from "../AppHeader";
import AppImage from "../AppImage";
import { APP_COLORS } from "../../constants";
import { translations, getLang } from "../../services/i18n";

type Props = {
    isGuest: boolean;
    profile: any | null;
    profileLoading: boolean;
    isHairProfileComplete: boolean;

    onAuthClick: () => void;
    onOpenEdit: () => void;
    onOpenFavorites: () => void;
    onOpenHistory: () => void;
    onOpenReviews: () => void;
    onOpenHairProfile: () => void;
    onOpenDelete: () => void;
};

export default function AccountMenu({ isGuest, profile, profileLoading, isHairProfileComplete, onAuthClick, onOpenEdit, onOpenFavorites, onOpenHistory, onOpenReviews, onOpenHairProfile, onOpenDelete,
}: Props) {
    console.log(profile);
    const lang = getLang();
    const t = translations[lang] || translations['ar'];

    const userName = isGuest ? t.guestName : profile?.name || "—";
    const userPhone = isGuest ? "" : profile?.phone || "";
    const userPhoto = isGuest ? "" : profile?.photo || "https://maison-de-noor.com/assets/img/unknown.svg";
    const wallet = isGuest ? "0.00" : profile?.wallet || "0.00";

    const {
        questionnaireId,
        progress,
        isComplete,
        isLoading: questionnaireLoading,
    } = useGetQuestionnaire(lang, !isGuest);
    const hairComplete = progress?.percentage === 100;
    const hairPercent = progress?.percentage ?? 0;

    return (
        <div className="animate-fadeIn flex flex-col h-full bg-app-bg" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <AppHeader title={t.tabBarAccount} />

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-28 pt-24">
                {/* Profile Card */}
                <div className="bg-white rounded-[2rem] p-4 flex items-center justify-between shadow-sm mb-6 border border-app-card/30">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-app-gold/10 flex-shrink-0 shadow-inner bg-gray-100">
                            {isGuest ? (
                                <div className="w-full h-full flex items-center justify-center text-app-textSec">
                                    <ShoppingBag size={24} />
                                </div>
                            ) : (
                                <AppImage src={userPhoto} alt="Profile Avatar" className="w-full h-full object-cover" />
                            )}
                        </div>

                        <div className="flex flex-col text-start">
                            <span className="font-semibold text-sm text-app-text">
                                {!isGuest && profileLoading ? "..." : userName}
                            </span>
                            {!isGuest && (
                                <span className="text-xs text-app-textSec font-normal" dir="ltr">
                                    {userPhone}
                                </span>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onAuthClick}
                        className="flex items-center gap-1.5 text-red-500 font-semibold text-xs hover:bg-red-50 px-3 py-2 rounded-xl transition-all active:scale-95"
                    >
                        <span className="mt-0.5">{isGuest ? t.login : t.logout}</span>
                        {isGuest ? <LogOut size={18} className="text-red-500 rotate-180" /> : <XCircle size={18} className="text-red-500" />}
                    </button>
                </div>

                {/* Hair Profile */}
                <div
                    onClick={onOpenHairProfile}
                    className="bg-white rounded-[2rem] p-4 flex items-center justify-between shadow-sm mb-6 border border-app-card/30 active:scale-[0.98] transition-all cursor-pointer"
                >
                    <div className="flex flex-col text-start">
                        <span className="font-semibold text-sm text-app-text">{t.hairProfileTitle}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className={`text-[11px] font-semibold ${hairComplete ? "text-green-600" : "text-app-textSec/60"}`}>
                            {!isGuest && questionnaireLoading ? "..." : hairComplete ? t.completed : t.incomplete}
                        </span>

                        <div className={`p-2.5 rounded-2xl flex items-center justify-center transition-colors ${hairComplete ? "bg-green-50 text-green-600" : "bg-app-bg text-app-gold"}`}>
                            {hairComplete ? <Check size={20} strokeWidth={3} /> : <FileText size={20} />}
                        </div>
                        {!hairComplete && !isGuest && (
                            <span className="text-[10px] text-app-textSec/70 font-medium">
                                {hairPercent.toFixed(0)}%
                            </span>
                        )}
                    </div>
                </div>

                {/* QR & Wallet */}
                {!isGuest && (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-app-card/30 flex flex-col items-center justify-center text-center">
                            <h2 className="text-xs font-semibold text-app-text mb-3">{t.qrTitle}</h2>
                            <div className="p-2 bg-white rounded-xl border border-app-card/20 shadow-sm mb-3">
                                <QRCodeSVG value={`noor://account/${profile?.id}`} size={100} fgColor={APP_COLORS.gold} bgColor="#ffffff" level="M" />
                            </div>
                            <p className="text-[9px] text-app-textSec opacity-70 leading-tight">{t.scanQrCode}</p>
                        </div>

                        <div className="relative bg-white rounded-[2rem] p-4 shadow-sm border border-app-card/30 overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-app-gold/5 pointer-events-none" />
                            <Wallet className="absolute -bottom-6 -left-6 text-app-gold/5 w-28 h-28 rotate-12 pointer-events-none" />

                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-app-gold/10 rounded-full text-app-gold">
                                            <Wallet size={14} />
                                        </div>
                                        <span className="text-xs font-semibold text-app-text">{t.myWallet}</span>
                                    </div>

                                    <div className="flex items-baseline gap-1 mb-2">
                                        <span className="text-xl font-semibold text-app-gold font-active tracking-tight">{wallet}</span>
                                        <span className="text-[10px] font-normal text-app-textSec">{t.currency}</span>
                                    </div>

                                    <p className="text-[12px] text-app-textSec leading-snug opacity-90 font-normal">{t.currentBalance}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* List */}
                <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-app-card/30 mb-8">
                    {!isGuest && (
                        <MenuRow icon={<UserCog size={20} />} label={t.editAccount} onClick={onOpenEdit} />
                    )}

                    <MenuRow icon={<Heart size={20} />} label={t.favoriteServices} onClick={onOpenFavorites} />
                    <MenuRow icon={<ClipboardList size={20} />} label={t.bookingHistory} onClick={onOpenHistory} />
                    <MenuRow icon={<Video size={20} />} label={t.customerReviews} onClick={onOpenReviews} />

                    <MenuRow icon={<Info size={20} />} label={t.aboutApp} onClick={() => { }} />
                    <MenuRow icon={<Mail size={20} />} label="contact@mezodonoor.com" onClick={() => { }} />
                    <MenuRow icon={<Phone size={20} />} label="96554647655" onClick={() => { }} dir="ltr" last />
                </div>

                {!isGuest && (
                    <div className="flex justify-center items-center py-4 mb-4">
                        <button
                            onClick={onOpenDelete}
                            className="text-[10px] font-semibold text-red-400/80 hover:text-red-500 underline underline-offset-4 active:opacity-60 transition-all font-active"
                        >
                            {t.deleteAccount}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function MenuRow({
    icon,
    label,
    onClick,
    last,
    dir,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    last?: boolean;
    dir?: "ltr" | "rtl";
}) {
    return (
        <div
            onClick={onClick}
            className={`flex items-center justify-between p-3.5 ${last ? "" : "border-b border-app-bg"} active:bg-app-bg transition-colors cursor-pointer group`}
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-app-bg rounded-xl text-app-gold group-hover:bg-app-card transition-colors">
                    {icon}
                </div>
                <span className="text-sm font-semibold text-app-text" dir={dir}>{label}</span>
            </div>
            {
                dir === "rtl" ?
                    <ChevronLeft className="text-app-textSec opacity-40" size={18} />
                    : <ChevronRight className="text-app-textSec opacity-40" size={18} />
            }
        </div>
    );
}
