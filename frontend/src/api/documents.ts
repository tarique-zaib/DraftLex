import { api } from "./client";

export const getDocumentsByMatter = async (matterId: string) => {
  const response = await api.get(`/Documents/matter/${matterId}`);
  return response.data;
};