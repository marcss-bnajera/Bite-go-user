import Product from "./products-model.js";

/**
 * GET - Listar todos los productos (Catálogo general)
 */
export const getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;

        // Regla: Solo productos activos y disponibles
        const query = { activo: true, disponibilidad: true };

        if (search) {
            query.nombre = { $regex: search, $options: "i" };
        }

        const [products, total] = await Promise.all([
            Product.find(query)
                .select('-receta') // Oculta los ingredientes/receta al cliente
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
 * GET - Obtener menú completo de un restaurante específico
 */
export const getProductsByRestaurant = async (req, res) => {
    try {
        const { id_restaurante } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Regla: Solo activos y disponibles de ESE restaurante
        const query = { id_restaurante, activo: true, disponibilidad: true };

        const [products, total] = await Promise.all([
            Product.find(query)
                .select('-receta') // Ocultamos receta
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
 * GET - Ver detalle de un producto
 */
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findOne({ _id: id, activo: true })
            .select('-receta') // Ocultamos receta
            .populate('id_restaurante', 'nombre direccion');

        if (!product) {
            return res.status(404).json({ success: false, message: "Producto no encontrado o inactivo" });
        }

        res.status(200).json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error en el servidor", error: error.message });
    }
};