// src/components/services/useUploadUserImages.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";
import { getAccessToken } from "../auth/authStorage";
import { translations, getLang } from "@/services/i18n";

type UploadImagesPayload = {
    userId: number;
    images: File[];
};

async function uploadUserImages(
    payload: UploadImagesPayload,
    lang: string
): Promise<any> {
    const formData = new FormData();
    formData.append("user_id", payload.userId.toString());

    payload.images.forEach((image, index) => {
        formData.append(`images[${index}]`, image);
    });

    const token = getAccessToken();
    const res = await axios.post(`${DASHBOARD_API_BASE_URL}/user-images`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
            lang,
            Authorization: token ? `Bearer ${token}` : undefined,
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
