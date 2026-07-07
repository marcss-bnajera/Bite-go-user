'use strict'

import Notification from './notifications-model.js';

/**
 * GET - Obtener notificaciones del usuario autenticado
 */
export const getNotifications = async (req, res) => {
    try {
        const id_usuario = req.user.uid;
        const { page = 1, limit = 20, solo_no_leidas = false } = req.query;
        const safePage = Math.max(1, parseInt(page) || 1);
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 20), 50);

        const query = { id_usuario };
        if (solo_no_leidas === 'true') query.leido = false;

        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .sort({ createdAt: -1 }),
            Notification.countDocuments(query)
        ]);

        const noLeidas = await Notification.countDocuments({ id_usuario, leido: false });

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / safeLimit),
            currentPage: safePage,
            noLeidas,
            notifications
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener notificaciones" });
    }
};

/**
 * GET - Contar no leídas (para el badge del header)
 */
export const getUnreadCount = async (req, res) => {
    try {
        const noLeidas = await Notification.countDocuments({ id_usuario: req.user.uid, leido: false });
        res.status(200).json({ success: true, noLeidas });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al contar notificaciones" });
    }
};

/**
 * PUT - Marcar una notificación como leída
 */
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findOneAndUpdate(
            { _id: id, id_usuario: req.user.uid },
            { leido: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ success: false, message: "Notificación no encontrada" });
        res.status(200).json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al marcar notificación" });
    }
};

/**
 * PUT - Marcar todas como leídas
 */
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { id_usuario: req.user.uid, leido: false },
            { leido: true }
        );
        res.status(200).json({ success: true, message: "Todas las notificaciones marcadas como leídas" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al marcar notificaciones" });
    }
};

/**
 * Función auxiliar - Crear notificación (llamada desde otros controllers)
 */
export const createNotification = async ({ id_usuario, titulo, mensaje, tipo, id_pedido = null }) => {
    try {
        const notification = new Notification({ id_usuario, titulo, mensaje, tipo, id_pedido });
        await notification.save();
        return notification;
    } catch (error) {
        console.error("Error al crear notificación:", error.message);
        return null;
    }
};
