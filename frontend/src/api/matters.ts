import { api } from "./client";

export const getMatter = async (id: string) => {
  const response = await api.get(`/Matters/${id}`);
  return response.data;
};