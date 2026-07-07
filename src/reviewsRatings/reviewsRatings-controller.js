import ReviewRating from "./reviewsRatings-model.js";
import Order from "../orders/orders-model.js";

/**
 * POST - Calificar un pedido ya entregado
 */
export const createReview = async (req, res) => {
    try {
        const { id_pedido, calificacion, comentario } = req.body;
        const id_usuario = req.user.uid;

        const order = await Order.findOne({ _id: id_pedido, id_usuario_cliente: id_usuario, activo: true });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Pedido no encontrado o no te pertenece"
            });
        }

        if (order.estado !== 'Entregado') {
            return res.status(400).json({
                success: false,
                message: "Solo puedes calificar un pedido una vez que fue entregado"
            });
        }

        const yaCalificado = await ReviewRating.findOne({ id_usuario, id_pedido, activo: true });
        if (yaCalificado) {
            return res.status(409).json({
                success: false,
                message: "Ya calificaste este pedido"
            });
        }

        const review = await ReviewRating.create({
            id_usuario,
            id_restaurante: order.id_restaurante,
            id_pedido,
            calificacion,
            comentario
        });

        res.status(201).json({
            success: true,
            message: "¡Gracias por tu calificación!",
            review
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al registrar la calificación",
            error: error.message
        });
    }
};

/**
 * GET - Listar MIS calificaciones (para saber qué pedidos ya calificó el cliente)
 */
export const getMyReviews = async (req, res) => {
    try {
        const id_usuario = req.user.uid;
        const reviews = await ReviewRating.find({ id_usuario, activo: true })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            total: reviews.length,
            reviews
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener tus calificaciones",
            error: error.message
        });
    }
};

/**
 * GET - Listar calificaciones de un restaurante (públicas)
 */
export const getRestaurantReviews = async (req, res) => {
    try {
        const { id_restaurante } = req.params;
        const reviews = await ReviewRating.find({ id_restaurante, activo: true })
            .select('calificacion comentario createdAt')
            .sort({ createdAt: -1 });

        const promedio = reviews.length
            ? reviews.reduce((acc, r) => acc + r.calificacion, 0) / reviews.length
            : 0;

        res.status(200).json({
            success: true,
            total: reviews.length,
            promedio: Math.round(promedio * 10) / 10,
            reviews
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener las calificaciones del restaurante",
            error: error.message
        });
    }
};
