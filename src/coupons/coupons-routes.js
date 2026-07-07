import { Router } from "express";
import { validateCoupon } from "./coupons-controller.js";
import { body } from "express-validator";
import { checkValidators } from "../../middlewares/check-validators.js";

const router = Router();

router.post('/validate', [
    body('codigo').trim().notEmpty().withMessage('El código del cupón es obligatorio'),
    body('monto_total').isNumeric({ min: 0 }).withMessage('El monto total debe ser un número positivo'),
    checkValidators
], validateCoupon);

export default router;
