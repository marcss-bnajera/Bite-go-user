import Order from "./orders-model.js";

/**
 * GET - Obtener MIS pedidos (Historial del cliente)
 */
export const getOrdersByUser = async (req, res) => {
    try {
        // SEGURIDAD: Obtenemos el ID del token, ignoramos params
        const id_user = req.user.uid;
        const { page = 1, limit = 10 } = req.query;

        const query = { id_usuario_cliente: id_user, activo: true };

        const [orders, total] = await Promise.all([
            Order.find(query)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 })
                .populate('id_restaurante', 'nombre'), // Para que vea dónde pidió
            Order.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener tu historial de pedidos",
            error: error.message
        });
    }
};

/**
 * POST - Crear un nuevo pedido (Checkout)
 */
export const createOrder = async (req, res) => {
    try {
        // Obtenemos los datos, forzamos el ID del cliente según el token
        const orderData = req.body;
        orderData.id_usuario_cliente = req.user.uid;

        // Forzamos el estado inicial, el cliente no puede mandarlo como 'Entregado'
        orderData.estado = 'Pendiente';

        // Cálculo del total por seguridad (Back-end rules)
        let calculatedTotal = 0;
        if (orderData.items && orderData.items.length > 0) {
            orderData.items.forEach(item => {
                calculatedTotal += (item.precio_historico * item.cantidad);
            });
        }
        orderData.total = calculatedTotal;

        const order = new Order(orderData);
        await order.save();

        res.status(201).json({
            success: true,
            message: "Pedido creado exitosamente",
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al crear pedido",
            error: error.message
        });
    }
};

/**
 * DELETE - Cancelar un pedido (Solo si está Pendiente)
 */
export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const id_user = req.user.uid;

        // 1. Buscamos el pedido asegurando que sea del usuario
        const orderInfo = await Order.findOne({ _id: id, id_usuario_cliente: id_user, activo: true });

        if (!orderInfo) {
            return res.status(404).json({ success: false, message: "Pedido no encontrado o no te pertenece" });
        }

        // 2. Regla de negocio: No se puede cancelar si ya se está cocinando
        if (orderInfo.estado !== 'Pendiente') {
            return res.status(400).json({
                success: false,
                message: `No puedes cancelar un pedido que está en estado: ${orderInfo.estado}`
            });
        }

        // 3. Cancelación lógica
        const order = await Order.findByIdAndUpdate(
            id,
            { activo: false, estado: 'Cancelado' },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Pedido cancelado correctamente",
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al cancelar pedido",
            error: error.message
        });
    }
};