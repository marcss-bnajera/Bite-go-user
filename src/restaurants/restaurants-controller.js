import Restaurant from "./restaurants-model.js";

/**
 * GET 
 */
export const getRestaurants = async (req, res) => {
    try {
        const { page = 1, limit = 10, categoria, search } = req.query;

        let query = { activo: true };

        if (categoria) query.categoria_gastronomica = categoria;

        if (search) query.nombre = { $regex: search, $options: "i" };

        const [restaurants, total] = await Promise.all([
            Restaurant.find(query)
                .select("-eventos")
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
        res.status(500).json({ success: false, error: error.message });
    }
};