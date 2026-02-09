"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import Cookies from "js-cookie";
import imageCompression from "browser-image-compression";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";
import { translations, getLang } from "@/services/i18n";

type UploadImagesPayload = {
    userId: number;
    images: File[];
};

async function compressImage(file: File): Promise<File> {
    const options = {
        maxSizeMB: 1, // Max file size 1MB
        maxWidthOrHeight: 1920, // Max dimension
        useWebWorker: true,
        fileType: "image/webp", // Convert to WebP
    };

    try {
        const compressedFile = await imageCompression(file, options);
        return compressedFile;
    } catch (error) {
        console.error("Error compressing image:", error);
        return file; // Return original if compression fails
    }
}

async function uploadUserImages(
    payload: UploadImagesPayload,
    lang: string
): Promise<any> {
    const formData = new FormData();
    formData.append("user_id", payload.userId.toString());

    // Compress images before uploading
    const compressedImages = await Promise.all(
        payload.images.map((image) => compressImage(image))
    );

    compressedImages.forEach((image, index) => {
        formData.append(`images[${index}]`, image);
    });

    const token = Cookies.get("token");
    const res = await axios.post(`${DASHBOARD_API_BASE_URL}/user-images`, formData, {
        headers: {
            lang,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    return res.data;
}

export function useUploadUserImages(lang: string = "ar") {
    const qc = useQueryClient();
    const t = translations[lang] || translations["ar"];

    return useMutation({
        mutationFn: (payload: UploadImagesPayload) =>
            uploadUserImages(payload, lang),

        onSuccess: (data: any, variables) => {
            if (!data?.status) {
                const msg = data?.message || t.uploadFailed;
                toast(msg, {
                    style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
                });
                return;
            }

            toast(t.uploadSuccess, {
                style: { background: "#1B8354", color: "#fff", borderRadius: "10px" },
            });

            // Invalidate queries to refetch the images
            qc.invalidateQueries({ queryKey: ["user-images", variables.userId] });
        },

        onError: (e: any) => {
            const msg = e?.response?.data?.message || e?.message || t.uploadFailed;
            toast(msg, {
                style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
            });
        },
    });
}
