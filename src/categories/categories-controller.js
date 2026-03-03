import Category from "./categories-model.js";

/**
 * GET - Obtener categorías de un restaurante específico
 */
export const getCategoriesByUser = async (req, res) => {
    try {
        const { restaurante } = req.query;

        // El usuario debe decir de cual restaurante quiere ver el menú
        if (!restaurante) {
            return res.status(400).json({
                success: false,
                message: "Es necesario el id del restaurante (?restaurante=ID)"
            });
        }

        const query = {
            id_restaurante: restaurante,
            activo: true // El usuario solo ve lo que está activo
        };

        const categories = await Category.find(query)
            .sort({ nombre: 1 }); // Orden alfabético para el cliente

        res.status(200).json({
            success: true,
            total: categories.length,
            categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al consultar el catálogo",
            error: error.message
        });
    }
};