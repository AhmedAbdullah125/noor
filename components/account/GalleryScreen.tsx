// src/components/account/GalleryScreen.tsx
import React, { useState, useRef } from "react";
import { ChevronLeft, Upload, ImageIcon, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AppHeader from "../AppHeader";
import AppImage from "../AppImage";
import { translations, getLang } from "@/services/i18n";
import { useGetUserImages, UserImage } from "../services/useGetUserImages";
import { useUploadUserImages } from "../services/useUploadUserImages";
import { useDeleteUserImage } from "../services/useDeleteUserImage";
import ImagePreviewModal from "./ImagePreviewModal";

type Props = {
    userId: number | undefined;
    onBack: () => void;
};

export default function GalleryScreen({ userId, onBack }: Props) {
    const lang = getLang();
    const t = translations[lang] || translations["ar"];
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedImage, setSelectedImage] = useState<UserImage | null>(null);
    const [imageToDelete, setImageToDelete] = useState<UserImage | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, isLoading, isError, refetch } = useGetUserImages(
        userId,
        currentPage,
        lang
    );
    const uploadMutation = useUploadUserImages(lang);
    const deleteMutation = useDeleteUserImage(userId, lang);

    const images = data?.data?.data || [];
    const meta = data?.data?.meta;
    const hasNextPage = meta && meta.current_page < meta.last_page;
    const hasPrevPage = meta && meta.current_page > 1;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const files = e.target.files;
            if (!files || files.length === 0 || !userId) return;

            const imageFiles: File[] = (Array.from(files) as File[]).filter((file: File) =>
                file.type.startsWith("image/")
            );

            if (imageFiles.length === 0) {
                toast.error(t.uploadFailed || "Please select valid image files", {
                    style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
                });
                return;
            }

            if (imageFiles.length > 0) {
                uploadMutation.mutate({ userId, images: imageFiles });
            }
        } catch (error) {
            console.error("Error selecting files:", error);
            toast.error(t.uploadFailed || "Error selecting images", {
                style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
            });
        } finally {
            // Always reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div
            className="animate-fadeIn flex flex-col h-full bg-app-bg"
            dir={lang === "ar" ? "rtl" : "ltr"}
        >
            <AppHeader title={t.galleryTitle} onBack={onBack} />

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-28 pt-24">

                {/* Upload Button */}
                <button
                    onClick={handleUploadClick}
                    disabled={uploadMutation.isPending}
                    className="w-full bg-app-gold text-white font-semibold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 mb-6 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Upload size={20} />
                    <span>
                        {uploadMutation.isPending ? t.uploadingImages : t.uploadImages}
                    </span>
                </button>

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Loading State */}
                {isLoading && (
                    <div className="grid grid-cols-3 gap-3">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="aspect-square bg-gray-200 rounded-2xl animate-pulse"
                            />
                        ))}
                    </div>
                )}

                {/* Error State */}
                {isError && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-red-500 text-sm mb-4">{t.errorLoading}</p>
                        <button
                            onClick={() => refetch()}
                            className="text-app-gold font-semibold text-sm"
                        >
                            {t.retry}
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !isError && images.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-20 h-20 bg-app-bg rounded-full flex items-center justify-center mb-4">
                            <ImageIcon size={40} className="text-app-textSec opacity-40" />
                        </div>
                        <h3 className="text-app-text font-semibold text-lg mb-2">
                            {t.noImages}
                        </h3>
                        <p className="text-app-textSec text-sm text-center">
                            {t.noImagesDesc}
                        </p>
                    </div>
                )}

                {/* Image Grid */}
                {!isLoading && !isError && images.length > 0 && (
                    <>
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {images.map((image) => (
                                <div key={image.id} className="relative group aspect-square">
                                    <button
                                        onClick={() => setSelectedImage(image)}
                                        className="w-full h-full bg-gray-100 rounded-2xl overflow-hidden border border-app-card/30 active:scale-95 transition-transform"
                                    >
                                        <AppImage
                                            src={image.image}
                                            alt={`Image ${image.id}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>

                                    {/* Delete X Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setImageToDelete(image);
                                        }}
                                        className="absolute top-1.5 end-1.5 z-10 w-6 h-6 bg-red-500 hover:bg-red-600 active:scale-90 rounded-full flex items-center justify-center shadow-md transition-all"
                                        aria-label={t.deleteImage}
                                    >
                                        <Trash2 size={13} className="text-white" strokeWidth={3} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {meta && meta.last_page > 1 && (
                            <div className="flex items-center justify-center gap-4 py-4">
                                <button
                                    onClick={() => setCurrentPage((p) => p - 1)}
                                    disabled={!hasPrevPage}
                                    className="px-4 py-2 bg-white rounded-xl text-sm font-semibold text-app-text disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                                >
                                    {t.previous}
                                </button>

                                <span className="text-sm text-app-textSec">
                                    {t.page} {meta.current_page} {t.of} {meta.last_page}
                                </span>

                                <button
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                    disabled={!hasNextPage}
                                    className="px-4 py-2 bg-white rounded-xl text-sm font-semibold text-app-text disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                                >
                                    {t.next}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Image Preview Modal */}
            {selectedImage && (
                <ImagePreviewModal
                    image={selectedImage}
                    images={images}
                    isOpen={!!selectedImage}
                    onClose={() => setSelectedImage(null)}
                    lang={lang}
                />
            )}

            {/* Delete Confirmation Dialog */}
            {imageToDelete && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
                    onClick={() => setImageToDelete(null)}
                >
                    <div
                        className="bg-app-card rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fadeIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center">
                                <Trash2 size={28} className="text-red-500" />
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-app-text font-bold text-lg text-center mb-2">
                            {t.deleteImage}
                        </h3>

                        {/* Message */}
                        <p className="text-app-textSec text-sm text-center mb-6">
                            {t.confirmDeleteImage}
                        </p>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setImageToDelete(null)}
                                className="flex-1 py-3 rounded-2xl border border-app-card/50 text-app-textSec font-semibold text-sm active:scale-95 transition-all"
                            >
                                {t.cancel}
                            </button>
                            <button
                                onClick={() => {
                                    deleteMutation.mutate(imageToDelete.id);
                                    setImageToDelete(null);
                                }}
                                disabled={deleteMutation.isPending}
                                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deleteMutation.isPending ? t.deleting : t.delete}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
