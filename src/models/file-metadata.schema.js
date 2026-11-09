import mongoose from "mongoose";
import { USER_DOCUMENT_TYPES } from "../constants/index.js";

const fileMetadataSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true, trim: true },
    filename: { type: String, required: true, trim: true },
    path: { type: String, required: true, trim: true },
    mimetype: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 1 },
    documentType: {
      type: String,
      required: true,
      enum: [...Object.values(USER_DOCUMENT_TYPES), "DELIVERY_RECEIPT"],
    },
    uploadedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false, versionKey: false },
);

export default fileMetadataSchema;
