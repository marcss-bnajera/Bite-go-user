import Restaurant from "./restaurants-model.js";
import Product from "../products/products-model.js";

/**
 * GET 
 */
export const getRestaurants = async (req, res) => {
    try {
        const { page = 1, limit = 10, categoria, search, categoria_producto } = req.query;
        const safePage = Math.max(1, parseInt(page) || 1);
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 10), 100);

        let query = { activo: true };

        if (categoria) query.categoria_gastronomica = categoria;

        if (search) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.nombre = { $regex: escaped, $options: "i" };
        }

        if (categoria_producto) {
            const restaurantIds = await Product.distinct("id_restaurante", {
                activo: true,
                categoria: categoria_producto
            });
            query._id = { $in: restaurantIds };
        }

        const [restaurants, total] = await Promise.all([
            Restaurant.find(query)
                .select("-eventos")
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .sort({ createdAt: -1 }),
            Restaurant.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / safeLimit),
            currentPage: safePage,
            restaurants
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener restaurantes" });
    }
};

/**
 * GET 
 */
export const getRestaurantById = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findOne({ _id: id, activo: true });

        if (!restaurant) return res.status(404).json({
            success: false,
            message: "Restaurante no encontrado o no disponible"
        });

        res.status(200).json({
            success: true,
            restaurant
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
};