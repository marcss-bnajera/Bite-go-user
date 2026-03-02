import Restaurant from "../restaurants/restaurants-model.js";

/**
 * GET - Eventos de restaurante
 */
export const getEventos = async (req, res) => {
    try {
        const { id } = req.params;
        // Buscamos solo la seccion de eventos para eso utilizamos select(eventos)
        const restaurant = await Restaurant.findById(id).select("eventos");

        if (!restaurant) return res.status(404).json({
            success: false,
            message: "Restaurante no encontrado"
        });

        res.status(200).json({
            success: true,
            total: restaurant.eventos.length,
            eventos: restaurant.eventos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener eventos",
            error: error.message
        });
    }
};
