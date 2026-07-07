import { Router } from "express";
import {
    register,
    updateUser,
    getUserById,
    getFavorites,
    toggleFavorite,
    getAddresses,
    addAddress,
    deleteAddress,
    syncUser,
    getMe,
    uploadProfilePhoto,
    deleteProfilePhoto
} from "./users-controller.js";
import { validateJWT } from "../../middlewares/validate-jwt.js";
import { body, param } from "express-validator";
import { checkValidators } from "../../middlewares/check-validators.js";
import { uploadProfileImage } from "../../middlewares/file-uploader.js";

const router = Router();

router.post('/sync', validateJWT, syncUser);
router.get('/me', validateJWT, getMe);

router.post('/register', [
    body('email').isEmail().withMessage('El correo no es válido'),
    checkValidators
], register);

router.get('/favorites/list', validateJWT, getFavorites);
router.post('/favorites/toggle', validateJWT, [
    body('id_restaurante').isMongoId().withMessage('ID de restaurante no válido'),
    checkValidators
], toggleFavorite);

router.put('/profile/photo', validateJWT, (req, res, next) => {
    uploadProfileImage.single('foto')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
}, uploadProfilePhoto);

router.delete('/profile/photo', validateJWT, deleteProfilePhoto);

router.get('/addresses/list', validateJWT, getAddresses);
router.post('/addresses/add', validateJWT, [
    body('etiqueta').trim().notEmpty().withMessage('La etiqueta es obligatoria'),
    body('direccion').trim().notEmpty().withMessage('La dirección es obligatoria'),
    checkValidators
], addAddress);
router.delete('/addresses/:id', validateJWT, [
    param('id').notEmpty().withMessage('ID de dirección no válido'),
    checkValidators
], deleteAddress);

router.put('/:id', validateJWT, [
    param('id').isMongoId().withMessage('ID de usuario no válido'),
    checkValidators
], updateUser);

router.get('/:id', validateJWT, [
    param('id').isMongoId().withMessage('ID de usuario no válido'),
    checkValidators
], getUserById);

export default router;
