import { Router } from "express";
import { validateJWT } from "../../middlewares/validate-jwt.js";
import {
    validateCreateReview,
    validateRestaurantParam
} from "../../middlewares/reviewsRatings-validator.js";
import {
    createReview,
    getMyReviews,
    getRestaurantReviews
} from "./reviewsRatings-controller.js";

const router = Router();

// GET - Mis calificaciones (qué pedidos ya calificó el cliente)
router.get("/", validateJWT, getMyReviews);

// GET - Calificaciones públicas de un restaurante
router.get("/restaurant/:id_restaurante", validateRestaurantParam, getRestaurantReviews);

// POST - Calificar un pedido entregado
router.post("/", validateJWT, validateCreateReview, createReview);

export default router;
