import mongoose from "mongoose";

const skillSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true, maxlength: 200 },
    category:    { type: String, trim: true, maxlength: 100, default: "" },
    proficiency: { type: String, enum: ["", "Beginner", "Intermediate", "Advanced", "Expert"], default: "" },
    order:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

const careerPreferencesSchema = new mongoose.Schema(
  {
    targetRoles:      { type: [String], default: [] },
    targetLocations:  { type: [String], default: [] },
    workMode:         { type: String, enum: ["Remote", "Hybrid", "On-site", "Any"], default: "Any" },
    salaryMin:        { type: Number, default: null },
    salaryMax:        { type: Number, default: null },
    salaryCurrency:   { type: String, default: "USD" },
    openToRelocation: { type: Boolean, default: false },
    notes:            { type: String, trim: true, maxlength: 2000, default: "" },
  },
  { _id: false }
);

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
    experience:        { type: [experienceSchema], default: [] },
    education:         { type: [educationSchema], default: [] },
    skills:            { type: [skillSchema], default: [] },
    careerPreferences: { type: careerPreferencesSchema, default: () => ({}) },
    createdAt:  { type: Date, default: Date.now },
    updatedAt:  { type: Date, default: Date.now },
  },
  { collection: "profiles" }
);

export const Profile = mongoose.model("Profile", profileSchema);
