import { Router } from "express";
import {
    getEventos
} from "./gastronomicEvents-controller.js";

const router = Router();

// GET 
router.get("/:id", getEventos);

export default router;