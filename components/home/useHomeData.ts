'use client';

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/apiConfig";
import { http } from "../services/http";
import { mapLookupsToUI } from "./serviceMappers";
import type { Product } from "@/types";

type HomeResponse = {
    banners?: unknown[];
    categories?: unknown[];
    social_links?: unknown[];
    featured_services?: Array<{
        id: number;
        name?: string;
        image?: { url?: string } | null;
        category_id?: number;
        price?: { amount?: string; original_amount?: string | null };
    }>;
};

async function fetchHome(lang: string): Promise<HomeResponse> {
    const response = await http.get(`${API_BASE_URL}/v2/home`, {
        headers: { lang, "x-skip-auth": "1" },
    });

    if (!response.data?.data) {
        throw new Error(response.data?.error?.message || "Unable to load home data");
    }

    return response.data.data;
}

export function useHomeData(lang: string, page: number = 1) {
    const homeQ = useQuery({
        queryKey: ["home", "v2", lang, page],
        queryFn: () => fetchHome(lang),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 60,
    });

    const ui = useMemo(() => {
        const home = homeQ.data;
        const mappedLookups = mapLookupsToUI(home);
        const mappedProducts: Product[] = (home?.featured_services ?? []).map((service) => ({
            id: service.id,
            name: service.name ?? "",
            image: service.image?.url ?? "",
            images: service.image?.url ? [service.image.url] : [],
            price: `${Number(service.price?.amount ?? 0).toFixed(3)} د.ك`,
            oldPrice: service.price?.original_amount
                ? `${Number(service.price.original_amount).toFixed(3)} د.ك`
                : undefined,
        }));

        return {
            categories: mappedLookups.categories,
            banners: mappedLookups.banners,
            socialLinks: mappedLookups.socialLinks,
            products: mappedProducts,
        };
    }, [homeQ.data]);

    return {
        ...ui,
        isLoading: homeQ.isLoading,
        isError: homeQ.isError,
        refetchAll: () => homeQ.refetch(),
    };
}
