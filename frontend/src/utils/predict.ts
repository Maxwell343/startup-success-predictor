import axios from "axios";
import type { StartupInput, PredictionResponse, MetadataResponse } from "../types";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:8000";

export const predictStartup = async (
  data: StartupInput
): Promise<PredictionResponse> => {
  const res = await axios.post(`${API_URL}/predict`, data);
  return res.data;
};

export const fetchMetadata = async (): Promise<MetadataResponse> => {
  const res = await axios.get(`${API_URL}/metadata`);
  return res.data;
};