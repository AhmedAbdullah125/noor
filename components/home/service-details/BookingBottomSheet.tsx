import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, CreditCard, Loader2, ShoppingBag, ShoppingCart, Wallet, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { addDays } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import { Product } from "../../../types";
import { PaymentMethod } from "../../services/useGetPaymentMethods";
import { isBookedDate, calendarStyles, pad2, timeSlots } from "./utils";
import { toast } from "sonner";

type Props = {
    bookingModal: any;
    setBookingModal: (v: any) => void;
    bookingStep: 1 | 2 | 3;
    setBookingStep: (v: 1 | 2 | 3) => void;
    product: Product;
    t: any;
    isAr: boolean;
    startDate: string;
    setStartDate: (v: string) => void;
    startTime: string;
    setStartTime: (v: string) => void;
    isCalendarOpen: boolean;
    setIsCalendarOpen: (v: boolean) => void;
    filteredTimeSlots: string[];
    validateAndGetDateTime: () => any;
    couponCode: string;
    setCouponCode: (v: string) => void;
    handleCheckCoupon: () => void;
    isCheckingCoupon: boolean;
    couponStatus: any;
    setCouponStatus: (v: any) => void;
    setIsCouponApplied: (v: boolean) => void;
    isCouponApplied: boolean;
    discountedTotal: number | null;
    handleAddToCart: () => void;
    addingToCart: boolean;
    cartAdded: boolean;
    navigate: (path: string) => void;
    paymentMethods: PaymentMethod[];
    paymentType: string;
    setPaymentType: (v: string) => void;
    walletBalance: number;
    isWalletInsufficient: boolean;
    doCreateRequest: () => void;
    creating: boolean;
};

