import fs from "node:fs/promises";
import path from "node:path";
import { describe, it } from "mocha";
import { expect } from "chai";
import request from "supertest";
import app from "../src/app.js";
import DeliveryModel from "../src/models/delivery.model.js";
import { validUser, validOrder, expectError } from "./helpers.js";

const pdfBuffer = (content = "Comprobante de prueba") =>
  Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.from(content)]);

const createUser = async (role = "USER") => {
  const response = await request(app).post("/api/users").send(validUser({ role })).expect(201);
  return response.body.payload._id;
};

const createDelivery = async () => {
  const userId = await createUser("USER");
  const driverId = await createUser("DRIVER");
  const orderResponse = await request(app).post("/api/orders").send(validOrder(userId)).expect(201);
  const delivery = await DeliveryModel.create({ order: orderResponse.body.payload._id, driver: driverId });
  return delivery._id.toString();
};

describe("File uploads API", function () {
  it("POST /api/users/:uid/documents guarda un documento y registra solo metadatos", async function () {
    const userId = await createUser();
    const response = await request(app)
      .post(`/api/users/${userId}/documents`)
      .field("documentType", "IDENTITY")
      .attach("file", pdfBuffer(), { filename: "identidad.pdf", contentType: "application/pdf" })
      .expect(201);

    expect(response.body.status).to.equal("success");
    expect(response.body.payload._id).to.equal(userId);
    expect(response.body.payload.documents).to.have.length(1);
    const metadata = response.body.payload.documents[0];
    expect(metadata).to.include.keys("originalName", "filename", "path", "mimetype", "size", "documentType", "uploadedAt");
    expect(metadata.originalName).to.equal("identidad.pdf");
    expect(metadata.documentType).to.equal("IDENTITY");
    expect(metadata.mimetype).to.equal("application/pdf");
    expect(metadata.size).to.be.greaterThan(0);
    expect(metadata).not.to.have.property("buffer");
    await fs.access(path.resolve(metadata.path));
  });

  it("POST /api/users/:uid/documents rechaza la solicitud si falta el archivo", async function () {
    const userId = await createUser();
    const response = await request(app)
      .post(`/api/users/${userId}/documents`)
      .field("documentType", "IDENTITY");
    expectError(expect, response, 400, "FILE_REQUIRED");
  });

  it("POST /api/users/:uid/documents rechaza un tipo MIME/extensión no permitido", async function () {
    const userId = await createUser();
    const response = await request(app)
      .post(`/api/users/${userId}/documents`)
      .field("documentType", "IDENTITY")
      .attach("file", Buffer.from("contenido ejecutable"), { filename: "payload.exe", contentType: "application/octet-stream" });
    expectError(expect, response, 400, "INVALID_FILE_TYPE");
  });

  it("POST /api/users/:uid/documents rechaza archivos que superan 5 MB", async function () {
    const userId = await createUser();
    const oversized = Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.alloc(5 * 1024 * 1024 + 1, 0x41)]);
    const response = await request(app)
      .post(`/api/users/${userId}/documents`)
      .field("documentType", "IDENTITY")
      .attach("file", oversized, { filename: "grande.pdf", contentType: "application/pdf" });
    expectError(expect, response, 413, "FILE_TOO_LARGE");
  });

  it("POST /api/users/:uid/documents rechaza un campo de formulario incorrecto", async function () {
    const userId = await createUser();
    const response = await request(app)
      .post(`/api/users/${userId}/documents`)
      .field("documentType", "IDENTITY")
      .attach("document", pdfBuffer(), { filename: "identidad.pdf", contentType: "application/pdf" });
    expectError(expect, response, 400, "INVALID_FILE_FIELD");
  });

  it("POST /api/users/:uid/documents rechaza un tipo de documento inválido", async function () {
    const userId = await createUser();
    const response = await request(app)
      .post(`/api/users/${userId}/documents`)
      .field("documentType", "PASSPORT_FROM_MARS")
      .attach("file", pdfBuffer(), { filename: "identidad.pdf", contentType: "application/pdf" });
    expectError(expect, response, 400, "INVALID_DOCUMENT_TYPE");
  });

  it("POST /api/users/:uid/documents devuelve USER_NOT_FOUND si el usuario no existe", async function () {
    const response = await request(app)
      .post("/api/users/507f1f77bcf86cd799439011/documents")
      .field("documentType", "IDENTITY")
      .attach("file", pdfBuffer(), { filename: "identidad.pdf", contentType: "application/pdf" });
    expectError(expect, response, 404, "USER_NOT_FOUND");
  });

  it("POST /api/deliveries/:deliveryId/receipt asocia un comprobante a una entrega", async function () {
    const deliveryId = await createDelivery();
    const response = await request(app)
      .post(`/api/deliveries/${deliveryId}/receipt`)
      .attach("file", pdfBuffer("recibido"), { filename: "comprobante.pdf", contentType: "application/pdf" })
      .expect(201);

    expect(response.body.status).to.equal("success");
    expect(response.body.payload._id).to.equal(deliveryId);
    expect(response.body.payload.receipt).to.include.keys("originalName", "filename", "path", "mimetype", "size", "documentType", "uploadedAt");
    expect(response.body.payload.receipt.documentType).to.equal("DELIVERY_RECEIPT");
    await fs.access(path.resolve(response.body.payload.receipt.path));
  });

  it("POST /api/deliveries/:deliveryId/receipt devuelve DELIVERY_NOT_FOUND si la entrega no existe", async function () {
    const response = await request(app)
      .post("/api/deliveries/507f1f77bcf86cd799439011/receipt")
      .attach("file", pdfBuffer(), { filename: "comprobante.pdf", contentType: "application/pdf" });
    expectError(expect, response, 404, "DELIVERY_NOT_FOUND");
  });
});
