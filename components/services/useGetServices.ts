// src/components/services/useGetServices.ts
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { http } from "./http";
import { API_BASE_URL } from "@/lib/apiConfig";

export type ServicesResponse = {
  items?: { services?: unknown[] };
  meta?: { pagination?: { page: number; per_page: number; total: number; last_page: number; has_more: boolean } };
};

const fetchServices = async (lang: string, page: number, search?: string): Promise<ServicesResponse> => {
  const res = await http.get(`${API_BASE_URL}/v2/services`, {
    params: { page, per_page: 100, ...(search ? { q: search } : {}) },
    headers: { lang, "x-skip-auth": "1" },
  });

  if (!Array.isArray(res.data?.data)) {
    throw new Error(res.data?.error?.message || "Unable to load services");
  }

  // Transitional UI adapter: retain the shape expected by current components
  // while the API itself uses the smaller v2 resource contract.
  return {
    items: {
      services: res.data.data.map((service: any) => ({
        id: service.id,
        name: service.name,
        main_image: service.image?.url ?? "",
        category: service.category?.name ?? "",
        is_active: true,
        current_price: service.price?.amount ?? "0",
        price: service.price?.original_amount ?? service.price?.amount ?? "0",
        has_discount: Boolean(service.price?.original_amount),
      })),
    },
    meta: res.data.meta,
  };
};

export const useGetServices = (lang: string, page: number, search?: string) =>
  useQuery({
    queryKey: ["services", lang, page, search],
    queryFn: () => fetchServices(lang, page, search),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
    placeholderData: keepPreviousData,
  });
