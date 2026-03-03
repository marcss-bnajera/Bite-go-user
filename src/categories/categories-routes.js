import { Router } from "express";
import { getCategoriesByUser } from "./categories-controller.js";

const router = Router();

// El usuario solo va a poder consultar las categorias de los restaurantes segun el id de 
// restaurante que coloque
router.get('/', getCategoriesByUser);

export default router;