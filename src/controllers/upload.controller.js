import { asyncHandler } from "../middlewares/async-handler.js";
import { removeUploadedFile } from "../config/multer.js";
import { uploadService } from "../services/upload.service.js";

const executeUpload = async (req, operation) => {
  try {
    return await operation();
  } catch (error) {
    await removeUploadedFile(req.file);
    throw error;
  }
};

export const uploadUserDocument = asyncHandler(async (req, res) => {
  const user = await executeUpload(req, () =>
    uploadService.uploadUserDocument(req.params.uid, req.file, req.body?.documentType),
  );

  return res.status(201).json({
    status: "success",
    message: "Documento de usuario cargado correctamente.",
    payload: user,
  });
});

export const uploadDeliveryReceipt = asyncHandler(async (req, res) => {
  const delivery = await executeUpload(req, () =>
    uploadService.uploadDeliveryReceipt(req.params.deliveryId, req.file),
  );

  return res.status(201).json({
    status: "success",
    message: "Comprobante asociado a la entrega correctamente.",
    payload: delivery,
  });
});
