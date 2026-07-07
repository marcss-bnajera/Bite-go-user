// Importacion del modelo
import Reservation from "./reservations-model.js";
import Restaurant from "../restaurants/restaurants-model.js";

/**
 * POST - Crear una nueva reservación con lógica de disponibilidad
 */
export const createReservation = async (req, res) => {
    try {
        const { id_restaurante, fecha_reserva, cantidad_personas } = req.body;
        const id_usuario = req.user.uid;

        const dateToReserve = new Date(fecha_reserva);
        if (dateToReserve < new Date()) {
            return res.status(400).json({
                success: false,
                message: "No puedes reservar en una fecha o hora pasada."
            });
        }

        const restaurant = await Restaurant.findOne({ _id: id_restaurante, activo: true });
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurante no encontrado o cerrado temporalmente."
            });
        }

        const table = restaurant.mesas.find(m =>
            m.estado === 'Disponible' && m.capacidad >= cantidad_personas
        );

        if (!table) {
            return res.status(400).json({
                success: false,
                message: "Lo sentimos, no hay mesas disponibles para esa cantidad de personas en este momento."
            });
        }

        const newReservation = new Reservation({
            id_usuario,
            id_restaurante,
            id_mesa: table._id,
            fecha_reserva: dateToReserve,
            cantidad_personas,
            estado: 'Confirmada'
        });

        await newReservation.save();

        await Restaurant.updateOne(
            { "_id": id_restaurante, "mesas._id": table._id },
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
           
        });
    }
};

/**
 * GET - Listar MIS reservaciones (Filtro de privacidad)
 */
export const getMyReservations = async (req, res) => {
    try {
        const id_usuario = req.user.uid;
        const reservations = await Reservation.find({ id_usuario, activo: true })
            .populate('id_restaurante', 'nombre direccion')
            .sort({ fecha_reserva: 1 });

        res.status(200).json({
            success: true,
            total: reservations.length,
            reservations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener tu historial",
           
        });
    }
};

/**
 * DELETE - Cancelar una reservación y liberar la mesa
 */
export const deleteReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const id_usuario = req.user.uid;

        const reservation = await Reservation.findOne({ _id: id, id_usuario, activo: true });

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: "Reservación no encontrada o ya cancelada."
            });
        }

        reservation.activo = false;
        reservation.estado = 'Cancelada';
        await reservation.save();

        await Restaurant.updateOne(
            { "_id": reservation.id_restaurante, "mesas._id": reservation.id_mesa },
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
           
        });
    }
};