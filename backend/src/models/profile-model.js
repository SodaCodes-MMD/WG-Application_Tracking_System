import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema(
  {
    jobTitle:        { type: String, required: true, trim: true, maxlength: 200 },
    company:         { type: String, required: true, trim: true, maxlength: 200 },
    location:        { type: String, trim: true, maxlength: 200, default: "" },
    startDate:       { type: Date, required: true },
    endDate:         { type: Date, default: null },
    isCurrent:       { type: Boolean, default: false },
    description:     { type: String, trim: true, maxlength: 5000, default: "" },
    accomplishments: { type: [String], default: [] },
  },
  { timestamps: true }
);

const educationSchema = new mongoose.Schema(
  {
    institution:  { type: String, required: true, trim: true, maxlength: 200 },
    degree:       { type: String, required: true, trim: true, maxlength: 200 },
    fieldOfStudy: { type: String, required: true, trim: true, maxlength: 200 },
    startDate:    { type: Date, required: true },
    endDate:      { type: Date, default: null },
    gpa:          { type: String, trim: true, maxlength: 20, default: "" },
    honors:       { type: String, trim: true, maxlength: 200, default: "" },
  },
  { timestamps: true }
);

const profileSchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    firstName:  { type: String, trim: true, default: "" },
    lastName:   { type: String, trim: true, default: "" },
    phone:      { type: String, trim: true, default: "" },
    location:   { type: String, trim: true, default: "" },
    headline:   { type: String, trim: true, default: "" },
    summary:    { type: String, trim: true, default: "" },
    experience: { type: [experienceSchema], default: [] },
    education:  { type: [educationSchema], default: [] },
    createdAt:  { type: Date, default: Date.now },
    updatedAt:  { type: Date, default: Date.now },
  },
  { collection: "profiles" }
);

export const Profile = mongoose.model("Profile", profileSchema);
