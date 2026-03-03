// Importacion del modelo
import Reservation from "./reservations-model.js";
import Restaurant from "../restaurants/restaurants-model.js";

/**
 * POST - Crear una nueva reservación con lógica de disponibilidad
 */
export const createReservation = async (req, res) => {
    try {
        const { restaurantId, reservationDate, peopleCount } = req.body;
        const userId = req.user.uid;

        const dateToReserve = new Date(reservationDate);
        if (dateToReserve < new Date()) {
            return res.status(400).json({
                success: false,
                message: "No puedes reservar en una fecha o hora pasada."
            });
        }

        const restaurant = await Restaurant.findOne({ _id: restaurantId, activo: true });
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurante no encontrado o cerrado temporalmente."
            });
        }

        const table = restaurant.mesas.find(m =>
            m.estado === 'Disponible' && m.capacidad >= peopleCount
        );

        if (!table) {
            return res.status(400).json({
                success: false,
                message: "Lo sentimos, no hay mesas disponibles para esa cantidad de personas en este momento."
            });
        }

        const newReservation = new Reservation({
            userId,
            restaurantId,
            tableId: table._id,
            reservationDate: dateToReserve,
            peopleCount,
            status: 'Confirmed'
        });

        await newReservation.save();

        await Restaurant.updateOne(
            { "_id": restaurantId, "mesas._id": table._id },
            { "$set": { "mesas.$.estado": "Reservada" } }
        );

        res.status(201).json({
            success: true,
            message: "¡Reservación confirmada exitosamente!",
            reservation: newReservation
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al procesar la reservación",
            error: error.message
        });
    }
};

/**
 * GET - Listar MIS reservaciones (Filtro de privacidad)
 */
export const getMyReservations = async (req, res) => {
    try {
        const userId = req.user.uid;
        const reservations = await Reservation.find({ userId, active: true })
            .populate('restaurantId', 'nombre direccion')
            .sort({ reservationDate: 1 });

        res.status(200).json({
            success: true,
            total: reservations.length,
            reservations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener tu historial",
            error: error.message
        });
    }
};

// CAMBIO: Se agregó la función completa para cancelar (DELETE lógico)
/**
 * DELETE - Cancelar una reservación y liberar la mesa
 */
export const deleteReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;

        // 1. Buscar la reservación y verificar que pertenezca al usuario
        const reservation = await Reservation.findOne({ _id: id, userId, active: true });

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: "Reservación no encontrada o ya cancelada."
            });
        }

        // 2. Cambiar estado de la reservación (Cancelado lógico)
        reservation.active = false;
        reservation.status = 'Cancelled';
        await reservation.save();

        // 3. LIBERAR LA MESA: Volver a poner la mesa como 'Disponible'
        await Restaurant.updateOne(
            { "_id": reservation.restaurantId, "mesas._id": reservation.tableId },
            { "$set": { "mesas.$.estado": "Disponible" } }
        );

        res.status(200).json({
            success: true,
            message: "Reservación cancelada y mesa liberada correctamente."
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al cancelar la reservación",
            error: error.message
        });
    }
};