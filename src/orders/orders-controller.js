'use strict'

import Order from "./orders-model.js";
import User from "../users/users-model.js";
import Product from "../products/products-model.js";

/**
 * Función puente para Leandro (UserService -> AdminService)
 * Usando fetch nativo de Node 18
 */
const notifyInventoryReduction = async (items, id_restaurante) => {
    try {
        const response = await fetch(`http://admin-service:3002/bite-and-go/v1/inventory/reduce`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items, id_restaurante })
        });
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error("Error comunicando con Leandro (Admin):", error.message);
        return false;
    }
};

/**
 * GET - Obtener MIS pedidos (Historial del cliente)
 */
export const getOrdersByUser = async (req, res) => {
    try {
        // SEGURIDAD: Obtenemos el ID del token (req.user.uid)
        const id_user = req.user.uid;
        const { page = 1, limit = 10 } = req.query;
        const safePage = Math.max(1, parseInt(page) || 1);
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 10), 100);

        const query = { id_usuario_cliente: id_user, activo: true };

        const [orders, total] = await Promise.all([
            Order.find(query)
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .sort({ createdAt: -1 })
                .populate('id_restaurante', 'nombre'),
            Order.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / safeLimit),
            currentPage: safePage,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener tu historial de pedidos",
           
        });
    }
};

/**
 * POST - Crear un nuevo pedido con ASIGNACIÓN AUTOMÁTICA y SEGURIDAD DE TOKEN
 */
export const createOrder = async (req, res) => {
    try {
        const { items, id_restaurante, tipo_servicio } = req.body;
        // SEGURIDAD: El ID del cliente viene del TOKEN, no del body
        const id_usuario_cliente = req.user.uid;

        let id_empleado_asignado = null;

        // 1. Asignación automática de personal según disponibilidad
        if (tipo_servicio === 'Comer aquí') {
            const mesero = await User.findOne({
                id_restaurante,
                rol: 'Mesero',
                activo: true
            });
            if (mesero) id_empleado_asignado = mesero._id;
        } else if (tipo_servicio === 'Domicilio') {
            const repartidor = await User.findOne({
                id_restaurante,
                rol: 'Repartidor',
                activo: true
            });
            if (repartidor) id_empleado_asignado = repartidor._id;
        }

        // 2. Cálculo de total y validación de productos (Lógica extendida)
        let totalCalculado = 0;
        for (const item of items) {
            const productoOriginal = await Product.findById(item.id_producto);
            if (!productoOriginal) {
                return res.status(404).json({ success: false, message: `Producto no encontrado: ${item.id_producto}` });
            }

            let precioExtras = 0;
            if (item.variaciones_elegidas && Array.isArray(item.variaciones_elegidas)) {
                precioExtras = item.variaciones_elegidas.reduce((acc, v) => acc + (Number(v.precio_adicional) || 0), 0);
            }

            item.precio_historico = productoOriginal.precio; // Corregido el nombre a 'historico'
            item.nombre_historico = productoOriginal.nombre;
            totalCalculado += (item.precio_historico + precioExtras) * item.cantidad;
        }

        // 3. Creación del objeto de orden unificado
        const order = new Order({
            id_usuario_cliente,
            id_restaurante,
            id_mesero_asignado: tipo_servicio === 'Comer aquí' ? id_empleado_asignado : null,
            id_repartidor_asignado: tipo_servicio === 'Domicilio' ? id_empleado_asignado : null,
            items,
            tipo_servicio,
            total: totalCalculado,
            estado: 'Pendiente'
        });

        await order.save();

        // 4. Notificación de inventario
        await notifyInventoryReduction(items, id_restaurante);

        res.status(201).json({
            success: true,
            message: "Pedido creado y asignado automáticamente",
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al crear pedido con asignación",
           
        });
    }
};

/**
 * PUT - Actualizar un pedido 
 */
export const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;

        // Solo permitir campos editables por el cliente (prevenir mass assignment)
        const { notas } = req.body;
        const data = { notas };
        Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);

        // Verificar que la orden pertenece al usuario
        const order = await Order.findOneAndUpdate(
            { _id: id, id_usuario_cliente: req.user.uid, activo: true },
            data,
            { new: true, runValidators: true }
        );
        if (!order) return res.status(404).json({ success: false, message: "Pedido no encontrado" });

        res.status(200).json({ success: true, message: "Pedido actualizado", order });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al actualizar pedido" });
    }
};

/**
 * DELETE - Cancelar un pedido (Solo si es del dueño y está Pendiente)
 */
export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const id_user = req.user.uid;

        // Buscamos asegurando pertenencia (Seguridad de Token)
        const orderInfo = await Order.findOne({ _id: id, id_usuario_cliente: id_user, activo: true });

        if (!orderInfo) {
            return res.status(404).json({ success: false, message: "Pedido no encontrado o no te pertenece" });
        }

        // Regla de negocio: No cancelar si ya pasó de Pendiente
        if (orderInfo.estado !== 'Pendiente') {
            return res.status(400).json({
                success: false,
                message: `No puedes cancelar un pedido que está en estado: ${orderInfo.estado}`
            });
        }

        const order = await Order.findByIdAndUpdate(
            id,
            { activo: false, estado: 'Cancelado' },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Pedido cancelado correctamente"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al cancelar pedido" });
    }
};