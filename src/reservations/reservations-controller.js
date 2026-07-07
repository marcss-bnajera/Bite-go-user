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
        const { id_restaurante, fecha_reserva, cantidad_personas, id_sucursal } = req.body;
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

        let horarios = restaurant.horarios_atencion;
        if (id_sucursal && restaurant.sucursales?.length) {
            const suc = restaurant.sucursales.id(id_sucursal);
            if (suc?.horarios_atencion) horarios = suc.horarios_atencion;
        }
        if (horarios && horarios.includes(" - ")) {
            const [, cierreStr] = horarios.split(" - ");
            const [cierreH, cierreM] = cierreStr.split(":").map(Number);
            const cierreUTC_h = (cierreH + 6) % 24;
            const cierreDate = new Date(dateToReserve);
            cierreDate.setUTCHours(cierreUTC_h, cierreM, 0, 0);
            if (cierreDate <= dateToReserve) {
                cierreDate.setUTCDate(cierreDate.getUTCDate() + 1);
            }
            cierreDate.setUTCMinutes(cierreDate.getUTCMinutes() - 90);
            if (dateToReserve > cierreDate) {
                return res.status(400).json({
                    success: false,
                    message: `La reserva debe ser al menos 1.5 horas antes del cierre (${cierreStr})`
                });
            }
        }

        let mesasBase;
        if (id_sucursal) {
            const sucursal = restaurant.sucursales.id(id_sucursal);
            if (!sucursal) {
                return res.status(404).json({
                    success: false,
                    message: "Sucursal no encontrada."
                });
            }
            mesasBase = sucursal.mesas;
        } else {
            mesasBase = restaurant.mesas;
        }

        const candidatas = mesasBase
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

        const querySolapamiento = {
            id_restaurante,
            activo: true,
            estado: { $in: ['Confirmada', 'Atendida'] },
            fecha_reserva: { $gte: ventanaInicio, $lte: ventanaFin }
        };
        if (id_sucursal) querySolapamiento.id_sucursal = id_sucursal;

        const reservasSolapadas = await Reservation.find(querySolapamiento).select('id_mesa');

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
            id_sucursal: id_sucursal || '',
            id_mesa: mesaLibre._id,
            fecha_reserva: dateToReserve,
            cantidad_personas,
            estado: 'Confirmada'
        });

        const queryConflicto = {
            _id: { $ne: newReservation._id },
            id_restaurante,
            id_mesa: mesaLibre._id,
            activo: true,
            estado: { $in: ['Confirmada', 'Atendida'] },
            fecha_reserva: { $gte: ventanaInicio, $lte: ventanaFin },
            createdAt: { $lt: newReservation.createdAt }
        };
        if (id_sucursal) queryConflicto.id_sucursal = id_sucursal;

        const conflictoPrevio = await Reservation.findOne(queryConflicto);

        if (conflictoPrevio) {
            await Reservation.findByIdAndDelete(newReservation._id);
            return res.status(409).json({
                success: false,
                message: "Esa mesa acaba de ser reservada por otro cliente para ese horario. Intenta con otro horario."
            });
        }

        const updateQuery = id_sucursal
            ? { _id: id_restaurante, "sucursales._id": id_sucursal, "sucursales.mesas._id": mesaLibre._id }
            : { _id: id_restaurante, "mesas._id": mesaLibre._id };
        const updateField = id_sucursal
            ? { $set: { "sucursales.$[s].mesas.$[m].estado": "Reservada" } }
            : { $set: { "mesas.$[m].estado": "Reservada" } };
        const arrayFilters = id_sucursal
            ? [{ "s._id": id_sucursal }, { "m._id": mesaLibre._id }]
            : [{ "m._id": mesaLibre._id }];
        await Restaurant.updateOne(updateQuery, updateField, { arrayFilters });

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
            .populate('id_restaurante', 'nombre direccion sucursales')
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
 * GET - Disponibilidad de mesas para una fecha/hora específica
 * Calcula en tiempo real qué mesas están libres consultando la colección Reservation
 */
export const getTablesAvailability = async (req, res) => {
    try {
        const { id_restaurante, fecha_reserva, id_sucursal } = req.query;

        if (!id_restaurante || !fecha_reserva) {
            return res.status(400).json({
                success: false,
                message: "Se requieren id_restaurante y fecha_reserva"
            });
        }

        const dateToCheck = new Date(fecha_reserva);
        if (isNaN(dateToCheck.getTime())) {
            return res.status(400).json({ success: false, message: "fecha_reserva no es válida" });
        }

        const restaurant = await Restaurant.findOne({ _id: id_restaurante, activo: true });
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurante no encontrado" });
        }

        let mesasBase;
        if (id_sucursal) {
            const sucursal = restaurant.sucursales.id(id_sucursal);
            if (!sucursal) {
                return res.status(404).json({ success: false, message: "Sucursal no encontrada" });
            }
            mesasBase = sucursal.mesas;
        } else {
            mesasBase = restaurant.mesas;
        }

        const ventanaInicio = new Date(dateToCheck.getTime() - RESERVATION_WINDOW_MS);
        const ventanaFin = new Date(dateToCheck.getTime() + RESERVATION_WINDOW_MS);

        const querySolapamiento = {
            id_restaurante,
            activo: true,
            estado: { $in: ['Confirmada', 'Atendida'] },
            fecha_reserva: { $gte: ventanaInicio, $lte: ventanaFin }
        };
        if (id_sucursal) querySolapamiento.id_sucursal = id_sucursal;

        const reservasSolapadas = await Reservation.find(querySolapamiento).select('id_mesa');
        const mesasOcupadas = new Set(reservasSolapadas.map(r => String(r.id_mesa)));

        const mesas = mesasBase.map(m => ({
            _id: m._id,
            numero: m.numero,
            capacidad: m.capacidad,
            ubicacion: m.ubicacion,
            estado: m.estado,
            disponible: m.estado !== 'Mantenimiento' && !mesasOcupadas.has(String(m._id))
        }));

        const disponibles = mesas.filter(m => m.disponible).length;

        res.status(200).json({
            success: true,
            total: mesas.length,
            disponibles,
            mesas
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener disponibilidad de mesas" });
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

        reservation.estado = 'Cancelada';
        await reservation.save();

        const restaurant = await Restaurant.findById(reservation.id_restaurante).select('mesas sucursales');
        if (restaurant) {
            let mesaActual = null;
            if (reservation.id_sucursal) {
                const suc = restaurant.sucursales?.id(reservation.id_sucursal);
                mesaActual = suc?.mesas?.id(reservation.id_mesa);
            } else {
                mesaActual = restaurant.mesas?.id(reservation.id_mesa);
            }
            if (mesaActual && mesaActual.estado === 'Reservada') {
                const updateQuery = reservation.id_sucursal
                    ? { _id: reservation.id_restaurante, "sucursales._id": reservation.id_sucursal, "sucursales.mesas._id": reservation.id_mesa }
                    : { _id: reservation.id_restaurante, "mesas._id": reservation.id_mesa };
                const updateField = reservation.id_sucursal
                    ? { $set: { "sucursales.$[s].mesas.$[m].estado": "Disponible" } }
                    : { $set: { "mesas.$[m].estado": "Disponible" } };
                const arrayFilters = reservation.id_sucursal
                    ? [{ "s._id": reservation.id_sucursal }, { "m._id": reservation.id_mesa }]
                    : [{ "m._id": reservation.id_mesa }];
                await Restaurant.updateOne(updateQuery, updateField, { arrayFilters });
            }
        }

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