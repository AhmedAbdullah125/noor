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
    // Skip compression for small files
    if (file.size < 500 * 1024) { // Less than 500KB
        return file;
    }

    const options = {
        maxSizeMB: 2, // Increased from 1MB to reduce processing load
        maxWidthOrHeight: 1280, // Reduced from 1920 for better mobile performance
        useWebWorker: true,
        initialQuality: 0.8, // Add initial quality setting
        alwaysKeepResolution: false,
    };

    try {
        console.log(`Compressing image: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        const compressedFile = await imageCompression(file, options);
        console.log(`Compressed to: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
        return compressedFile;
    } catch (error) {
        console.error("Error compressing image:", error);
        // If compression fails, try basic resize without quality reduction
        try {
            const fallbackOptions = {
                maxWidthOrHeight: 1280,
                useWebWorker: false, // Disable worker on fallback
            };
            return await imageCompression(file, fallbackOptions);
        } catch (fallbackError) {
            console.error("Fallback compression also failed:", fallbackError);
            return file; // Return original if all compression attempts fail
        }
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
