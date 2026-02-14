"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, ShoppingBag, Wallet, Wallet2, X } from "lucide-react";
import { toast } from "sonner";
import parse from "html-react-parser";

import ImageCarousel from "../ImageCarousel";
import { Product, ServiceAddon, ServiceAddonGroup, ServiceSubscription, } from "../../types";
import { createRequest } from "../services/createRequest";
import { getLang, translations } from "../../services/i18n";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";
import { useGetProfile } from "../services/useGetProfile";

type Props = {
    product: Product;
    onBack: () => void;
    onCreated?: (data: any) => void;
};

interface PaymentMethod {
    id: number;
    name_ar: string;
    name_en: string;
    code: string;
    icon: string;
    is_active: boolean;
    sort_order: number;
}

function parsePrice(val: any): number {
    if (val == null) return 0;
    if (typeof val === "number") return val;
    const s = String(val);
    const n = parseFloat(s.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
}

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

function getTomorrowDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const pad2 = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function getTodayDate() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function getNowTime() {
    const d = new Date();
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;
}

const timeSlots: string[] = [];
const startHour = 11;
const endHour = 18;

for (let h = startHour; h <= endHour; h++) {
    timeSlots.push(`${String(h).padStart(2, "0")}:00`);
    if (h < endHour) {
        timeSlots.push(`${String(h).padStart(2, "0")}:30`);
    }
}

export default function ServiceDetails({ product, onBack, onCreated }: Props) {
    const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
    const lang = getLang();
    const t = translations[lang];
    const isAr = lang === 'ar';

    const [creating, setCreating] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const descriptionCharLimit = 150;

    const [bookingModal, setBookingModal] = useState<{
        subscriptionId: number | null;
        title: string;
        sessionsCount: number;
        validityDays: number;
        finalTotal: number;
    } | null>(null);

    const [paymentType, setPaymentType] = useState<string>("wallet");
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

    useEffect(() => {
        async function fetchPaymentMethods() {
            try {
                const res = await fetch(`${DASHBOARD_API_BASE_URL}/payment-methods?is_active=1`);
                const data = await res.json();

                if (data.status && Array.isArray(data.data?.data)) {
                    let methods: PaymentMethod[] = data.data.data;

                    // Add wallet if not present
                    if (!methods.find(m => m.code === 'wallet')) {
                        methods.push({
                            id: 9991,
                            name_ar: t.wallet, // Using translation
                            name_en: t.wallet, // Using translation - assumes t.wallet handles both or is just text
                            code: "wallet",
                            icon: "",
                            is_active: true,
                            sort_order: 999
                        });
                    }

                    setPaymentMethods(methods);
                }
            } catch (error) {
                console.error("Failed to fetch payment methods", error);
            }
        }

        fetchPaymentMethods();
    }, [lang, t.wallet]);

    const [startDate, setStartDate] = useState<string>("");
    const [startTime, setStartTime] = useState<string>("");
    const [showPolicyConfirm, setShowPolicyConfirm] = useState(false);

    const { data: profile } = useGetProfile(lang);

    // Parse wallet balance safely
    const walletBalance = useMemo(() => {
        return parsePrice(profile?.wallet ?? 0);
    }, [profile?.wallet]);

    const isWalletInsufficient = useMemo(() => {
        if (paymentType !== 'wallet' || !bookingModal) return false;
        return walletBalance < bookingModal.finalTotal;
    }, [paymentType, bookingModal, walletBalance]);

    useEffect(() => {
        setSelectedAddonIds(new Set());
        setBookingModal(null);
        setPaymentType("wallet");
        setStartDate("");
        setStartTime("");
        setShowPolicyConfirm(false);
    }, [product?.id]);

    const resolvedAddonGroups: ServiceAddonGroup[] = useMemo(() => {
        return product?.addonGroups ? [...product.addonGroups] : [];
    }, [product]);

    const basePrice = useMemo(() => {
        return parsePrice((product as any)?.price ?? (product as any)?.current_price ?? 0);
    }, [product]);

    const addonsTotal = useMemo(() => {
        let sum = 0;

        const legacyAddons: ServiceAddon[] = (product as any)?.addons ?? [];
        legacyAddons.forEach((a) => {
            if (selectedAddonIds.has(a.id)) sum += parsePrice((a as any).price_kwd ?? 0);
        });

        resolvedAddonGroups.forEach((g) => {
            g.options?.forEach((opt: any) => {
                if (selectedAddonIds.has(opt.id)) sum += parsePrice(opt.price_kwd ?? opt.price ?? 0);
            });
        });

        return sum;
    }, [product, resolvedAddonGroups, selectedAddonIds]);

    const total = useMemo(() => basePrice + addonsTotal, [basePrice, addonsTotal]);

    const priceData = useMemo(
        () => ({
            base: basePrice,
            addons: addonsTotal,
            total,
            display: `${total.toFixed(3)} ${t.currency}`,
            duration: (product as any)?.duration || "0",
        }),
        [basePrice, addonsTotal, total, product, t.currency]
    );

    const getImages = () => {
        const imgs = (product as any)?.images ?? [];
        if (Array.isArray(imgs) && imgs.length > 0) return imgs;
        const fallback = (product as any)?.image;
        return fallback ? [fallback] : [];
    };

    const handleGroupOptionSelect = (groupId: string, optionId: string, type: "single" | "multi") => {
        setSelectedAddonIds((prev) => {
            const next = new Set(prev);

            if (type === "single") {
                const group = resolvedAddonGroups.find((g) => g.id === groupId);
                group?.options?.forEach((opt) => next.delete(opt.id));
                next.add(optionId);
            } else {
                if (next.has(optionId)) next.delete(optionId);
                else next.add(optionId);
            }

            return next;
        });
    };

    const missingRequiredGroups = useMemo(() => {
        return resolvedAddonGroups
            .filter((g: any) => g?.required)
            .filter((g: any) => !(g.options ?? []).some((opt: any) => selectedAddonIds.has(opt.id)));
    }, [resolvedAddonGroups, selectedAddonIds]);

    const canSubscribe = useMemo(() => missingRequiredGroups.length === 0, [missingRequiredGroups]);

    const validateRequiredGroups = () => {
        if (missingRequiredGroups.length === 0) return true;
        toast(`${t.selectRequired}: ${isAr ? missingRequiredGroups[0]?.title_ar : missingRequiredGroups[0]?.title_en || missingRequiredGroups[0]?.title_ar}`, {
            style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
        });
        return false;
    };

    const buildRequestOptions = () => {
        const out: { option_id: number; option_value_id: number }[] = [];

        resolvedAddonGroups.forEach((group: any) => {
            const selected = (group.options ?? []).filter((opt: any) => selectedAddonIds.has(opt.id));
            selected.forEach((opt: any) => {
                out.push({
                    option_id: Number(group.id),
                    option_value_id: Number(opt.id),
                });
            });
        });

        const legacyAddons: any[] = (product as any)?.addons ?? [];
        legacyAddons.forEach((a: any) => {
            if (selectedAddonIds.has(a.id)) {
                const optionId = Number(a.option_id ?? a.group_id ?? 0);
                const valueId = Number(a.option_value_id ?? a.id);
                if (optionId) out.push({ option_id: optionId, option_value_id: valueId });
            }
        });

        return out;
    };

    const openBookingModal = (data: {
        subscriptionId: number | null;
        title: string;
        sessionsCount: number;
        validityDays: number;
        finalTotal: number;
    }) => {
        if (!validateRequiredGroups()) return;
        setStartDate("");
        setStartTime("");
        setPaymentType("wallet");
        setBookingModal(data);
    };

    const doCreateRequest = async () => {
        if (creating) return;
        if (!bookingModal) return;
        if (!validateRequiredGroups()) return;

        if (paymentType === 'wallet' && isWalletInsufficient) {
            toast(t.insufficientBalance || "لا يوجد رصيد كافي", { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            return;
        }

        const time = startTime.length === 5 ? `${startTime}:00` : startTime;
        if (!startDate) {
            toast(t.pleaseSelectDate, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            return;
        }
        if (!time || time.length < 5) {
            toast(t.pleaseSelectTime, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            return;
        }

        setCreating(true);

        const payload = {
            service_id: Number(product.id),
            subscription_id: bookingModal.subscriptionId,
            options: buildRequestOptions(),
            start_date: startDate,
            start_time: time,
            payment_type: paymentType,
        };

        const res = await createRequest(payload, "ar", "json");
        setCreating(false);

        if (!res.ok) return;

        if (res.data?.payment_url) {
            toast(t.redirectingPayment, { style: { background: "#198754", color: "#fff", borderRadius: "10px" } });
            window.location.href = res.data.payment_url;
            return;
        }

        toast(t.requestSuccess, { style: { background: "#198754", color: "#fff", borderRadius: "10px" } });
        setBookingModal(null);
        onCreated?.(res.data);
    };

    const handleSubscriptionClick = (sub: ServiceSubscription) => {
        const sessionsCount = (sub as any).sessionsCount ?? (sub as any).session_count ?? 1;
        const pricePercent = parsePrice((sub as any).pricePercent ?? (sub as any).price_percentage ?? 100);
        const fixedPrice = parsePrice((sub as any).fixedPrice ?? (sub as any).fixed_price ?? 0);

        const originalTotal = priceData.total * sessionsCount;
        const computedFinal = originalTotal * (pricePercent / 100);
        const finalTotal = fixedPrice > 0 ? fixedPrice : computedFinal;

        const title = (sub as any).titleText ?? (sub as any).title ?? (sub as any).name ?? "";
        const validityDays = (sub as any).validityDays ?? (sub as any).validity_days ?? 30;

        openBookingModal({
            subscriptionId: Number((sub as any).id) || null,
            title: title || (isAr ? `باقة ${sessionsCount} جلسات` : `${sessionsCount} Sessions Package`),
            sessionsCount,
            validityDays,
            finalTotal,
        });
    };

    const handleSingleSessionClick = () => {
        openBookingModal({
            subscriptionId: null,
            title: t.bookSession,
            sessionsCount: 1,
            validityDays: 0,
            finalTotal: priceData.total,
        });
    };

    return (
        <div className="animate-fadeIn pt-2" dir={lang == "ar" ? "rtl" : "ltr"}>
            {bookingModal && (
                <div
                    className="absolute inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setBookingModal(null)}
                >
                    <div
                        className="bg-white w-full max-w-full rounded-[24px] max-h-[80vh] overflow-y-auto p-6 shadow-2xl relative flex flex-col text-center animate-scaleIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => {
                                if (showPolicyConfirm) setShowPolicyConfirm(false);
                                else setBookingModal(null);
                            }}
                            className="absolute top-4 left-4 p-2 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors active:scale-95"
                        >
                            <X size={20} />
                        </button>

                        {!showPolicyConfirm ? (
                            <>
                                <h2 className="text-base font-semibold text-app-text mb-4 mt-2">{t.confirmBooking}</h2>

                                <div className="w-full space-y-3 mb-5">
                                    <div className="flex justify-between items-center bg-app-bg/50 p-3 rounded-xl border border-app-card/30">
                                        <span className="text-xs text-app-textSec font-normal">{t.service}</span>
                                        <span className="text-sm font-semibold text-app-text">{product.name}</span>
                                    </div>

                                    <div className="flex justify-between items-center bg-app-bg/50 p-3 rounded-xl border border-app-card/30">
                                        <span className="text-xs text-app-textSec font-normal">{t.package}</span>
                                        <span className="text-sm font-semibold text-app-text">{bookingModal.title}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-app-bg/50 rounded-xl border border-app-card/30 p-1">
                                            <label className="block text-[11px] font-semibold text mb-2">{t.date}</label>
                                            <input
                                                type="date"
                                                className="w-full bg-white rounded-xl p-1 text-sm outline-none border border-app-card/30 focus:border-app-gold"
                                                value={startDate}
                                                min={getTodayDate()}
                                                onChange={(e) => {
                                                    if (e.target.value && e.target.value < getTodayDate()) return;
                                                    setStartDate(e.target.value);
                                                }}
                                            />
                                        </div>

                                        <div className="bg-app-bg/50 rounded-xl border border-app-card/30 p-1">
                                            <label className="block text-[11px] font-semibold text-app-text mb-2">{t.time}</label>
                                            <select
                                                className="w-full bg-white rounded-xl p-1 text-sm outline-none border border-app-card/30 focus:border-app-gold appearance-none"
                                                value={startTime.slice(0, 5)}
                                                onChange={(e) => setStartTime(e.target.value)}
                                            >
                                                <option value="">{t.chooseTime}</option>
                                                {timeSlots.map((time) => {
                                                    const [hStr, mStr] = time.split(":");
                                                    const h = parseInt(hStr, 10);
                                                    const period = h < 12 ? "ص" : "م";
                                                    const displayH = h % 12 || 12;
                                                    const label = `${displayH}:${mStr} ${period}`;
                                                    return (
                                                        <option key={time} value={time}>
                                                            {label}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="bg-app-bg/50 rounded-xl border border-app-card/30 p-1" >
                                        <label className="block text-[11px] font-semibold text-app-text mb-2">{t.paymentMethod}</label>
                                        <div className="flex gap-2">
                                            {paymentMethods.map((p) => {
                                                const isApple = p.code === "apple_pay";
                                                const isActive = paymentType === p.code;

                                                return (
                                                    <button
                                                        key={p.code}
                                                        type="button"
                                                        onClick={() => setPaymentType(p.code)}
                                                        className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 
                                                            ${isActive
                                                                ? isApple
                                                                    ? "bg-black text-white border-black"
                                                                    : "bg-app-gold text-white border-app-gold"
                                                                : "bg-white text-app-text border-app-card/30"
                                                            }`}
                                                    >

                                                        <span className="font-medium text-[11px]"> {isAr ? p.name_ar : p.name_en}</span>
                                                        {
                                                            p.code == "wallet" ? <Wallet /> :
                                                                <img
                                                                    src={p.icon}
                                                                    alt={p.name_en}
                                                                    className="h-5 object-contain bg-white rounded-sm"
                                                                />
                                                        }


                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {isWalletInsufficient && (
                                            <p className="text-[10px] text-red-500 mt-2 font-medium">
                                                {t.insufficientBalance || "لا يوجد رصيد كافي"} ({walletBalance.toFixed(3)} {t.currency})
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center bg-app-bg/50 p-3 rounded-xl border border-app-card/30">
                                        <span className="text-xs text-app-textSec font-normal">{t.total}</span>
                                        <span className="text-sm font-semibold text-app-gold">{bookingModal.finalTotal.toFixed(3)} {t.currency}</span>
                                    </div>


                                    {bookingModal.subscriptionId != null && (
                                        <div className="flex justify-between items-center bg-app-bg/50 p-3 rounded-xl border border-app-card/30">
                                            <span className="text-xs text-app-textSec font-normal">{t.sessionsCount}</span>
                                            <span className="text-sm font-semibold text-app-text">{bookingModal.sessionsCount}</span>
                                        </div>
                                    )}

                                    {bookingModal.subscriptionId != null && (
                                        <div className="flex justify-between items-center bg-app-bg/50 p-3 rounded-xl border border-app-card/30">
                                            <span className="text-xs text-app-textSec font-normal">{t.validity}</span>
                                            <span className="text-sm font-semibold text-app-text">{bookingModal.validityDays || 30} {t.day}</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => {
                                        const time = startTime.length === 5 ? `${startTime}:00` : startTime;
                                        if (!startDate) {
                                            toast(t.pleaseSelectDate, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
                                            return;
                                        }
                                        if (!time || time.length < 5) {
                                            toast(t.pleaseSelectTime, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
                                            return;
                                        }
                                        setShowPolicyConfirm(true);
                                    }}
                                    disabled={creating}
                                    className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform disabled:opacity-60"
                                >
                                    {creating ? t.bookingInProgress : t.confirmBooking}
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center animate-fadeIn">
                                <h2 className="text-base font-semibold text-app-text mb-4 mt-2">{t.bookingPolicy}</h2>
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium leading-relaxed mb-6 border border-red-100">
                                    {t.policyText}
                                </div>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={doCreateRequest}
                                        disabled={creating || isWalletInsufficient}
                                        className="flex-[2] bg-app-gold text-white font-semibold py-3 rounded-xl shadow-lg shadow-app-gold/30 active:scale-95 transition-transform disabled:opacity-60"
                                    >
                                        {creating ? t.bookingInProgress : t.agreeAndConfirm}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="px-6 mb-6">
                <div className="w-full aspect-square rounded-[2.5rem] overflow-hidden shadow-md bg-white border border-app-card/30">
                    <ImageCarousel images={getImages()} alt={product.name} className="w-full h-full" />
                </div>
            </div>

            <div className="px-8 mb-4">
                <h2 className="text-xl font-semibold text-app-text font-active leading-tight mb-2">{product.name}</h2>
                <div>
                    <div className="text-sm text-app-text/70">
                        {product?.description && product.description.length > descriptionCharLimit ? (
                            <>
                                {isDescriptionExpanded
                                    ? parse(product.description)
                                    : parse(`${product.description.slice(0, descriptionCharLimit)}...`)
                                }
                            </>
                        ) : (
                            product?.description ? parse(product.description) : null
                        )}
                    </div>
                    {product?.description && product.description.length > descriptionCharLimit && (
                        <button
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            className="text-xs font-semibold text-app-gold hover:text-app-goldDark transition-colors mt-1 active:scale-95"
                        >
                            {isDescriptionExpanded ? t.showLess : t.showMore}
                        </button>
                    )}
                </div>
                <div className="mt-2 mb-1 flex flex-wrap gap-2">
                    {resolvedAddonGroups.length > 0 && (
                        <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg">
                            {t.optionalAddons}
                        </span>
                    )}
                </div>

                <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-semibold text-app-gold">{priceData.display}</span>
                        {(product as any).oldPrice && (
                            <span className="text-sm text-app-textSec line-through opacity-60">{(product as any).oldPrice}</span>
                        )}
                    </div>

                    {priceData.addons > 0 && (
                        <div className="text-[10px] text-app-textSec font-normal space-y-0.5">
                            <div className="flex items-center gap-1">
                                <span>{t.basePrice}:</span>
                                <span>{priceData.base.toFixed(3)} {t.currency}</span>
                            </div>
                            <div className="flex items-center gap-1 text-app-gold">
                                <span>{t.addons}:</span>
                                <span>+{priceData.addons.toFixed(3)} {t.currency}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {resolvedAddonGroups.length > 0 && (
                <div className="px-6 mb-6 space-y-6">
                    {resolvedAddonGroups.map((group) => (
                        <div key={group.id}>
                            <div className="mb-3 flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-app-text">{isAr ? group.title_ar : group.title_en || group.title_ar}</h3>
                                {(group as any).required && (
                                    <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-md font-semibold">{t.required}</span>
                                )}
                            </div>

                            <div className="space-y-2">
                                {(group.options ?? []).map((option: any) => {
                                    const isSelected = selectedAddonIds.has(option.id);
                                    const isRadio = (group as any).type === "single";

                                    return (
                                        <div
                                            key={option.id}
                                            onClick={() => handleGroupOptionSelect(String(group.id), option.id, (group as any).type)}
                                            className={`flex relative items-center justify-between p-3.5 pb-8 rounded-2xl border cursor-pointer transition-all active:scale-[0.99] ${isSelected ? "bg-app-gold/5 border-app-gold shadow-sm" : "bg-white border-app-card/30 hover:border-app-card"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {isRadio ? (
                                                    <div
                                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "border-app-gold" : "border-app-textSec/30"
                                                            }`}
                                                    >
                                                        {isSelected && <div className="w-2.5 h-2.5 bg-app-gold rounded-full" />}
                                                    </div>
                                                ) : (
                                                    <div
                                                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-app-gold border-app-gold" : "border-app-textSec/30"
                                                            }`}
                                                    >
                                                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                                    </div>
                                                )}

                                                <div>
                                                    <p className={`text-sm font-semibold ${isSelected ? "text-app-gold" : "text-app-text"}`}>{isAr ? option.title_ar : option.title_en || option.title_ar}</p>
                                                    {(isAr ? option.desc_ar : option.desc_en) && <p className="text-[10px] text-app-textSec">{isAr ? option.desc_ar : option.desc_en}</p>}
                                                </div>
                                            </div>

                                            <span className="text-[10px] absolute bottom-1 end-1 font-bold text-white bg-app-gold px-2.5 py-1 rounded-lg">
                                                +{parsePrice(option.price_kwd ?? option.price ?? 0).toFixed(3)} {t.currency}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!canSubscribe && (
                <div className="px-8 mb-4">
                    <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-3 text-[12px] font-semibold">
                        {t.selectRequired}
                    </div>
                </div>
            )}

            {(priceData.base > 0 || resolvedAddonGroups.length > 0 || ((product as any)?.addons?.length ?? 0) > 0) && (
                <div className="px-8 mb-10 space-y-3">
                    {product.subscriptions && product.subscriptions.length > 0 ? (
                        <div className="space-y-4">
                            {product.subscriptions.map((sub: any) => {
                                const sessionsCount = sub.sessionsCount ?? sub.session_count ?? 1;
                                const fixedPrice = parsePrice(sub.fixedPrice ?? sub.fixed_price ?? 0);
                                const pricePercent = parsePrice(sub.pricePercent ?? sub.price_percentage ?? 100);
                                const originalTotal = priceData.total * sessionsCount;
                                const computedFinal = originalTotal * (pricePercent / 100);
                                const finalTotal = fixedPrice > 0 ? fixedPrice : computedFinal;

                                return (
                                    <div key={sub.id} className="w-full">
                                        {sub.titleText || sub.title || sub.name ? (
                                            <p className="text-xs font-semibold text-app-text mb-1.5 px-1">{sub.titleText || sub.title || sub.name}</p>
                                        ) : null}

                                        <button
                                            onClick={() => handleSubscriptionClick(sub)}
                                            disabled={creating || !canSubscribe}
                                            className="w-full bg-app-gold text-white font-semibold py-3 px-4 rounded-2xl shadow-lg shadow-app-gold/20 active:bg-app-goldDark active:scale-[0.98] transition-all flex items-center justify-between disabled:opacity-60"
                                        >
                                            <div className="flex flex-col items-start gap-1">
                                                <div className="flex items-center gap-2">
                                                    <ShoppingBag size={18} />
                                                    {sessionsCount > 1 && (
                                                        <span className="text-sm">{isAr ? `حجز ${sessionsCount} جلسات` : `${t.book} ${sessionsCount} ${t.sessions}`}</span>
                                                    )}
                                                    {sessionsCount === 1 && (
                                                        <span className="text-sm">{t.bookSession}</span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-normal">{sessionsCount} {sessionsCount === 1 ? t.session : t.sessions}</div>
                                            </div>

                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-semibold">{finalTotal.toFixed(3)} {t.currency}</span>
                                            </div>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <button
                            onClick={handleSingleSessionClick}
                            disabled={creating || !canSubscribe}
                            className="w-full bg-app-gold text-white font-semibold py-4 px-6 rounded-2xl shadow-lg shadow-app-gold/30 active:bg-app-goldDark active:scale-[0.98] transition-all flex items-center justify-between disabled:opacity-60"
                        >
                            <div className="flex items-center gap-2">
                                <ShoppingBag size={20} />
                                <span>{creating ? t.bookingInProgress : t.bookNow}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold">{priceData.total.toFixed(3)} {t.currency}</span>
                            </div>
                        </button>
                    )}
                </div>
            )}
        </div >
    );
}
