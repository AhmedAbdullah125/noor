"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ShoppingBag, Trash2, Calendar, Clock, Loader2,
    Inbox, ShoppingCart, CreditCard, Wallet, CheckCircle, X, AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetCart } from "./services/useGetCart";
import { useGetPaymentMethods } from "./services/useGetPaymentMethods";
import { useCartCheckout } from "./services/useCartCheckout";
import AppHeader from "./AppHeader";
import AppImage from "./AppImage";
import { getLang, translations } from "../services/i18n";
import { http } from "./services/http";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/apiConfig";
import { toast } from "sonner";

function PaymentIcon({ code, icon }: { code: string; icon: string }) {
    if (icon) return <AppImage src={icon} alt={code} className="w-6 h-6 object-contain" />;
    if (code === "wallet") return <Wallet size={20} className="text-app-gold" />;
    return <CreditCard size={20} className="text-app-gold" />;
}

export default function CartPage() {
    const navigate = useNavigate();
    const lang = getLang();
    const t = translations[lang];
    const dir = lang === "ar" ? "rtl" : "ltr";

    const { data: cart, isLoading, isError, refetch } = useGetCart();
    const queryClient = useQueryClient();

    const [removingId, setRemovingId] = useState<number | null>(null);
    const [showCheckout, setShowCheckout] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
    const [checkoutDone, setCheckoutDone] = useState(false);

    const total = cart?.total ?? 0;

    const { data: paymentMethods = [], isLoading: pmLoading } = useGetPaymentMethods(total);

    const { mutate: checkout, isPending: isCheckingOut } = useCartCheckout({
        onSuccess: (data) => {
            const redirectUrl = data?.data?.redirect_url || data?.redirect_url || data?.payment_url;
            if (redirectUrl) {
                window.location.href = redirectUrl;
            } else {
                setShowCheckout(false);
                setCheckoutDone(true);
            }
        },
        onError: (msg) => {
            toast.error(msg, {
                style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
            });
        },
    });

    const handleRemove = async (itemId: number) => {
        setRemovingId(itemId);
        try {
            await http.delete(`${API_BASE_URL}/cart/items/${itemId}`);
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            toast.success(lang === "ar" ? "تم حذف العنصر" : "Item removed");
        } catch {
            toast.error(lang === "ar" ? "فشل الحذف" : "Failed to remove");
        } finally {
            setRemovingId(null);
        }
    };

    const handleCheckout = () => {
        if (!selectedPayment) {
            toast(lang === "ar" ? "اختر طريقة الدفع أولاً" : "Please select a payment method", {
                style: { background: "#6c757d", color: "#fff", borderRadius: "10px" },
            });
            return;
        }
        checkout({ payment_type: selectedPayment });
    };

    const formatTime = (time: string) => {
        const [hStr, mStr] = time.split(":");
        const h = parseInt(hStr, 10);
        const period = h < 12 ? (lang === "ar" ? "ص" : "AM") : (lang === "ar" ? "م" : "PM");
        const displayH = h % 12 || 12;
        return `${displayH}:${mStr} ${period}`;
    };

    // ─── Success screen ────────────────────────────────────────────────────────
    if (checkoutDone) {
        return (
            <div className="flex flex-col h-full bg-app-bg items-center justify-center p-8 font-active" dir={dir}>
                <motion.div
                    className="flex flex-col items-center text-center"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle size={44} className="text-green-500" />
                    </div>
                    <h2 className="text-xl font-bold text-app-text mb-2">
                        {lang === "ar" ? "تم الإرسال بنجاح!" : "Order Placed!"}
                    </h2>
                    <p className="text-sm text-app-textSec mb-8">
                        {lang === "ar" ? "تم استلام طلبك وسنتواصل معك قريباً" : "Your order was received and we'll be in touch soon."}
                    </p>
                    <button
                        onClick={() => navigate("/")}
                        className="bg-app-gold text-white px-8 py-3 rounded-2xl font-semibold shadow-lg shadow-app-gold/30"
                    >
                        {lang === "ar" ? "العودة للرئيسية" : "Back to Home"}
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-app-bg relative font-active overflow-hidden" dir={dir}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
                <AppHeader
                    title={lang === "ar" ? "سلة التسوق" : "Cart"}
                    onBack={() => navigate(-1)}
                />
            </motion.div>

            {/* Main scroll area */}
            <main className="flex-1 overflow-y-auto w-full pb-36 pt-24 px-4">
                {/* Loading */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 text-app-textSec">
                        <Loader2 className="w-8 h-8 animate-spin text-app-gold mb-3" />
                        <p className="text-sm">{lang === "ar" ? "جاري التحميل..." : "Loading..."}</p>
                    </div>
                )}

                {/* Error */}
                {isError && (
                    <div className="flex flex-col items-center justify-center py-20 text-app-textSec">
                        <AlertCircle className="w-10 h-10 mb-3 text-red-400" />
                        <p className="text-sm mb-4">{lang === "ar" ? "تعذّر تحميل السلة" : "Failed to load cart"}</p>
                        <button onClick={() => refetch()} className="px-6 py-2 bg-app-gold text-white rounded-xl text-sm font-semibold">
                            {lang === "ar" ? "إعادة المحاولة" : "Retry"}
                        </button>
                    </div>
                )}

                {/* Empty */}
                {!isLoading && !isError && (!cart?.items || cart.items.length === 0) && (
                    <motion.div
                        className="flex flex-col items-center justify-center py-20 text-app-textSec"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Inbox className="w-14 h-14 mb-4 text-app-card" />
                        <p className="text-base font-semibold text-app-text mb-1">
                            {lang === "ar" ? "السلة فارغة" : "Your cart is empty"}
                        </p>
                        <p className="text-sm text-app-textSec mb-6">
                            {lang === "ar" ? "أضف خدمات لتكملة الحجز" : "Add services to proceed with booking"}
                        </p>
                        <button
                            onClick={() => navigate("/")}
                            className="flex items-center gap-2 bg-app-gold text-white px-6 py-3 rounded-2xl text-sm font-semibold shadow-lg shadow-app-gold/30"
                        >
                            <ShoppingBag size={18} />
                            {lang === "ar" ? "تصفح الخدمات" : "Browse Services"}
                        </button>
                    </motion.div>
                )}

                {/* Cart items */}
                {!isLoading && cart?.items && cart.items.length > 0 && (
                    <div className="space-y-3">
                        {cart.items.map((item, i) => (
                            <motion.div
                                key={item.id}
                                className="bg-white rounded-2xl border border-app-card/30 p-4 shadow-sm"
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.07, ease: [0.4, 0, 0.2, 1] }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-app-gold/10 rounded-xl flex items-center justify-center">
                                            <ShoppingBag size={16} className="text-app-gold" />
                                        </div>
                                        <span className="text-xs font-semibold text-app-textSec">
                                            {lang === "ar" ? `خدمة #${item.service_id}` : `Service #${item.service_id}`}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(item.id)}
                                        disabled={removingId === item.id}
                                        className="p-1.5 rounded-lg hover:bg-red-50 text-app-textSec hover:text-red-500 transition-colors active:scale-95"
                                    >
                                        {removingId === item.id
                                            ? <Loader2 size={16} className="animate-spin" />
                                            : <Trash2 size={16} />}
                                    </button>
                                </div>

                                <div className="flex gap-3 mb-3">
                                    <div className="flex items-center gap-1.5 text-xs text-app-textSec">
                                        <Calendar size={13} className="text-app-gold" />
                                        <span>{item.start_date}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-app-textSec">
                                        <Clock size={13} className="text-app-gold" />
                                        <span>{formatTime(item.start_time)}</span>
                                    </div>
                                    {item.session_count > 1 && (
                                        <div className="text-xs bg-app-gold/10 text-app-gold font-semibold px-2 py-0.5 rounded-lg">
                                            {item.session_count} {lang === "ar" ? "جلسة" : "sessions"}
                                        </div>
                                    )}
                                </div>

                                {item.options.length > 0 && (
                                    <div className="mb-3 space-y-1">
                                        {item.options.map(opt => (
                                            <div key={opt.id} className="flex justify-between text-[11px] text-app-textSec bg-app-bg/60 rounded-lg px-2 py-1">
                                                <span>{lang === "ar" ? "إضافة" : "Add-on"} #{opt.option_id}</span>
                                                <span className="text-app-gold font-semibold">+{parseFloat(opt.price).toFixed(3)} {lang === "ar" ? "د.ك" : "KWD"}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-2 border-t border-app-card/20">
                                    <span className="text-xs text-app-textSec">{lang === "ar" ? "الإجمالي" : "Total"}</span>
                                    <span className="text-sm font-bold text-app-gold">
                                        {item.total_price.toFixed(3)} {lang === "ar" ? "د.ك" : "KWD"}
                                    </span>
                                </div>
                            </motion.div>
                        ))}

                        {/* Summary card */}
                        <motion.div
                            className="bg-white rounded-2xl border border-app-card/30 p-4 shadow-sm"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: cart.items.length * 0.07 + 0.05 }}
                        >
                            {cart.coupon_code && (
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-app-textSec">{lang === "ar" ? "كود الخصم" : "Coupon"}</span>
                                    <span className="font-semibold text-green-600">{cart.coupon_code}</span>
                                </div>
                            )}
                            {cart.discount_amount > 0 && (
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-app-textSec">{lang === "ar" ? "الخصم" : "Discount"}</span>
                                    <span className="font-semibold text-green-600">-{cart.discount_amount.toFixed(3)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-app-text">{lang === "ar" ? "المجموع الكلي" : "Grand Total"}</span>
                                <span className="text-xl font-bold text-app-gold">
                                    {cart.total.toFixed(3)} {lang === "ar" ? "د.ك" : "KWD"}
                                </span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </main>

            {/* Checkout button (sticky bottom) */}
            {!isLoading && !isError && cart?.items && cart.items.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-app-bg/90 backdrop-blur-sm border-t border-app-card/20">
                    <button
                        onClick={() => setShowCheckout(true)}
                        className="w-full py-4 bg-app-gold text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-app-gold/30 active:scale-[0.98] transition-transform"
                    >
                        <ShoppingCart size={20} />
                        {lang === "ar" ? "المتابعة للدفع" : "Proceed to Checkout"}
                    </button>
                </div>
            )}

            {/* ─── Checkout bottom sheet ─────────────────────────────────────────── */}
            <AnimatePresence>
                {showCheckout && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="absolute inset-0 bg-black/40 z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCheckout(false)}
                        />

                        {/* Sheet */}
                        <motion.div
                            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 pb-10"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        >
                            {/* Handle + close */}
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-base font-bold text-app-text">
                                    {lang === "ar" ? "اختر طريقة الدفع" : "Select Payment Method"}
                                </h3>
                                <button onClick={() => setShowCheckout(false)} className="p-1.5 rounded-full hover:bg-app-bg transition-colors">
                                    <X size={20} className="text-app-textSec" />
                                </button>
                            </div>

                            {/* Total reminder */}
                            <div className="flex justify-between items-center bg-app-bg rounded-xl px-4 py-3 mb-5">
                                <span className="text-sm text-app-textSec">{lang === "ar" ? "المبلغ الإجمالي" : "Total Amount"}</span>
                                <span className="text-lg font-bold text-app-gold">
                                    {total.toFixed(3)} {lang === "ar" ? "د.ك" : "KWD"}
                                </span>
                            </div>

                            {/* Payment methods */}
                            {pmLoading ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="w-6 h-6 animate-spin text-app-gold" />
                                </div>
                            ) : (
                                <div className="space-y-2 mb-6">
                                    {paymentMethods.map((method) => {
                                        const name = lang === "ar" ? method.name_ar : method.name_en;
                                        const isSelected = selectedPayment === method.code;
                                        return (
                                            <button
                                                key={method.id}
                                                onClick={() => setSelectedPayment(method.code)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${isSelected
                                                        ? "border-app-gold bg-app-gold/5"
                                                        : "border-app-card/30 bg-white"
                                                    }`}
                                            >
                                                <PaymentIcon code={method.code} icon={method.icon} />
                                                <span className="flex-1 text-sm font-semibold text-app-text text-start">{name}</span>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-app-gold bg-app-gold" : "border-app-card/50"
                                                    }`}>
                                                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Confirm button */}
                            <button
                                onClick={handleCheckout}
                                disabled={!selectedPayment || isCheckingOut}
                                className="w-full py-4 bg-app-gold text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-app-gold/30 disabled:opacity-50 active:scale-[0.98] transition-all"
                            >
                                {isCheckingOut
                                    ? <Loader2 size={20} className="animate-spin" />
                                    : <CheckCircle size={20} />
                                }
                                {isCheckingOut
                                    ? (lang === "ar" ? "جاري الدفع..." : "Processing...")
                                    : (lang === "ar" ? "تأكيد الدفع" : "Confirm Payment")
                                }
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
