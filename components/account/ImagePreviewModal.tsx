// src/components/account/ImagePreviewModal.tsx
import React from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import AppImage from "../AppImage";
import { UserImage } from "../services/useGetUserImages";

type Props = {
    image: UserImage;
    images: UserImage[];
    isOpen: boolean;
    onClose: () => void;
    lang: "ar" | "en";
};

export default function ImagePreviewModal({
    image,
    images,
    isOpen,
    onClose,
    lang,
}: Props) {
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
        if (isOpen && image) {
            const index = images.findIndex((img) => img.id === image.id);
            setCurrentIndex(index >= 0 ? index : 0);
        }
    }, [isOpen, image, images]);

    if (!isOpen) return null;

    const currentImage = images[currentIndex];
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < images.length - 1;

    const handlePrevious = () => {
        if (hasPrevious) setCurrentIndex(currentIndex - 1);
    };

    const handleNext = () => {
        if (hasNext) setCurrentIndex(currentIndex + 1);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-fadeIn"
            onClick={onClose}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
                <X size={24} className="text-white" />
            </button>

            {/* Image Container */}
            <div
                className="relative w-full max-w-4xl mx-auto px-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Image */}
                <div className="relative w-full aspect-square bg-black/30 rounded-2xl overflow-hidden">
                    <AppImage
                        src={currentImage.image}
                        alt={`Image ${currentImage.id}`}
                        className="w-full h-full object-contain"
                    />
                </div>

                {/* Image Info */}
                <div className="mt-4 text-center text-white">
                    <p className="text-sm opacity-70">
                        {formatDate(currentImage.created_at)}
                    </p>
                    <p className="text-xs opacity-50 mt-1">
                        {currentIndex + 1} / {images.length}
                    </p>
                </div>

                {/* Navigation Arrows */}
                {hasPrevious && (
                    <button
                        onClick={handlePrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <ChevronLeft size={28} className="text-white" />
                    </button>
                )}

                {hasNext && (
                    <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <ChevronRight size={28} className="text-white" />
                    </button>
                )}
            </div>
        </div>
    );
}
