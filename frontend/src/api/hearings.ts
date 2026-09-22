import { api } from "./client";

export const getHearingsByMatter = async (matterId: string) => {
  const response = await api.get("/Hearings");
  return response.data.filter((h: any) => h.matterId === matterId);
};