import axios from "axios";
import { API_URL } from "./config";
import { AutoscaleConfig } from "types/autoscale";

export const getPods = async (namespace?: string) => {
  const url = namespace ? `${API_URL}/pods/${namespace}` : `${API_URL}/pods`;
  const { data } = await axios.get(url);
  return data.pods;
};

export const getPod = async (namespace: string, name: string) => {
  const { data } = await axios.get(`${API_URL}/pods/${namespace}/${name}`);
  return data;
};

export const getAutoscale = async () => {
  const { data } = await axios.get<AutoscaleConfig>(`${API_URL}/autoscale`);
  return data as AutoscaleConfig;
};
