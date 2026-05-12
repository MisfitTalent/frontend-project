import axios from "axios";

export const axiosInstance = () => {
  return axios.create({
    baseURL: "/api/backend",
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });
};
