import { Router } from "express";
import { uploadDeliveryReceipt } from "../config/multer.js";
import { uploadDeliveryReceipt as uploadDeliveryReceiptController } from "../controllers/upload.controller.js";

const router = Router();

// Esta versión implementa la asociación de comprobantes, no un CRUD completo de entregas.
router.post("/:deliveryId/receipt", uploadDeliveryReceipt, uploadDeliveryReceiptController);

export default router;
