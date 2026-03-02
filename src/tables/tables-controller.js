import Restaurant from "../restaurants/restaurants-model.js";

/**
 * GET - Mesas de restaurante disponible (falta)
 */
export const getMesas = async (req, res) => {
    try {
        const { id } = req.params; // ID del restaurante

        // Buscamos el restaurante pero solo pedimos el campo 'mesas' para eso es select("mesas")
        const restaurant = await Restaurant.findById(id).select("mesas");

        if (!restaurant) return res.status(404).json({
            success: false,
            message: "Restaurante no encontrado"
        });

        res.status(200).json({
            success: true,
            total: restaurant.mesas.length,
            mesas: restaurant.mesas
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener mesas",
            error: error.message
        });
    }
};

// Ocupar una mesa disponible (falta)