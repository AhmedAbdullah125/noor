// src/components/services/useGetService.ts
'use client';
import axios from "axios";
import { getAccessToken } from "../auth/authStorage";
import { API_BASE_URL } from "../../lib/apiConfig";
import { useQuery } from "@tanstack/react-query";

const toLegacyService = (service: any) => ({
  id: service.id,
  name: service.name,
  description: service.description,
  main_image: service.image?.url ?? "",
  is_active: true,
  current_price: service.price?.amount ?? "0",
  price: service.price?.original_amount ?? service.price?.amount ?? "0",
  has_discount: Boolean(service.price?.original_amount),
  duration: service.booking?.duration_minutes ? `${service.booking.duration_minutes} mins` : "",
  category: service.category?.name ?? "",
  is_favorite: Boolean(service.is_favorite),
  daily_appointments: service.booking?.daily_limit ?? 0,
  duration_minutes: service.booking?.duration_minutes ?? 0,
  booking_start_time: service.booking?.start_time ?? null,
  booking_end_time: service.booking?.end_time ?? null,
  options: (service.options ?? []).map((option: any) => ({
    id: option.id,
    title: option.title,
    is_active: true,
    is_required: option.required,
    is_multiple_choice: option.multiple,
    values: (option.values ?? []).map((value: any) => ({
      id: value.id,
      title: value.title,
      price: value.price?.amount ?? "0",
      is_active: true,
    })),
  })),
  subscriptions: (service.subscriptions ?? []).map((subscription: any) => ({
    id: subscription.id,
    name: subscription.name,
    session_count: subscription.session_count,
    validity_days: subscription.validity_days,
    fixed_price: subscription.price?.amount ?? "0",
    is_active: true,
  })),
});

const fetchService = async (lang: string, id: number | string) => {
  const token = getAccessToken();
  const headers: Record<string, string> = { lang };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await axios.get(`${API_BASE_URL}/v2/services/${id}`, { headers });

  if (!response.data?.data) {
    throw new Error(response.data?.error?.message || "Unable to load service");
  }

  return toLegacyService(response.data.data);
};

export const useGetService = (lang: string, id?: number | string) =>
  useQuery({
    queryKey: ["service", lang, id],
    queryFn: () => fetchService(lang, id as number),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });
