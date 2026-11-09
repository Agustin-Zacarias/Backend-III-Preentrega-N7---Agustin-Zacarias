import { Router } from "express";
import { uploadUserDocument } from "../config/multer.js";
import { uploadUserDocument as uploadUserDocumentController } from "../controllers/upload.controller.js";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";

const router = Router();

router.post("/:uid/documents", uploadUserDocument, uploadUserDocumentController);

router.get("/", getUsers);
router.get("/:uid", getUserById);
router.post("/", createUser);
router.put("/:uid", updateUser);
router.delete("/:uid", deleteUser);

export default router;
