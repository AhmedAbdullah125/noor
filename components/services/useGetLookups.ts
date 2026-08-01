'use client';
import axios from "axios";
import { getAccessToken } from "../auth/authStorage";
import { API_BASE_URL } from "../../lib/apiConfig";
import { useQuery } from "@tanstack/react-query";

const fetchLookups = async (lang: string) => {
    const token = getAccessToken();
    const headers: Record<string, string> = { lang };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await axios.post(`${API_BASE_URL}/v1/lookups`, null, { headers });

    return response.data.items;
};

export const useGetLookups = (lang: string) =>
    useQuery({
        queryKey: ["lookups", lang],
        queryFn: () => fetchLookups(lang),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 60,
    });
