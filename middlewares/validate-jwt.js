import mongoose from 'mongoose';

// SIMULADOR PARA PRUEBAS
export const validateJWT = (req, res, next) => {

    // Validamos un usuario x que exista en nuestra db para hacer las pruebas
    req.user = {
        uid: "65f1a2b3c4d5e6f7a8b9c0d1",
        rol: "Cliente"
    };

    console.log("MOCK JWT: Usuario autenticado simulado con ID:", req.user.uid);
    next();
};