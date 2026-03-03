import Product from "./products-model.js";

/**
 * GET - Menú del Restaurante para el Usuario
 */
export const getMenuUser = async (req, res) => {
    try {
        const { id_restaurante } = req.params;

        // Buscamos productos que el Admin marcó como activos y disponibles
        const menu = await Product.find({
            id_restaurante,
            activo: true,
            disponibilidad: true
        }).select("nombre descripcion precio categoria foto_url variaciones");

        res.status(200).json({
            success: true,
            msg: "Menú cargado exitosamente",
            total: menu.length,
            menu
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * GET - Buscar producto por nombre en todo el sistema (Exploración)
 */
export const searchProductsUser = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ message: "Debes enviar un término de búsqueda" });

        const products = await Product.find({
            nombre: { $regex: q, $options: "i" },
            activo: true,
            disponibilidad: true
        })
            .limit(20)
            .populate("id_restaurante", "nombre");

        res.status(200).json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};