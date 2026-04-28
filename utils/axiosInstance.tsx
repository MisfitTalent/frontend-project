import axios from "axios";

export const axiosInstance = () => {
  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("token") : null;

  return axios.create({
    baseURL: "/api/backend",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    withCredentials: true,
  });
};
