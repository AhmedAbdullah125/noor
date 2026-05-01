"use client";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Product, ServiceAddon, ServiceAddonGroup, ServiceSubscription } from "../../types";
import { createRequest } from "../services/createRequest";
import { useAddToCart } from "../services/useAddToCart";
import { getLang, translations } from "../../services/i18n";
import { API_BASE_URL } from "@/lib/apiConfig";
import { useGetProfile } from "../services/useGetProfile";
import { useGetPaymentMethods } from "../services/useGetPaymentMethods";

// Sub-components
import { ServiceHeader } from "./service-details/ServiceHeader";
import { AddonGroups } from "./service-details/AddonGroups";
import { SubscriptionPackages } from "./service-details/SubscriptionPackages";
import { BookingBottomSheet } from "./service-details/BookingBottomSheet";
import { parsePrice, getTodayDate, timeSlots } from "./service-details/utils";

type Props = {
    product: Product;
    onBack: () => void;
    onCreated?: (data: any) => void;
    onModalToggle?: (isOpen: boolean) => void;
};

export default function ServiceDetails({ product, onBack, onCreated, onModalToggle }: Props) {
    const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
    const lang = getLang();
    const t = translations[lang];
    const isAr = lang === 'ar';

    const navigate = useNavigate();
    const [creating, setCreating] = useState(false);
    const [cartAdded, setCartAdded] = useState(false);

    const { mutate: addToCart, isPending: addingToCart } = useAddToCart({
        successMessage: t.addToCartSuccess,
        onSuccess: () => {
            setCartAdded(true);
            setBookingStep(3);
        },
    });

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
    const [startDate, setStartDate] = useState<string>("");
    const [startTime, setStartTime] = useState<string>("");
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);

    const filteredTimeSlots = useMemo(() => {
        const today = getTodayDate();
        if (startDate !== today) return timeSlots;

        const now = new Date();
        const curH = now.getHours();
        const curM = now.getMinutes();

        return timeSlots.filter(slot => {
            const [h, m] = slot.split(":").map(Number);
            return h > curH || (h === curH && m >= curM);
        });
    }, [startDate]);

    useEffect(() => {
        if (startTime && !filteredTimeSlots.includes(startTime)) {
            setStartTime("");
        }
    }, [filteredTimeSlots, startTime]);

    const { data: profile } = useGetProfile(lang);
    const [couponCode, setCouponCode] = useState("");
    const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
    const [couponStatus, setCouponStatus] = useState<{ valid: boolean; message: string; discount_type?: string; discount_value?: number } | null>(null);
    const [isCouponApplied, setIsCouponApplied] = useState(false);

    const walletBalance = useMemo(() => parsePrice(profile?.wallet ?? 0), [profile?.wallet]);

    const isWalletInsufficient = useMemo(() => {
        if (paymentType !== 'wallet' || !bookingModal) return false;
        return walletBalance < bookingModal.finalTotal;
    }, [paymentType, bookingModal, walletBalance]);

    useEffect(() => {
        onModalToggle?.(!!bookingModal);
        return () => onModalToggle?.(false);
    }, [bookingModal, onModalToggle]);

    useEffect(() => {
        setSelectedAddonIds(new Set());
        setBookingModal(null);
        setPaymentType("wallet");
        setStartDate("");
        setStartTime("");
        setCouponCode("");
        setIsCheckingCoupon(false);
        setCouponStatus(null);
        setIsCouponApplied(false);
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

    const priceData = useMemo(() => ({
        base: basePrice,
        addons: addonsTotal,
        total,
        display: `${total.toFixed(3)} ${t.currency}`,
        duration: (product as any)?.duration || "0",
    }), [basePrice, addonsTotal, total, t.currency]);

    const { data: paymentMethods = [] } = useGetPaymentMethods(total);

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
                out.push({ option_id: Number(group.id), option_value_id: Number(opt.id) });
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

    const discountedTotal = useMemo(() => {
        if (!bookingModal || !isCouponApplied || !couponStatus?.valid) return null;
        const subTotal = bookingModal.finalTotal;
        if (couponStatus.discount_type === "fixed") {
            return Math.max(0, subTotal - (couponStatus.discount_value || 0));
        }
        if (couponStatus.discount_type === "percentage") {
            return subTotal * (1 - (couponStatus.discount_value || 0) / 100);
        }
        return null;
    }, [bookingModal, isCouponApplied, couponStatus]);

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
        setCouponCode("");
        setIsCheckingCoupon(false);
        setCouponStatus(null);
        setIsCouponApplied(false);
        setBookingStep(1);
        setCartAdded(false);
    };

    const handleCheckCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsCheckingCoupon(true);
        setCouponStatus(null);
        setIsCouponApplied(false);

        try {
            const formData = new FormData();
            formData.append("code", couponCode);
            formData.append("service_id", String(product.id));

            const res = await fetch(`${API_BASE_URL}/coupons/check`, { method: "POST", body: formData });
            const data = await res.json();

            if (data.status && data.data?.valid) {
                const coupon = data.data.coupon;
                setCouponStatus({
                    valid: true,
                    message: t.couponValid,
                    discount_type: coupon.discount_type,
                    discount_value: parsePrice(coupon.discount_value),
                });
                setIsCouponApplied(true);
            } else {
                setCouponStatus({ valid: false, message: data.data?.message || t.couponInvalid });
                setIsCouponApplied(false);
            }
        } catch (error) {
            console.error("Coupon check failed", error);
            setCouponStatus({ valid: false, message: t.couponInvalid });
            setIsCouponApplied(false);
        } finally {
            setIsCheckingCoupon(false);
        }
    };

    const validateAndGetDateTime = () => {
        const time = startTime.length === 5 ? `${startTime}:00` : startTime;
        if (!startDate) {
            toast(t.pleaseSelectDate, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            return null;
        }
        if (!time || time.length < 5) {
            toast(t.pleaseSelectTime, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            return null;
        }
        return { startDate, time };
    };

    const doCreateRequest = async () => {
        if (creating || !bookingModal || !validateRequiredGroups()) return;
        if (paymentType === 'wallet' && isWalletInsufficient) {
            toast.error(t.insufficientBalance, { style: { background: "#dc3545", color: "#fff", borderRadius: "10px" } });
            return;
        }

        const dateTime = validateAndGetDateTime();
        if (!dateTime) return;
        const { startDate, time } = dateTime;

        setCreating(true);
        const payload = {
            service_id: Number(product.id),
            subscription_id: bookingModal.subscriptionId,
            options: buildRequestOptions(),
            start_date: startDate,
            start_time: time,
            payment_type: paymentType,
            coupon_code: isCouponApplied ? couponCode : undefined,
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

    const handleAddToCart = () => {
        if (!bookingModal || !validateRequiredGroups()) return;
        const dateTime = validateAndGetDateTime();
        if (!dateTime) return;
        const { startDate, time } = dateTime;

        addToCart({
            service_id: Number(product.id),
            subscription_id: bookingModal.subscriptionId,
            options: buildRequestOptions(),
            start_date: startDate,
            start_time: time,
            coupon_code: isCouponApplied && couponCode.trim() ? couponCode : undefined,
            lang,
        });
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
        <div className="pt-2" dir={isAr ? "rtl" : "ltr"}>
            <BookingBottomSheet
                bookingModal={bookingModal}
                setBookingModal={setBookingModal}
                bookingStep={bookingStep}
                setBookingStep={setBookingStep}
                product={product}
                t={t}
                isAr={isAr}
                startDate={startDate}
                setStartDate={setStartDate}
                startTime={startTime}
                setStartTime={setStartTime}
                isCalendarOpen={isCalendarOpen}
                setIsCalendarOpen={setIsCalendarOpen}
                filteredTimeSlots={filteredTimeSlots}
                validateAndGetDateTime={validateAndGetDateTime}
                couponCode={couponCode}
                setCouponCode={setCouponCode}
                handleCheckCoupon={handleCheckCoupon}
                isCheckingCoupon={isCheckingCoupon}
                couponStatus={couponStatus}
                setCouponStatus={setCouponStatus}
                setIsCouponApplied={setIsCouponApplied}
                isCouponApplied={isCouponApplied}
                discountedTotal={discountedTotal}
                handleAddToCart={handleAddToCart}
                addingToCart={addingToCart}
                cartAdded={cartAdded}
                navigate={navigate}
                paymentMethods={paymentMethods}
                paymentType={paymentType}
                setPaymentType={setPaymentType}
                walletBalance={walletBalance}
                isWalletInsufficient={isWalletInsufficient}
                doCreateRequest={doCreateRequest}
                creating={creating}
            />

            <ServiceHeader
                product={product}
                images={getImages()}
                descriptionCharLimit={descriptionCharLimit}
                isDescriptionExpanded={isDescriptionExpanded}
                setIsDescriptionExpanded={setIsDescriptionExpanded}
                priceData={priceData}
                t={t}
                hasAddons={resolvedAddonGroups.length > 0}
            />

            <AddonGroups
                resolvedAddonGroups={resolvedAddonGroups}
                selectedAddonIds={selectedAddonIds}
                handleGroupOptionSelect={handleGroupOptionSelect}
                t={t}
                isAr={isAr}
                canSubscribe={canSubscribe}
            />

            <SubscriptionPackages
                product={product}
                priceData={priceData}
                canSubscribe={canSubscribe}
                creating={creating}
                handleSubscriptionClick={handleSubscriptionClick}
                handleSingleSessionClick={handleSingleSessionClick}
                t={t}
                isAr={isAr}
            />
        </div>
    );
}
