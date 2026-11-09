import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import logger from "../logger/logger.js";
import {
  FileTooLargeError,
  FileUploadFailedError,
  InvalidFileFieldError,
  FileTypeNotAllowedError,
} from "../errors/app-error.js";

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
export const UPLOADS_DIRECTORY = path.resolve(
  process.cwd(),
  process.env.UPLOADS_DIR?.trim() || "uploads",
);

const acceptedTypes = Object.freeze({
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
});

const safeOriginalName = (originalName = "") => {
  const normalized = String(originalName).replace(/\\/g, "/");
  return path.posix.basename(normalized);
};

const createStorage = (folder) => multer.diskStorage({
  destination: (req, file, callback) => {
    const destination = path.join(UPLOADS_DIRECTORY, folder);
    fs.mkdir(destination, { recursive: true }, (error) => {
      callback(error ? new FileUploadFailedError(error) : null, destination);
    });
  },
  filename: (req, file, callback) => {
    const extension = path.extname(safeOriginalName(file.originalname)).toLowerCase();
    callback(null, `${randomUUID()}${extension}`);
  },
});

const fileFilter = (req, file, callback) => {
  const originalName = safeOriginalName(file.originalname);
  const extension = path.extname(originalName).toLowerCase();
  const expectedMimeType = acceptedTypes[extension];

  if (!expectedMimeType || file.mimetype !== expectedMimeType) {
    logger.warning("Intento de carga con tipo de archivo no permitido.", {
      originalName,
      mimetype: file.mimetype,
      extension,
    });
    return callback(new FileTypeNotAllowedError());
  }

  return callback(null, true);
};

const sharedOptions = {
  fileFilter,
  limits: {
    fileSize: MAX_UPLOAD_SIZE,
    files: 1,
    fields: 4,
    parts: 5,
    fieldNameSize: 100,
    fieldSize: 1024,
  },
};

const userDocumentParser = multer({
  ...sharedOptions,
  storage: createStorage("user-documents"),
}).single("file");

const deliveryReceiptParser = multer({
  ...sharedOptions,
  storage: createStorage("delivery-receipts"),
}).single("file");

const normalizeUploadError = (error) => {
  if (error?.isOperational === true && error?.code) return error;

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") return new FileTooLargeError();
    if (error.code === "LIMIT_UNEXPECTED_FILE" || error.code === "LIMIT_FILE_COUNT") {
      return new InvalidFileFieldError(error.field);
    }
    return new InvalidFileFieldError(error.field);
  }

  if (error?.code === "ENOENT" || error?.code === "EACCES" || error?.code === "ENOSPC") {
    return new FileUploadFailedError(error);
  }

  return new FileUploadFailedError(error);
};

const wrapUpload = (parser) => (req, res, next) => {
  parser(req, res, (error) => {
    if (!error) return next();

    const normalized = normalizeUploadError(error);
    if ((normalized.statusCode ?? 500) < 500) {
      logger.warning("Se rechazó una carga de archivo.", {
        code: normalized.code,
        method: req.method,
        path: req.originalUrl,
      });
    } else {
      logger.error("Falló el middleware de carga de archivos.", {
        error: normalized.message,
        method: req.method,
        path: req.originalUrl,
      });
    }

    return next(normalized);
  });
};

export const uploadUserDocument = wrapUpload(userDocumentParser);
export const uploadDeliveryReceipt = wrapUpload(deliveryReceiptParser);

export const removeUploadedFile = async (file) => {
  if (!file?.path) return;

  try {
    await fs.promises.unlink(file.path);
  } catch (error) {
    if (error.code !== "ENOENT") {
      logger.error("No se pudo eliminar un archivo temporal tras una carga fallida.", {
        path: file.path,
        error: error.message,
      });
    }
  }
};

export const removeUploadsDirectory = async () => {
  try {
    await fs.promises.rm(UPLOADS_DIRECTORY, { recursive: true, force: true });
  } catch (error) {
    logger.error("No se pudo limpiar la carpeta de uploads.", { error: error.message });
    throw error;
  }
};
