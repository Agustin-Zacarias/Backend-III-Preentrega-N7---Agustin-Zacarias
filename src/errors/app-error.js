import { ERROR_DICTIONARY } from "./error.dictionary.js";

export class AppError extends Error {
  constructor(code, { message, details, cause } = {}) {
    const definition = ERROR_DICTIONARY[code];
    if (!definition) {
      throw new TypeError(`El código de error '${code}' no está definido en el diccionario.`);
    }

    super(message ?? definition.message, cause ? { cause } : undefined);
    this.name = new.target.name;
    this.code = code;
    this.statusCode = definition.statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, new.target);
  }
}

export class ValidationError extends AppError {
  constructor(message, details) {
    super("VALIDATION_ERROR", { message, details });
  }
}

export class InvalidJsonError extends AppError {
  constructor() {
    super("INVALID_JSON");
  }
}

export class InvalidIdentifierError extends AppError {
  constructor(entity = "recurso") {
    super("INVALID_ID", {
      message: `El identificador de ${entity} no tiene un formato válido.`,
    });
  }
}

export class InvalidStateError extends AppError {
  constructor(state) {
    super("INVALID_STATE", {
      message: state
        ? `El estado '${state}' no es válido.`
        : undefined,
    });
  }
}

export class UserNotFoundError extends AppError {
  constructor() {
    super("USER_NOT_FOUND");
  }
}

export class ProductNotFoundError extends AppError {
  constructor() {
    super("PRODUCT_NOT_FOUND");
  }
}

export class OrderNotFoundError extends AppError {
  constructor() {
    super("ORDER_NOT_FOUND");
  }
}

export class DeliveryNotFoundError extends AppError {
  constructor() {
    super("DELIVERY_NOT_FOUND");
  }
}

export class RouteNotFoundError extends AppError {
  constructor(method, path) {
    super("ROUTE_NOT_FOUND", {
      message: `No existe la ruta ${method} ${path}.`,
    });
  }
}

export class DuplicateEmailError extends AppError {
  constructor() {
    super("DUPLICATE_EMAIL");
  }
}

export class DuplicateResourceError extends AppError {
  constructor() {
    super("DUPLICATE_RESOURCE");
  }
}

export class InvalidMockQuantityError extends AppError {
  constructor() {
    super("INVALID_MOCK_QUANTITY");
  }
}

export class InvalidMockEntityError extends AppError {
  constructor() {
    super("INVALID_MOCK_ENTITY");
  }
}

export class MockSeedError extends AppError {
  constructor(cause) {
    super("MOCK_SEED_FAILED", { cause });
  }
}

export class DatabaseError extends AppError {
  constructor(cause) {
    super("DATABASE_ERROR", { cause });
  }
}

export class InternalServerError extends AppError {
  constructor(cause) {
    super("INTERNAL_SERVER_ERROR", { cause });
  }
}


export class FileRequiredError extends AppError {
  constructor() {
    super("FILE_REQUIRED");
  }
}

export class FileTypeNotAllowedError extends AppError {
  constructor() {
    super("INVALID_FILE_TYPE");
  }
}

export class FileTooLargeError extends AppError {
  constructor() {
    super("FILE_TOO_LARGE");
  }
}

export class InvalidFileFieldError extends AppError {
  constructor(field) {
    super("INVALID_FILE_FIELD", {
      message: field
        ? `El archivo debe enviarse en el campo 'file'; se recibió '${field}'.`
        : undefined,
    });
  }
}

export class InvalidDocumentTypeError extends AppError {
  constructor(documentType) {
    super("INVALID_DOCUMENT_TYPE", {
      message: documentType
        ? `El tipo de documento '${documentType}' no es válido.`
        : undefined,
      details: { allowed: ["IDENTITY", "ADDRESS_PROOF", "DRIVER_LICENSE", "OTHER"] },
    });
  }
}

export class FileUploadFailedError extends AppError {
  constructor(cause) {
    super("FILE_UPLOAD_FAILED", { cause });
  }
}
