import { Router } from "express";
import {
    getMesas
} from "./tables-controller.js";

const router = Router();

// GET 
router.get("/:id", getMesas);

export default router;