export const BookingBottomSheet: React.FC<Props> = ({
    bookingModal,
    setBookingModal,
    bookingStep,
    setBookingStep,
    product,
    t,
    isAr,
    startDate,
    setStartDate,
    startTime,
    setStartTime,
    isCalendarOpen,
    setIsCalendarOpen,
    filteredTimeSlots,
    validateAndGetDateTime,
    couponCode,
    setCouponCode,
    handleCheckCoupon,
    isCheckingCoupon,
    couponStatus,
    setCouponStatus,
    setIsCouponApplied,
    isCouponApplied,
    discountedTotal,
    handleAddToCart,
    addingToCart,
    cartAdded,
    navigate,
    paymentMethods,
    paymentType,
    setPaymentType,
    walletBalance,
    isWalletInsufficient,
    doCreateRequest,
    creating
}) => {
    return (
        <AnimatePresence>
            {bookingModal && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/40 z-[140]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setBookingModal(null)}
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        className="fixed max-w-[420px] bottom-0 left-1/2 w-full bg-white rounded-t-3xl z-[1500] flex flex-col max-h-[85vh]"
                        initial={{ y: "100%", x: "-50%" }}
                        animate={{ y: 0, x: "-50%" }}
                        exit={{ y: "100%", x: "-50%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Sheet Handle */}
                        <div className="flex-shrink-0 pt-3 pb-1 flex justify-center">
                            <div className="w-10 h-1 bg-app-card/50 rounded-full" />
                        </div>

                        {/* Step header */}
                        <div className="flex-shrink-0 flex items-center justify-between px-5 pb-3">
                            <div className="flex items-center gap-2">
                                {bookingStep > 1 && (
                                    <button
                                        onClick={() => setBookingStep((bookingStep - 1) as 1 | 2 | 3)}
                                        className="p-1.5 rounded-full hover:bg-app-bg transition-colors"
                                    >
                                        {isAr ? <ChevronRight size={20} className="text-app-textSec" /> : <ChevronLeft size={20} className="text-app-textSec" />}
                                    </button>
                                )}
                                <h3 className="text-base font-bold text-app-text">
                                    {bookingStep === 1 && t.detailsAndAppointment}
                                    {bookingStep === 2 && t.couponAndCheckout}
                                    {bookingStep === 3 && t.paymentMethod}
                                </h3>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Step dots */}
                                <div className="flex gap-1.5">
                                    {[1, 2, 3].map((s) => (
                                        <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${bookingStep === s ? "w-5 bg-app-gold" : "w-1.5 bg-app-card/40"}`} />
                                    ))}
                                </div>
                                <button onClick={() => setBookingModal(null)} className="p-1.5 rounded-full hover:bg-app-bg transition-colors">
                                    <X size={18} className="text-app-textSec" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable content */}
                        <div className="flex-1 overflow-visible px-5 pb-6 space-y-3">

                            {/* ── STEP 1: Service, Date, Time ─────────────────── */}
                            {bookingStep === 1 && (
                                <>
                                    <div className="flex justify-between items-center bg-app-bg/60 p-3 rounded-xl border border-app-card/30">
                                        <span className="text-xs text-app-textSec">{t.service}</span>
                                        <span className="text-sm font-semibold text-app-text">{product.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-app-bg/60 p-3 rounded-xl border border-app-card/30">
                                        <span className="text-xs text-app-textSec">{t.package}</span>
                                        <span className="text-sm font-semibold text-app-text">{bookingModal.title}</span>
                                    </div>
                                    {bookingModal.subscriptionId != null && (
                                        <>
                                            <div className="flex justify-between items-center bg-app-bg/60 p-3 rounded-xl border border-app-card/30">
                                                <span className="text-xs text-app-textSec">{t.sessionsCount}</span>
                                                <span className="text-sm font-semibold text-app-text">{bookingModal.sessionsCount}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-app-bg/60 p-3 rounded-xl border border-app-card/30">
                                                <span className="text-xs text-app-textSec">{t.validity}</span>
                                                <span className="text-sm font-semibold text-app-text">{bookingModal.validityDays || 30} {t.day}</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex justify-between items-center bg-app-bg/60 p-3 rounded-xl border border-app-card/30">
                                        <span className="text-xs text-app-textSec">{t.total}</span>
                                        <span className="text-sm font-bold text-app-gold">{bookingModal.finalTotal.toFixed(3)} {t.currency}</span>
                                    </div>

                                    {/* Date + Time */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-app-bg/60 rounded-xl border border-app-card/30 p-2 relative">
                                            <style>{calendarStyles}</style>
                                            <label className="block text-[11px] font-semibold text-app-text mb-1.5">{t.date}</label>
                                            <button
                                                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                                className="w-full bg-white rounded-xl p-1.5 text-sm outline-none border border-app-card/30 focus:border-app-gold text-start"
                                            >
                                                <span className={startDate ? "text-app-text" : "text-app-textSec/60"}>
                                                    {startDate || (t.chooseDate || "Select Date")}
                                                </span>
                                            </button>

                                            <AnimatePresence>
                                                {isCalendarOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-[1900]" onClick={() => setIsCalendarOpen(false)} />
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 8, scale: 0.97 }}
                                                            transition={{ duration: 0.18 }}
                                                            className="premium-calendar-container"
                                                            style={{
                                                                position: "fixed",
                                                                bottom: 220,
                                                                right: "0%",
                                                                transform: "translateX(-50%)",
                                                                zIndex: 2100,
                                                            }}
                                                        >
                                                            <DayPicker
                                                                mode="single"
                                                                selected={startDate ? new Date(startDate) : undefined}
                                                                onSelect={(date) => {
                                                                    if (!date) return;
                                                                    if ((product as any)?.id === 94 && isBookedDate(date)) {
                                                                        toast(t.bookedDates, {
                                                                            style: { background: "#dc3545", color: "#fff", borderRadius: "10px" }
                                                                        });
                                                                        return;
                                                                    }
                                                                    const y = date.getFullYear();
                                                                    const m = pad2(date.getMonth() + 1);
                                                                    const d = pad2(date.getDate());
                                                                    setStartDate(`${y}-${m}-${d}`);
                                                                    setIsCalendarOpen(false);
                                                                }}
                                                                disabled={[
                                                                    { before: (product as any)?.id === 94 ? addDays(new Date(), 1) : new Date() },
                                                                    (date) => (product as any)?.id === 94 ? isBookedDate(date) : false
                                                                ]}
                                                                modifiers={{ booked: (date) => (product as any)?.id === 94 ? isBookedDate(date) : false }}
                                                                modifiersClassNames={{ booked: "booked-day" }}
                                                                locale={isAr ? arLocale : undefined}
                                                                dir={isAr ? "rtl" : "ltr"}
                                                                components={{
                                                                    DayButton: ({ day, modifiers, children, ...props }: any) => {
                                                                        const isProduct94 = (product as any)?.id === 94;
                                                                        const booked = isProduct94 && isBookedDate(day.date);
                                                                        return (
                                                                            <button
                                                                                {...props}
                                                                                className={`${props.className ?? ""}${booked ? " booked-day" : ""}`}
                                                                            >
                                                                                {children}
                                                                                {booked && (
                                                                                    <span className="booked-day-label">
                                                                                        {isAr ? "محجوز" : "booked"}
                                                                                    </span>
                                                                                )}
                                                                            </button>
                                                                        );
                                                                    }
                                                                }}
                                                            />
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div className="bg-app-bg/60 rounded-xl border border-app-card/30 p-2">
                                            <label className="block text-[11px] font-semibold text-app-text mb-1.5">{t.time}</label>
                                            <select
                                                className="w-full bg-white rounded-xl p-1.5 text-sm outline-none border border-app-card/30 focus:border-app-gold appearance-none"
                                                value={startTime.slice(0, 5)}
                                                onChange={(e) => setStartTime(e.target.value)}
                                            >
                                                <option value="">{t.chooseTime}</option>
                                                {filteredTimeSlots.map((time) => {
                                                    const [hStr, mStr] = time.split(":");
                                                    const h = parseInt(hStr, 10);
                                                    const period = h < 12 ? "ص" : "م";
                                                    const displayH = h % 12 || 12;
                                                    return (
                                                        <option key={time} value={time}>{displayH}:{mStr} {period}</option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (validateAndGetDateTime()) setBookingStep(2);
                                        }}
                                        className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-[0.98] transition-transform mt-1"
                                    >
                                        {t.next} {isAr ? '←' : '→'}
                                    </button>
                                </>
                            )}

                            {/* ── STEP 2: Coupon + Add to Cart vs Checkout ─────── */}
                            {bookingStep === 2 && (
                                <>
                                    {/* Coupon */}
                                    <div className="bg-app-bg/60 rounded-xl border border-app-card/30 p-3">
                                        <label className="block text-[11px] font-semibold text-app-text mb-2">{t.couponCode}</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className="flex-1 bg-white rounded-xl px-3 py-2 text-sm outline-none border border-app-card/30 focus:border-app-gold"
                                                placeholder={t.couponCode}
                                                value={couponCode}
                                                onChange={(e) => { setCouponCode(e.target.value); setCouponStatus(null); setIsCouponApplied(false); }}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleCheckCoupon}
                                                disabled={isCheckingCoupon || !couponCode.trim()}
                                                className="bg-app-gold text-white text-xs font-bold px-4 rounded-xl disabled:opacity-50 whitespace-nowrap"
                                            >
                                                {isCheckingCoupon ? t.checkingCoupon : t.apply}
                                            </button>
                                        </div>
                                        {couponStatus && (
                                            <p className={`text-[10px] mt-1.5 font-medium ${couponStatus.valid ? "text-green-600" : "text-red-500"}`}>
                                                {couponStatus.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Total with discount */}
                                    <div className="flex justify-between items-center bg-app-bg/60 p-3 rounded-xl border border-app-card/30">
                                        <span className="text-xs text-app-textSec">{t.total}</span>
                                        <div className="flex flex-col items-end">
                                            {discountedTotal !== null ? (
                                                <>
                                                    <span className="text-[10px] text-app-textSec line-through opacity-60">
                                                        {bookingModal.finalTotal.toFixed(3)} {t.currency}
                                                    </span>
                                                    <span className="text-sm font-bold text-app-gold">{discountedTotal.toFixed(3)} {t.currency}</span>
                                                </>
                                            ) : (
                                                <span className="text-sm font-bold text-app-gold">{bookingModal.finalTotal.toFixed(3)} {t.currency}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <button
                                        onClick={() => setBookingStep(3)}
                                        className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                                    >
                                        <CreditCard size={18} />
                                        {(discountedTotal ?? bookingModal.finalTotal) === 0
                                            ? t.proceed
                                            : t.proceedToCheckout
                                        }
                                    </button>

                                    <button
                                        onClick={handleAddToCart}
                                        disabled={addingToCart}
                                        className="w-full bg-white border-2 border-app-gold text-app-gold font-semibold py-4 rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
                                    >
                                        {addingToCart
                                            ? <Loader2 size={18} className="animate-spin" />
                                            : <ShoppingBag size={18} />
                                        }
                                        {addingToCart ? t.addingToCart : t.addToCart}
                                    </button>
                                </>
                            )}

                            {/* ── STEP 3a: Added to Cart — continue or go to cart ─ */}
                            {bookingStep === 3 && cartAdded && (
                                <motion.div
                                    className="flex flex-col items-center text-center py-4"
                                    initial={{ opacity: 0, scale: 0.88 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] as const }}
                                >
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                        <ShoppingCart size={32} className="text-green-500" />
                                    </div>
                                    <h3 className="text-base font-bold text-app-text mb-1">
                                        {t.addedToCart}
                                    </h3>
                                    <p className="text-sm text-app-textSec mb-6">
                                        {t.addedToCartDesc}
                                    </p>
                                    <div className="w-full space-y-3">
                                        <button
                                            onClick={() => navigate("/cart")}
                                            className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                                        >
                                            <ShoppingCart size={18} />
                                            {t.goToCart}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setBookingModal(null)
                                                navigate("/")
                                            }}
                                            className="w-full bg-white border-2 border-app-gold text-app-gold font-semibold py-4 rounded-2xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                                        >
                                            <ShoppingBag size={18} />
                                            {t.continueShopping}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── STEP 3b: Payment Method + Confirm ─────────────── */}
                            {bookingStep === 3 && !cartAdded && (() => {
                                const effectiveTotal = discountedTotal ?? bookingModal.finalTotal;
                                const isFree = effectiveTotal === 0;
                                return (
                                <>
                                    {/* Total reminder */}
                                    <div className="flex justify-between items-center bg-app-bg/60 px-4 py-3 rounded-xl border border-app-card/30">
                                        <span className="text-sm text-app-textSec">{t.totalAmount}</span>
                                        <span className="text-lg font-bold text-app-gold">
                                            {effectiveTotal.toFixed(3)} {t.currency}
                                        </span>
                                    </div>

                                    {/* Wallet warning — hidden when free */}
                                    {!isFree && isWalletInsufficient && (
                                        <p className="text-[11px] text-red-500 font-medium px-1">
                                            {t.insufficientBalance} ({walletBalance.toFixed(3)} {t.currency})
                                        </p>
                                    )}

                                    {/* Payment methods — hidden when total is 0 */}
                                    {!isFree && (
                                        <div className="space-y-2">
                                            {paymentMethods.map((p) => {
                                                const isActive = paymentType === p.code;
                                                const isApple = p.code === "apple_pay";
                                                return (
                                                    <button
                                                        key={p.code}
                                                        type="button"
                                                        onClick={() => setPaymentType(p.code)}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${isActive
                                                            ? isApple ? "bg-black text-white border-black" : "border-app-gold bg-app-gold/5"
                                                            : "border-app-card/30 bg-white"
                                                            }`}
                                                    >
                                                        {p.code === "wallet"
                                                            ? <Wallet size={20} className={isActive ? "text-app-gold" : "text-app-textSec"} />
                                                            : <img src={p.icon} alt={p.name_en} className="h-5 object-contain rounded-sm" />
                                                        }
                                                        <span className={`flex-1 text-sm font-semibold text-start ${isActive && !isApple ? "text-app-gold" : "text-app-text"}`}>
                                                            {isAr ? p.name_ar : p.name_en}
                                                        </span>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isActive ? "border-app-gold bg-app-gold" : "border-app-card/50"}`}>
                                                            {isActive && <div className="w-2 h-2 bg-white rounded-full" />}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Confirm */}
                                    <button
                                        onClick={doCreateRequest}
                                        disabled={creating || (!isFree && isWalletInsufficient)}
                                        className="w-full bg-app-gold text-white font-semibold py-4 rounded-2xl shadow-lg shadow-app-gold/30 active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
                                    >
                                        {creating
                                            ? <Loader2 size={18} className="animate-spin" />
                                            : <Check size={18} />
                                        }
                                        {creating ? t.bookingInProgress : isFree ? t.confirmBooking : t.agreeAndConfirm}
                                    </button>
                                </>
                                );
                            })()}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
