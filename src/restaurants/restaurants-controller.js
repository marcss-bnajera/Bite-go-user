import Restaurant from "./restaurants-model.js";

/**
 * GET - Listar con paginación
 */
export const getRestaurants = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const query = { activo: true };

        const [restaurants, total] = await Promise.all([
            Restaurant.find(query)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            Restaurant.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            restaurants
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener restaurantes", error: error.message });
    }
};
