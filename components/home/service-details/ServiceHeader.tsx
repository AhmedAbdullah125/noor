import React from "react";
import { motion } from "framer-motion";
import parse from "html-react-parser";
import { Product } from "../../../types";
import ImageCarousel from "@/components/ImageCarousel";

type Props = {
    product: Product;
    images: string[];
    descriptionCharLimit: number;
    isDescriptionExpanded: boolean;
    setIsDescriptionExpanded: (v: boolean) => void;
    priceData: {
        base: number;
        addons: number;
        total: number;
        display: string;
    };
    t: any;
    hasAddons: boolean;
};

export const ServiceHeader: React.FC<Props> = ({
    product,
    images,
    descriptionCharLimit,
    isDescriptionExpanded,
    setIsDescriptionExpanded,
    priceData,
    t,
    hasAddons
}) => {
    return (
        <>
            {/* Image */}
            <motion.div
                className="px-6 mb-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }}
            >
                <div className="w-full aspect-square rounded-[2.5rem] overflow-hidden shadow-md bg-white border border-app-card/30">
                    <ImageCarousel images={images} alt={product.name} className="w-full h-full" />
                </div>
            </motion.div>

            {/* Product info */}
            <motion.div
                className="px-8 mb-4"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.38, delay: 0.1, ease: [0.4, 0, 0.2, 1] as const }}
            >
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
                    {hasAddons && (
                        <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg">
                            {t.optionalAddons}
                        </span>
                    )}
                </div>

                <div className="flex flex-col gap-1 mt-2">
                    {
                        product.price && parseFloat(String(product.price).replace(/[^\d.]/g, "")) > 0 ? (
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-semibold text-app-gold">{priceData.display}</span>
                                {(product as any).oldPrice && (
                                    <span className="text-sm text-app-textSec line-through opacity-60">{(product as any).oldPrice}</span>
                                )}
                            </div>
                        ) : null
                    }

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
            </motion.div>
        </>
    );
};
