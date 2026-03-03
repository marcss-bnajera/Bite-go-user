'use strict'

import Order from "../orders/orders-model.js";
import Product from "../products/products-model.js";

/**
 * Función puente para Leandro (Misma lógica centralizada)
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
 * GET - Listar todos los items de una orden específica
 */
export const getItemsByOrder = async (req, res) => {
    try {
        const { id_order } = req.params;
        const order = await Order.findById(id_order).select('items total');
        if (!order) return res.status(404).json({ success: false, message: "Orden no encontrada" });
        res.status(200).json({ success: true, items: order.items, total_actual: order.total });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * POST - Agregar item
 */
export const addItemToActiveOrder = async (req, res) => {
    try {
        const { id_order } = req.params;
        const itemData = req.body;

        const producto = await Product.findById(itemData.id_producto);
        if (!producto) return res.status(404).json({ message: "Producto no existe" });

        let precioExtras = 0;
        if (itemData.variaciones_elegidas) {
            precioExtras = itemData.variaciones_elegidas.reduce((acc, v) => acc + (v.precio_adicional || 0), 0);
        }

        const subtotalItem = (producto.precio + precioExtras) * itemData.cantidad;
        itemData.nombre_historico = producto.nombre;
        itemData.precio_historico = producto.precio;

        const updatedOrder = await Order.findByIdAndUpdate(
            id_order,
            { $push: { items: itemData }, $inc: { total: subtotalItem } },
            { new: true }
        );

        // Notificación a Leandro para reducción de stock del nuevo item
        await notifyInventoryReduction([itemData], updatedOrder.id_restaurante);

        res.status(201).json({ success: true, message: "Item agregado", order: updatedOrder });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * PUT - Editar cantidad o notas
 */
export const updateItemInOrder = async (req, res) => {
    try {
        const { id_order, id_item } = req.params;
        const { cantidad, notas } = req.body;

        const order = await Order.findById(id_order);
        if (!order) return res.status(404).json({ message: "Orden no encontrada" });

        const item = order.items.id(id_item);
        if (!item) return res.status(404).json({ message: "Item no encontrado en la orden" });

        if (cantidad && cantidad !== item.cantidad) {
            const precioExtras = item.variaciones_elegidas ? item.variaciones_elegidas.reduce((acc, v) => acc + (v.precio_adicional || 0), 0) : 0;
            const diferencia = cantidad - item.cantidad;
            const precioUnitario = item.precio_historico + precioExtras;
            order.total += (diferencia * precioUnitario);
            item.cantidad = cantidad;
            // Nota: Aquí se podría implementar lógica de devolución/ajuste de stock si fuera necesario
        }

        if (notas) item.notas = notas;

        await order.save();
        res.status(200).json({ success: true, message: "Item actualizado", order });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * DELETE - Eliminar un item
 */
export const deleteItemFromOrder = async (req, res) => {
    try {
        const { id_order, id_item } = req.params;
        const order = await Order.findById(id_order);
        if (!order) return res.status(404).json({ message: "Orden no encontrada" });

        const item = order.items.id(id_item);
        if (!item) return res.status(404).json({ message: "Item no encontrado" });

        const precioExtras = item.variaciones_elegidas ? item.variaciones_elegidas.reduce((acc, v) => acc + (v.precio_adicional || 0), 0) : 0;
        const precioUnitario = item.precio_historico + precioExtras;
        order.total -= (precioUnitario * item.cantidad);

        item.deleteOne();
        await order.save();
        res.status(200).json({ success: true, message: "Item eliminado de la orden", total_restante: order.total });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};