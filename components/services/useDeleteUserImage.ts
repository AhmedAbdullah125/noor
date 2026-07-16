"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { getAccessToken } from "../auth/authStorage";
import { API_BASE_URL } from "@/lib/apiConfig";
import { translations } from "@/services/i18n";

async function deleteUserImage(imageId: number, lang: string): Promise<any> {
    const token = getAccessToken();
    const res = await axios.delete(`${API_BASE_URL}/v1/user-images/${imageId}`, {
        headers: {
            lang,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
    return res.data;
}

export function useDeleteUserImage(userId: number | undefined, lang: string = "ar") {
    const qc = useQueryClient();
    const t = translations[lang] || translations["ar"];

    return useMutation({
        mutationFn: (imageId: number) => deleteUserImage(imageId, lang),

        onSuccess: (data: any) => {
            if (!data?.status) {
                const msg = data?.message || t.deleteImage;
                toast(msg, {
                    style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
                });
                return;
            }

            toast(t.deleteImageSuccess || "Image deleted successfully", {
                style: { background: "#1B8354", color: "#fff", borderRadius: "10px" },
            });

            // Invalidate queries to refetch the images
            qc.invalidateQueries({ queryKey: ["user-images", userId] });
        },

        onError: (e: any) => {
            if (e?.isUnauthorized) return;
            const msg = e?.response?.data?.message || e?.message || t.deleteImage;
            toast(msg, {
                style: { background: "#dc3545", color: "#fff", borderRadius: "10px" },
            });
        },
    });
}
