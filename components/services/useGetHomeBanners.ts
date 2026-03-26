import { useQuery } from "@tanstack/react-query";
import { http } from "./http";

export type Banner = {
  id: number;
  title: string;
  image: string;
  url: string;
  position: number;
  is_active: number;
};

type BannersResponse = {
  status: boolean;
  data: Banner[];
  message: string;
};

const fetchHomeBanners = async (): Promise<BannersResponse> => {
  const res = await http.get("/banners");
  return res.data;
};

export const useGetHomeBanners = () =>
  useQuery({
    queryKey: ["home-banners"],
    queryFn: fetchHomeBanners,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
    select: (data) =>
      data.data.filter((b) => b.is_active === 1).sort((a, b) => a.position - b.position),
  });
