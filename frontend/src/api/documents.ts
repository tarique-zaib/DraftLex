import api from "./client";

export const getDocumentsByMatter = async (matterId: string) => {
  const response = await api.get(`/Documents/matter/${matterId}`);
  return response.data;
};

export const getDocument = async (id: string) => {
  const { data } = await api.get(`/Documents/${id}`);
  return data;
};
