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

    // Handle payment callback
    useEffect(() => {
        const orderId = searchParams.get('orderId');
        const status = searchParams.get('status');
        const paymentStatus = searchParams.get('paymentStatus');

        if (orderId && status) {
            if (status === 'success' || paymentStatus === 'paid') {
                toast.success(
                    lang === 'ar' ? 'تمت عملية الدفع بنجاح!' : 'Payment completed successfully!',
                    {
                        style: { background: "#198754", color: "#fff", borderRadius: "10px" },
                        duration: 4000
                    }
                );
            } else if (status === 'failed' || paymentStatus === 'unpaid') {
                toast.error(
                    lang === 'ar' ? 'فشلت عملية الدفع. يرجى المحاولة مرة أخرى.' : 'Payment failed. Please try again.',
                    {
                        style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
                        duration: 5000
                    }
                );
            }
            setSearchParams({});
            setTimeout(() => {
                navigate('/appointments', { replace: true });
            }, 1500);
        }
    }, [searchParams, setSearchParams, navigate, lang]);

    const toggleLang = () => {
        const newLang = lang === 'ar' ? 'en' : 'ar';
        setCurrentLang(newLang);
        setLang(newLang);
        window.location.reload();
    };

    const { categories, banners, products, isLoading, socialLinks } = useHomeData(lang, 1);
    const { data: cart } = useGetCart();
    const cartCount = cart?.items?.length ?? 0;

    const selectedProduct = useMemo(() => {
        if (!productId) return null;
        return products.find((p) => p.id === Number(productId)) ?? null;
    }, [productId, products]);

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
                        {selectedProduct ? (
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
