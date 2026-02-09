// src/components/services/useGetUserImages.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";
import { DASHBOARD_API_BASE_URL } from "@/lib/apiConfig";
import { isLoggedIn } from "../auth/authStorage";

export type UserImage = {
    id: number;
    user_id: number;
    request_id: number | null;
    image: string;
    sort_order: number;
    created_at: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
};

type UserImagesResponse = {
    status: boolean;
    data: {
        data: UserImage[];
        links: {
            first: string;
            last: string;
            prev: string | null;
            next: string | null;
        };
        meta: {
            current_page: number;
            from: number;
            last_page: number;
            links: PaginationLink[];
            path: string;
            per_page: number;
            to: number;
            total: number;
        };
    };
    message: string;
};

async function fetchUserImages(
    userId: number,
    page: number,
    lang: string
): Promise<UserImagesResponse> {
    if (!isLoggedIn()) {
        throw new Error("Not authenticated");
    }

    const token = Cookies.get("token");
    const res = await axios.get(`${DASHBOARD_API_BASE_URL}/user-images`, {
        params: { user_id: userId, page },
        headers: {
            lang,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    return res.data;
}

export function useGetUserImages(
    userId: number | undefined,
    page: number = 1,
    lang: string = "ar"
) {
    return useQuery({
        queryKey: ["user-images", userId, page],
        queryFn: () => fetchUserImages(userId!, page, lang),
        enabled: !!userId && isLoggedIn(),
        staleTime: 1000 * 60, // 1 minute
        gcTime: 1000 * 60 * 5, // 5 minutes
    });
}
