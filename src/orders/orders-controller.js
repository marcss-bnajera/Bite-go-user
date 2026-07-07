'use strict'

import Order from "./orders-model.js";
import User from "../users/users-model.js";
import Product from "../products/products-model.js";
import { createNotification } from "../notifications/notifications-controller.js";

/**
 * Función puente para Leandro (UserService -> AdminService)
 * Usando fetch nativo de Node 18
 */
const INTER_SERVICE_SECRET = process.env.INTER_SERVICE_SECRET || '';

const notifyInventoryReduction = async (items, id_restaurante, id_sucursal) => {
    try {
        const response = await fetch(`http://admin-service:3002/bite-and-go/v1/inventory/reduce`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Secret': INTER_SERVICE_SECRET
            },
            body: JSON.stringify({ items, id_restaurante, id_sucursal: id_sucursal || '' })
        });
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error("Error comunicando con Leandro (Admin):", error.message);
        return false;
    }
};

const notifyInventoryRestoration = async (items, id_restaurante, id_sucursal) => {
    try {
        const response = await fetch(`http://admin-service:3002/bite-and-go/v1/inventory/restore`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Secret': INTER_SERVICE_SECRET
            },
            body: JSON.stringify({ items, id_restaurante, id_sucursal: id_sucursal || '' })
        });
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error("Error restaurando inventario:", error.message);
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
                .populate('id_restaurante', 'nombre sucursales'),
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
 * GET - Obtener un pedido por ID (solo si pertenece al usuario)
 */
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const id_user = req.user.uid;

        const order = await Order.findOne({ _id: id, id_usuario_cliente: id_user, activo: true })
            .populate('id_restaurante', 'nombre direccion sucursales');

        if (!order) {
            return res.status(404).json({ success: false, message: "Pedido no encontrado" });
        }

        res.status(200).json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener el pedido" });
    }
};

/**
 * POST - Crear un nuevo pedido con ASIGNACIÓN AUTOMÁTICA y SEGURIDAD DE TOKEN
 */
