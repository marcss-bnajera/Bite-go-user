import { Router } from "express";
import { getCategoriesByUser, getAllCategories } from "./categories-controller.js";

const router = Router();

router.get("/all", getAllCategories);
router.get("/", getCategoriesByUser);

export default router;