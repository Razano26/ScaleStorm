import axios from "axios";
import { API_URL } from "./config";

export const setLoad = async (rps: number) => {
  await axios.post(`${API_URL}/load`, { rps });
};

export const getLoad = async () => {
  const { data } = await axios.get(`${API_URL}/load`);
  return data.rps;
};

export const setReplicas = async (count: number) => {
  await axios.post(`${API_URL}/replicas`, { count });
};

export const getReplicas = async () => {
  const { data } = await axios.get(`${API_URL}/replicas`);
  return data.replicas;
};

export const toggleAutoscale = async (enabled: boolean) => {
  await axios.post(`${API_URL}/autoscale`, { enabled });
};