export const createOrder = async (req, res) => {
    try {
        const { items, id_restaurante, tipo_servicio, direccion_entrega, metodo_pago, propina, fecha_programada, codigo_cupon, descuento_cupon, id_sucursal } = req.body;
        const id_usuario_cliente = req.user.uid;

        if (fecha_programada) {
            const fechaDate = new Date(fecha_programada);
            if (isNaN(fechaDate.getTime())) {
                return res.status(400).json({ success: false, message: "La fecha programada no es válida" });
            }
            const ahora = new Date();
            if (fechaDate <= ahora) {
                return res.status(400).json({ success: false, message: "La fecha programada debe ser en el futuro" });
            }
            const maxDate = new Date();
            maxDate.setMonth(maxDate.getMonth() + 1);
            if (fechaDate > maxDate) {
                return res.status(400).json({ success: false, message: "No puedes programar un pedido con más de 1 mes de anticipación" });
            }

            const Restaurant = (await import('../restaurants/restaurants-model.js')).default;
            const restauranteCheck = await Restaurant.findById(id_restaurante);
            if (restauranteCheck) {
                let horarios = restauranteCheck.horarios_atencion;
                if (id_sucursal && restauranteCheck.sucursales?.length) {
                    const suc = restauranteCheck.sucursales.id(id_sucursal);
                    if (suc?.horarios_atencion) horarios = suc.horarios_atencion;
                }
                if (horarios) {
                    const [, cierreStr] = horarios.split(" - ");
                    const [cierreH, cierreM] = cierreStr.split(":").map(Number);
                    const cierreDate = new Date(fecha_programada);
                    cierreDate.setHours(cierreH, cierreM, 0, 0);
                    cierreDate.setMinutes(cierreDate.getMinutes() - 30);
                    if (fechaDate > cierreDate) {
                        return res.status(400).json({ success: false, message: `El pedido programado debe ser al menos 30 minutos antes del cierre (${cierreStr})` });
                    }
                }
            }
        }

        let id_empleado_asignado = null;

        // 1. Asignación automática de personal según disponibilidad
        if (tipo_servicio === 'Comer aquí') {
            const mesero = await User.findOne({
                id_restaurante,
                rol: 'Mesero',
                activo: true
            });
            if (!mesero) {
                return res.status(400).json({
                    success: false,
                    message: "No hay meseros disponibles en este restaurante en este momento. Intenta más tarde o elige otro tipo de servicio."
                });
            }
            id_empleado_asignado = mesero._id;
        } else if (tipo_servicio === 'Domicilio') {
            const repartidor = await User.findOne({
                id_restaurante,
                rol: 'Repartidor',
                activo: true
            });
            if (!repartidor) {
                return res.status(400).json({
                    success: false,
                    message: "No hay repartidores disponibles en este restaurante en este momento. Intenta más tarde o elige otro tipo de servicio."
                });
            }
            id_empleado_asignado = repartidor._id;
        }

        // 2. Verificar stock antes de crear el pedido
        try {
            const stockCheck = await fetch(`http://admin-service:3002/bite-and-go/v1/inventory/check`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Internal-Secret': INTER_SERVICE_SECRET
                },
                body: JSON.stringify({ items, id_restaurante, id_sucursal: id_sucursal || '' })
            });
            const stockData = await stockCheck.json();
            if (!stockData.success) {
                const msg = stockData.faltantes?.join('; ') || "No hay suficiente inventario para este pedido";
                return res.status(400).json({ success: false, message: msg });
            }
        } catch (e) {
            console.error("Error verificando stock:", e.message);
        }

        // 3. Cálculo de total y validación de productos (Lógica extendida)
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

        // 4. Creación del objeto de orden unificado
        const order = new Order({
            id_usuario_cliente,
            id_restaurante,
            id_sucursal: id_sucursal || '',
            id_mesero_asignado: tipo_servicio === 'Comer aquí' ? id_empleado_asignado : null,
            id_repartidor_asignado: tipo_servicio === 'Domicilio' ? id_empleado_asignado : null,
            items,
            tipo_servicio,
            direccion_entrega: tipo_servicio === 'Domicilio' ? (direccion_entrega || '') : '',
            metodo_pago: metodo_pago || '',
            propina: propina || 0,
            fecha_programada: fecha_programada || null,
            descuento_cupon: descuento_cupon || 0,
            codigo_cupon: codigo_cupon || '',
            total: totalCalculado,
            estado: 'Pendiente'
        });

        await order.save();

        // Notificación al usuario
        const restaurante = await import('../restaurants/restaurants-model.js').then(m => m.default.findById(id_restaurante));
        await createNotification({
            id_usuario: id_usuario_cliente,
            titulo: 'Pedido creado',
            mensaje: `Tu pedido en ${restaurante?.nombre || 'el restaurante'} fue recibido y está pendiente.`,
            tipo: 'pedido',
            id_pedido: order._id
        });

        // 5. Notificación de inventario
        await notifyInventoryReduction(items, id_restaurante, id_sucursal);

        res.status(201).json({
            success: true,
            message: "Pedido creado y asignado automáticamente",
            order
        });
    } catch (error) {
        console.error("Error al crear pedido:", error.message);
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

        const orderInfo = await Order.findOne({ _id: id, id_usuario_cliente: id_user, activo: true });

        if (!orderInfo) {
            return res.status(404).json({ success: false, message: "Pedido no encontrado o no te pertenece" });
        }

        if (orderInfo.estado !== 'Pendiente') {
            return res.status(400).json({
                success: false,
                message: `No puedes cancelar un pedido que está en estado: ${orderInfo.estado}`
            });
        }

        await notifyInventoryRestoration(orderInfo.items, orderInfo.id_restaurante, orderInfo.id_sucursal);

        const order = await Order.findByIdAndUpdate(
            id,
            { estado: 'Cancelado' },
            { new: true }
        );

        await createNotification({
            id_usuario: id_user,
            titulo: 'Pedido cancelado',
            mensaje: `Tu pedido #${id.slice(-6).toUpperCase()} ha sido cancelado.`,
            tipo: 'pedido',
            id_pedido: id
        });

        res.status(200).json({
            success: true,
            message: "Pedido cancelado correctamente"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al cancelar pedido" });
    }
};