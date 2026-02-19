import axios from "../lib/axios";

export const userService = {
  getAllUsers: async () => {
    const response = await axios.get("/users");
    return response.data;
  },
};
