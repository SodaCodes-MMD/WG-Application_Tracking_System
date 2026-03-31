import { User } from "../models/user-model.js";

export const findUserByEmail = async (email) => {
    return await User.findOne({ email });
};

export const createUser = async (data) => {
    return await User.create(data);
};
