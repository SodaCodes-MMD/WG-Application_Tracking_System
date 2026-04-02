import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    firstName: { type: String, trim: true, default: "" },
    lastName:  { type: String, trim: true, default: "" },
    phone:     { type: String, trim: true, default: "" },
    location:  { type: String, trim: true, default: "" },
    headline:  { type: String, trim: true, default: "" },
    summary:   { type: String, trim: true, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "profiles" }
);

export const Profile = mongoose.model("Profile", profileSchema);
