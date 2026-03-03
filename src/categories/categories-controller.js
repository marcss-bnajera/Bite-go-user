import Category from "./categories-model.js";

/**
 * GET - Obtener categorías de un restaurante específico
 */
export const getCategoriesByUser = async (req, res) => {
    try {
        const { restaurante } = req.query;

        if (!restaurante) {
            return res.status(400).json({
                success: false,
                message: "Es necesario el id del restaurante (?restaurante=ID)"
            });
        }

        const query = {
            id_restaurante: restaurante,
            activo: true
        };

        const categories = await Category.find(query)
            .sort({ nombre: 1 });

        res.status(200).json({
            success: true,
            total: categories.length,
            categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al consultar el catálogo",
        });
    }
};

/**
 * GET - Obtener todas las categorías únicas de todos los restaurantes
 */
export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.distinct("nombre", { activo: true });

        res.status(200).json({
            success: true,
            total: categories.length,
            categories: categories.sort()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener las categorías"
        });
    }
};