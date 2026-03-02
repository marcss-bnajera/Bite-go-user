import Product from "./products-model.js";

/**
 * GET - Listar productos con paginación
 */
export const getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;

        const query = { activo: true };
        if (search) {
            query.nombre = { $regex: search, $options: "i" };
        }

        const [products, total] = await Promise.all([
            Product.find(query)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 })
                .populate('id_restaurante', 'nombre categoria_gastronomica'),
            Product.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            products
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener productos", error: error.message });
    }
};
/**
 * GET - Obtener productos por restaurante
 */
export const getProductsByRestaurant = async (req, res) => {
    try {
        const { id_restaurante } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const query = { id_restaurante, activo: true };

        const [products, total] = await Promise.all([
            Product.find(query)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            Product.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            products
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener productos", error: error.message });
    }
};
/**
 * GET - Obtener un solo producto por ID
 */
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findOne({ _id: id, activo: true })
            .populate('id_restaurante', 'nombre direccion');

        if (!product) {
            return res.status(404).json({ success: false, message: "Producto no encontrado" });
        }

        res.status(200).json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error en el servidor", error: error.message });
    }
};