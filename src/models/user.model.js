import mongoose from "mongoose";
import { USER_ROLES } from "../constants/index.js";
import fileMetadataSchema from "./file-metadata.schema.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
      required: true,
    },
    documents: {
      type: [fileMetadataSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const UserModel = mongoose.model("User", userSchema);

export default UserModel;
