// Importacion del modelo
import Reservation from "./reservations-model.js";
import Restaurant from "../restaurants/restaurants-model.js";

// Ventana de tiempo que bloquea una mesa alrededor de una reserva (misma ventana que usa Bite-go-admin)
const RESERVATION_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 horas

/**
 * POST - Crear una nueva reservación con lógica de disponibilidad
 *
 * Antes, una reservación marcaba la mesa como 'Reservada' para siempre (solo se
 * liberaba si el propio cliente cancelaba). Con el tiempo todas las mesas quedaban
 * bloqueadas y ya no se podía asignar ninguna. Ahora la disponibilidad se calcula
 * por ventana de tiempo alrededor de la fecha solicitada, igual que en el panel admin.
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

        const candidatas = restaurant.mesas
            .filter(m => m.estado !== 'Mantenimiento' && m.capacidad >= cantidad_personas)
            .sort((a, b) => a.capacidad - b.capacidad);

        if (candidatas.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Lo sentimos, no hay mesas disponibles para esa cantidad de personas en este momento."
            });
        }

        const ventanaInicio = new Date(dateToReserve.getTime() - RESERVATION_WINDOW_MS);
        const ventanaFin = new Date(dateToReserve.getTime() + RESERVATION_WINDOW_MS);

        const reservasSolapadas = await Reservation.find({
            id_restaurante,
            activo: true,
            estado: { $in: ['Confirmada', 'Atendida'] },
            fecha_reserva: { $gte: ventanaInicio, $lte: ventanaFin }
        }).select('id_mesa');

        const mesasOcupadas = new Set(reservasSolapadas.map(r => String(r.id_mesa)));
        const mesaLibre = candidatas.find(m => !mesasOcupadas.has(String(m._id)));

        if (!mesaLibre) {
            return res.status(400).json({
                success: false,
                message: "Lo sentimos, no hay mesas disponibles para esa cantidad de personas en ese horario."
            });
        }

        const newReservation = await Reservation.create({
            id_usuario,
            id_restaurante,
            id_mesa: mesaLibre._id,
            fecha_reserva: dateToReserve,
            cantidad_personas,
            estado: 'Confirmada'
        });

        // Re-chequeo tras escribir: si otra reservación concurrente tomó la misma mesa
        // y horario antes que esta, la más nueva pierde (evita doble reserva sin
        // depender de transacciones de Mongo, que no siempre están disponibles).
        const conflictoPrevio = await Reservation.findOne({
            _id: { $ne: newReservation._id },
            id_restaurante,
            id_mesa: mesaLibre._id,
            activo: true,
            estado: { $in: ['Confirmada', 'Atendida'] },
            fecha_reserva: { $gte: ventanaInicio, $lte: ventanaFin },
            createdAt: { $lt: newReservation.createdAt }
        });

        if (conflictoPrevio) {
            await Reservation.findByIdAndDelete(newReservation._id);
            return res.status(409).json({
                success: false,
                message: "Esa mesa acaba de ser reservada por otro cliente para ese horario. Intenta con otro horario."
            });
        }

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
 * DELETE - Cancelar una reservación
 *
 * Ya no hace falta "liberar" la mesa aparte: al quedar activo:false / estado:'Cancelada',
 * createReservation deja de contarla como ocupación al calcular la ventana de tiempo.
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

        res.status(200).json({
            success: true,
            message: "Reservación cancelada correctamente."
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al cancelar la reservación",
            error: error.message
        });
    }
};