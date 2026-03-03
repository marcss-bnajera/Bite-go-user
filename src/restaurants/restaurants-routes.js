import { Router } from "express";
import {
    getRestaurants,
    getRestaurantById
} from "./restaurants-controller.js";

const router = Router();

// Listar todos y filtrar
router.get("/", getRestaurants);

// Ver detalle
router.get("/:id", getRestaurantById);

export default router;