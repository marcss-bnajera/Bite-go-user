'use strict'

import Order from "../src/orders/orders-model.js";

/**
 * Middleware para impedir modificaciones en órdenes finalizadas o canceladas
 */
export const isOrderEditable = async (req, res, next) => {
    try {
        const { id_order } = req.params;

        const order = await Order.findById(id_order);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Orden no encontrada"
            });
        }

        // Definimos los estados que "congelan" la orden
        const estadosNoEditables = ['Entregado', 'Cancelado', 'Enviado'];

        if (estadosNoEditables.includes(order.estado)) {
            return res.status(403).json({
                success: false,
                message: `Acción denegada. La orden ya está en estado: ${order.estado}`
            });
        }

        // Si pasa la validación, guardamos la orden en el objeto req para no tener que buscarla otra vez en el controlador
        req.order = order;
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al validar el estado de la orden",
            error: error.message
        });
    }
};