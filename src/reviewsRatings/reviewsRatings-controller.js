import ReviewRating from "./reviewsRatings-model.js";
import Order from "../orders/orders-model.js";
import Reservation from "../reservations/reservations-model.js";
import Restaurant from "../restaurants/restaurants-model.js";

/**
 * POST - Calificar un pedido entregado o una reservación asistida
 */
export const createReview = async (req, res) => {
    try {
        const { id_pedido, id_reservacion, id_sucursal, calificacion, comentario } = req.body;
        const id_usuario = req.user.uid;

        if (!id_pedido && !id_reservacion) {
            return res.status(400).json({
                success: false,
                message: "Debes enviar un id_pedido o un id_reservacion"
            });
        }

        let id_restaurante;

        if (id_pedido) {
            const order = await Order.findOne({ _id: id_pedido, id_usuario_cliente: id_usuario, activo: true });
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Pedido no encontrado o no te pertenece"
                });
            }
            if (order.estado !== 'Entregado' && order.estado !== 'Cancelado') {
                return res.status(400).json({
                    success: false,
                    message: "Solo puedes calificar pedidos entregados o cancelados"
                });
            }

            const yaCalificado = await ReviewRating.findOne({ id_usuario, id_pedido, activo: true });
            if (yaCalificado) {
                return res.status(409).json({
                    success: false,
                    message: "Ya calificaste este pedido"
                });
            }

            id_restaurante = order.id_restaurante;
        }

        if (id_reservacion) {
            const reservation = await Reservation.findOne({ _id: id_reservacion, id_usuario, activo: true });
            if (!reservation) {
                return res.status(404).json({
                    success: false,
                    message: "Reservación no encontrada o no te pertenece"
                });
            }
            if (reservation.estado !== 'Confirmada' && reservation.estado !== 'Atendida') {
                return res.status(400).json({
                    success: false,
                    message: "Solo puedes calificar reservaciones confirmadas o atendidas"
                });
            }
            if (!reservation.asistio && reservation.estado !== 'Atendida') {
                return res.status(400).json({
                    success: false,
                    message: "Solo puedes calificar reservaciones donde asististe"
                });
            }

            const yaCalificado = await ReviewRating.findOne({ id_usuario, id_reservacion, activo: true });
            if (yaCalificado) {
                return res.status(409).json({
                    success: false,
                    message: "Ya calificaste esta reservación"
                });
            }

            id_restaurante = reservation.id_restaurante;
        }

        const review = await ReviewRating.create({
            id_usuario,
            id_restaurante,
            id_pedido: id_pedido || null,
            id_reservacion: id_reservacion || null,
            id_sucursal: id_sucursal || '',
            calificacion,
            comentario
        });

        res.status(201).json({
            success: true,
            message: "¡Gracias por tu calificación!",
            review
        });
    } catch (error) {
        console.error("createReview error:", error);
        res.status(500).json({
            success: false,
            message: "Error al registrar la calificación",
            error: error.message
        });
    }
};

/**
 * GET - Listar MIS calificaciones
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
        console.error("getMyReviews error:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener tus calificaciones",
            error: error.message
        });
    }
};

/**
 * GET - Obtener pedidos y reservaciones calificables de un restaurante
 */
export const getEligibleForReview = async (req, res) => {
    try {
        const { id_restaurante } = req.params;
        const { id_sucursal } = req.query;
        const id_usuario = req.user.uid;

        const orderQuery = {
            id_usuario_cliente: id_usuario,
            id_restaurante,
            activo: true,
            estado: { $in: ['Entregado', 'Cancelado'] }
        };
        if (id_sucursal) orderQuery.id_sucursal = id_sucursal;

        const orders = await Order.find(orderQuery).select('_id createdAt estado items total tipo_servicio id_mesero_asignado id_repartidor_asignado id_sucursal')
          .populate('id_mesero_asignado', 'nombre')
          .populate('id_repartidor_asignado', 'nombre')
          .sort({ createdAt: -1 }).limit(10);

        const reservationQuery = {
            id_usuario,
            id_restaurante,
            activo: true,
            estado: { $in: ['Confirmada', 'Atendida'] },
            $or: [{ asistio: true }, { estado: 'Atendida' }]
        };
        if (id_sucursal) reservationQuery.id_sucursal = id_sucursal;

        const reservations = await Reservation.find(reservationQuery)
            .select('_id createdAt fecha_reserva cantidad_personas id_mesa id_sucursal')
            .sort({ createdAt: -1 }).limit(10);

        const restaurant = await Restaurant.findById(id_restaurante).select('mesas sucursales');

        const reviewedOrders = await ReviewRating.find({
            id_usuario,
            id_pedido: { $in: orders.map(o => o._id) },
            activo: true
        }).select('id_pedido');
        const reviewedOrderIds = new Set(reviewedOrders.map(r => String(r.id_pedido)));

        const reviewedReservations = await ReviewRating.find({
            id_usuario,
            id_reservacion: { $in: reservations.map(r => r._id) },
            activo: true
        }).select('id_reservacion');
        const reviewedReservationIds = new Set(reviewedReservations.map(r => String(r.id_reservacion)));

        res.status(200).json({
            success: true,
            orders: orders.map(o => ({
                _id: o._id,
                createdAt: o.createdAt,
                estado: o.estado,
                items: o.items?.map(i => ({ nombre: i.nombre_historico, cantidad: i.cantidad, precio: i.precio_historico })) || [],
                total: o.total,
                tipo_servicio: o.tipo_servicio,
                mesero: o.id_mesero_asignado?.nombre || null,
                repartidor: o.id_repartidor_asignado?.nombre || null,
                id_sucursal: o.id_sucursal || '',
                reviewed: reviewedOrderIds.has(String(o._id))
            })),
            reservations: reservations.map(r => {
                let mesaNumero = null;
                let sucursalNombre = null;
                if (restaurant) {
                    if (r.id_sucursal) {
                        const suc = restaurant.sucursales?.id(r.id_sucursal);
                        if (suc) {
                            sucursalNombre = suc.nombre;
                            const mesa = suc.mesas?.id(r.id_mesa);
                            if (mesa) mesaNumero = mesa.numero;
                        }
                    } else {
                        const mesa = restaurant.mesas?.id(r.id_mesa);
                        if (mesa) mesaNumero = mesa.numero;
                    }
                }
                return {
                    _id: r._id,
                    createdAt: r.createdAt,
                    fecha_reserva: r.fecha_reserva,
                    cantidad_personas: r.cantidad_personas,
                    mesa_numero: mesaNumero,
                    sucursal_nombre: sucursalNombre,
                    id_sucursal: r.id_sucursal || '',
                    reviewed: reviewedReservationIds.has(String(r._id))
                };
            })
        });
    } catch (error) {
        console.error("getEligibleForReview error:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener elementos calificables",
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
        const { id_sucursal } = req.query;
        const query = { id_restaurante, activo: true };
        if (id_sucursal) {
            query.id_sucursal = id_sucursal;
        }

        const reviews = await ReviewRating.find(query)
            .select('calificacion comentario createdAt id_pedido id_reservacion id_sucursal')
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
        console.error("getRestaurantReviews error:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener las calificaciones del restaurante",
            error: error.message
        });
    }
};
