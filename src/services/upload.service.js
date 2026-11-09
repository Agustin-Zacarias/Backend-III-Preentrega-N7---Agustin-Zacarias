import fs from "node:fs/promises";
import path from "node:path";
import { userRepository } from "../repositories/user.repository.js";
import { uploadRepository } from "../repositories/upload.repository.js";
import { USER_DOCUMENT_TYPES } from "../constants/index.js";
import logger from "../logger/logger.js";
import {
  DeliveryNotFoundError,
  FileRequiredError,
  FileTypeNotAllowedError,
  FileUploadFailedError,
  InvalidDocumentTypeError,
  InvalidIdentifierError,
  UserNotFoundError,
} from "../errors/app-error.js";

const isValidId = (id) => typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id);
const userDocumentTypes = Object.values(USER_DOCUMENT_TYPES);

const validateId = (id, entity) => {
  if (!isValidId(id)) throw new InvalidIdentifierError(entity);
};

const validateFile = async (file) => {
  if (!file) throw new FileRequiredError();

  const extension = path.extname(file.originalname ?? "").toLowerCase();
  const expectedMimeTypes = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
  };

  if (expectedMimeTypes[extension] !== file.mimetype) {
    throw new FileTypeNotAllowedError();
  }

  // Comprueba la firma binaria para evitar depender solamente del MIME enviado por el cliente.
  let handle;
  try {
    handle = await fs.open(file.path, "r");
    const header = Buffer.alloc(8);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    const signature = header.subarray(0, bytesRead);
    const signatures = {
      ".pdf": signature.subarray(0, 5).toString("ascii") === "%PDF-",
      ".png": signature.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
      ".jpg": signature.length >= 3 && signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff,
      ".jpeg": signature.length >= 3 && signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff,
    };

    if (!signatures[extension]) throw new FileTypeNotAllowedError();
  } catch (error) {
    if (error instanceof FileTypeNotAllowedError) throw error;
    throw new FileUploadFailedError(error);
  } finally {
    await handle?.close().catch(() => {});
  }
};

const buildMetadata = (file, documentType) => ({
  originalName: path.basename(String(file.originalname).replace(/\\/g, "/")),
  filename: file.filename,
  path: path.relative(process.cwd(), file.path).split(path.sep).join("/"),
  mimetype: file.mimetype,
  size: file.size,
  documentType,
  uploadedAt: new Date(),
});

const persistMetadata = async (operation, metadata, entityDescription) => {
  try {
    const entity = await operation(metadata);
    if (!entity) {
      if (entityDescription === "usuario") throw new UserNotFoundError();
      throw new DeliveryNotFoundError();
    }
    return entity;
  } catch (error) {
    if (error instanceof UserNotFoundError || error instanceof DeliveryNotFoundError) throw error;
    logger.error("No se pudieron guardar los metadatos del archivo.", {
      entity: entityDescription,
      error: error.message,
      stack: error.stack,
    });
    throw new FileUploadFailedError(error);
  }
};

export const uploadService = {
  uploadUserDocument: async (userId, file, documentType) => {
    validateId(userId, "usuario");
    await validateFile(file);

    if (!userDocumentTypes.includes(documentType)) {
      throw new InvalidDocumentTypeError(documentType);
    }

    const existingUser = await userRepository.findById(userId);
    if (!existingUser) throw new UserNotFoundError();

    const metadata = buildMetadata(file, documentType);
    const updatedUser = await persistMetadata(
      (data) => uploadRepository.addUserDocument(userId, data),
      metadata,
      "usuario",
    );

    logger.info("Documento de usuario cargado correctamente.", {
      userId,
      documentType,
      filename: metadata.filename,
      size: metadata.size,
    });

    return updatedUser;
  },

  uploadDeliveryReceipt: async (deliveryId, file) => {
    validateId(deliveryId, "entrega");
    await validateFile(file);

    const metadata = buildMetadata(file, "DELIVERY_RECEIPT");
    const updatedDelivery = await persistMetadata(
      (data) => uploadRepository.attachDeliveryReceipt(deliveryId, data),
      metadata,
      "entrega",
    );

    logger.info("Comprobante asociado a una entrega.", {
      deliveryId,
      filename: metadata.filename,
      size: metadata.size,
    });

    return updatedDelivery;
  },
};
