'use client';

import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import AppHeader from "../AppHeader";
import AppImage from "../AppImage";
import HomeDrawer from "./HomeDrawer";
import { useHomeData } from "./useHomeData";
import type { Product, ServiceAddon, ServicePackageOption } from "@/types";
import { ArrowLeft, Menu, ShoppingCart } from "lucide-react";
import { getLang, setLang, translations, Locale } from "../../services/i18n";
import HomeLanding from "./HomeLanding";
import CategoryServicesGrid from "./CategoryServicesGrid";
import ServiceDetails from "./ServiceDetails";
import { useGetCart } from "../services/useGetCart";
import { useGetService } from "../services/useGetService";
import { mapServicesToProducts } from "./serviceMappers";
import { http } from "../services/http";
import { API_BASE_URL } from "@/lib/apiConfig";
import { isCompleteCartCheckoutItems } from "../services/useCartCheckout";

type Props = {
    onBook: (product: Product, quantity: number, selectedAddons?: ServiceAddon[], packageOption?: ServicePackageOption, customFinalPrice?: number) => void;
    favourites: number[];
    onToggleFavourite: (productId: number) => void;
};

const fadeSlideUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
};

export default function HomeTab({ onBook, favourites, onToggleFavourite }: Props) {
    const navigate = useNavigate();
    const location = useLocation();
    const { productId, categoryName } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

    const [lang, setCurrentLang] = useState<Locale>(getLang());
    const t = translations[lang];

    // Browser return URLs are never payment authority. Resolve the stored
    // checkout reference against the authenticated backend instead.
    useEffect(() => {
        if (searchParams.get('payment_returned') !== '1') return;

        const reference = sessionStorage.getItem('payment_checkout_reference');
        const resolveReturn = async () => {
            if (!reference) {
                toast(lang === 'ar' ? 'تم استلام نتيجة الدفع. تحقق من حجوزاتك.' : 'Payment result received. Check your bookings.');
                setSearchParams({}, { replace: true });
                return;
            }

            try {
                const response = await http.get(`${API_BASE_URL}/checkouts/${reference}`);
                const checkout = response.data?.data ?? response.data?.items;
                if (!isCompleteCartCheckoutItems(checkout)) {
                    toast.error(t.tryAgainLater);
                    setSearchParams({}, { replace: true });
                    return;
                }

                setSearchParams({}, { replace: true });
                if (checkout.payment_status === 'paid') {
                    sessionStorage.removeItem('payment_checkout_reference');
                    navigate('/cart', { replace: true, state: { checkoutResult: checkout } });
                } else if (checkout.payment_status === 'failed' || checkout.status === 'failed') {
                    sessionStorage.removeItem('payment_checkout_reference');
                    toast.error(t.tryAgainLater);
                    navigate('/cart', { replace: true, state: { checkoutResult: checkout } });
                } else {
                    toast(t.paymentPending);
                    navigate('/cart', { replace: true, state: { checkoutResult: checkout } });
                }
            } catch {
                toast.error(t.tryAgainLater);
                setSearchParams({}, { replace: true });
            }
        };

        void resolveReturn();
    }, [searchParams, setSearchParams, navigate, lang, t.paymentPending, t.tryAgainLater]);

    const toggleLang = () => {
        const newLang = lang === 'ar' ? 'en' : 'ar';
        setCurrentLang(newLang);
        setLang(newLang);
        window.location.reload();
    };

    const { categories, banners, products, isLoading, socialLinks } = useHomeData(lang, 1);
    const { data: cart } = useGetCart();
    const cartCount = cart?.items?.length ?? 0;
    const serviceDetailQuery = useGetService(lang, productId);

    const selectedProduct = useMemo(() => {
        if (!productId) return null;
        if (!serviceDetailQuery.data) return null;
        return mapServicesToProducts([serviceDetailQuery.data])[0] ?? null;
    }, [productId, serviceDetailQuery.data]);

    const activeCategory = categoryName || null;

    // Key changes per view so AnimatePresence re-triggers the animation on navigation
    const viewKey = selectedProduct
        ? `product-${selectedProduct.id}`
        : activeCategory
            ? `category-${activeCategory}`
            : "home";

    return (
        <div className="flex flex-col items-center h-[100vh] bg-app-bg relative font-active overflow-hidden">
            <HomeDrawer
                open={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                socialLinks={socialLinks}
                onNavigate={(path) => navigate(path)}
                lang={lang}
                onToggleLang={toggleLang}
            />

            {/* Header slides down on mount */}
            <motion.div
                className="w-full"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }}
            >
                <AppHeader
                    actionStart={
                        selectedProduct ? (
                            <div className="flex justify-end">
                                <button
                                    onClick={() => {
                                        const fromState = location.state as { from?: string } | undefined;
                                        navigate(fromState?.from || "/");
                                    }}
                                    className="p-2 bg-white rounded-full shadow-sm text-app-text hover:bg-app-card transition-colors flex items-center gap-2"
                                >
                                    <span className="text-sm font-normal">{t.back}</span>
                                    <ArrowLeft size={20} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => navigate("/cart")}
                                className="relative p-2 text-app-text hover:bg-app-card rounded-full transition-colors flex-shrink-0"
                            >
                                <ShoppingCart size={22} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-app-gold text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        )
                    }
                    title={
                        <div
                            className="flex items-center justify-center gap-2 px-2 cursor-pointer w-full"
                            onClick={() => navigate("/")}
                        >

                            <span className="text-lg font-semibold text-app-text font-active truncate">
                                {t.appName}
                            </span>
                        </div>
                    }
                    actionEnd={
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsMenuOpen(true)}
                                className="p-2 text-app-text hover:bg-app-card rounded-full transition-colors flex-shrink-0"
                            >
                                <Menu size={24} />
                            </button>
                        </div>
                    }
                />
            </motion.div>

            <main className={`flex-1 ${isBookingModalOpen ? "overflow-hidden" : "overflow-y-auto"} w-full pb-28 pt-24`}>
                <AnimatePresence mode="wait">
                    <motion.div key={viewKey} {...fadeSlideUp} className="h-full">
                        {productId && serviceDetailQuery.isLoading ? (
                            <div className="px-6 py-12 text-sm text-app-textSec">{t.loadingData}</div>
                        ) : productId && serviceDetailQuery.isError ? (
                            <div className="px-6 py-12 text-sm text-red-500">{t.errorLoading}</div>
                        ) : selectedProduct ? (
                            <ServiceDetails
                                product={selectedProduct}
                                onBack={() => {
                                    const fromState = location.state as { from?: string } | undefined;
                                    navigate(fromState?.from || "/");
                                }}
                                onCreated={(data) => {
                                    navigate("/account", { state: { createdRequest: true, request: data } });
                                }}
                                onModalToggle={setIsBookingModalOpen}
                            />
                        ) : !activeCategory ? (
                            <HomeLanding
                                isLoading={isLoading}
                                banners={banners}
                                categories={categories}
                                onCategoryClick={(id) => navigate(`/brand/${id}`)}
                                lang={lang}
                            />
                        ) : (
                            <CategoryServicesGrid
                                title={activeCategory}
                                products={products}
                                favourites={favourites}
                                onToggleFavourite={onToggleFavourite}
                                onBook={onBook}
                                onBack={() => navigate("/")}
                                onProductClick={(p) =>
                                    navigate(`/product/${p.id}`, {
                                        state: { from: `/category/${activeCategory}` },
                                    })
                                }
                                lang={lang}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
