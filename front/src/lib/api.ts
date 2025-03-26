import axios from "axios";
import { API_URL } from "./config";

export const getPods = async (namespace?: string) => {
  const url = namespace ? `${API_URL}/pods/${namespace}` : `${API_URL}/pods`;
  const { data } = await axios.get(url);
  return data.pods;
};

export const getPod = async (namespace: string, name: string) => {
  const { data } = await axios.get(`${API_URL}/pods/${namespace}/${name}`);
  return data;
};
