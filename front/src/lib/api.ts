import axios from "axios";
import { API_URL } from "./config";

export const getPods = async () => {
  const { data } = await axios.get(`${API_URL}/pods`);
  return data.pods;
};
