import Product from "./products-model.js";

/**
 * GET - Listar todos los productos (Catálogo general)
 */
export const getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const query = { activo: true, disponibilidad: true };

        if (search) {
            query.nombre = { $regex: search, $options: "i" };
        }

        const [products, total] = await Promise.all([
            Product.find(query)
                .select('-receta')
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

        const query = { id_restaurante, activo: true, disponibilidad: true };

        const [products, total] = await Promise.all([
            Product.find(query)
                .select('-receta')
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            Product.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            products
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * GET - Menú del Restaurante para el Usuario
 */
export const getMenuForUser = async (req, res) => {
    try {
        const { id_restaurante } = req.params;

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
 * GET - Buscar producto por nombre
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

/**
 * GET - Obtener un producto específico por su ID
 */
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscamos el producto por ID, pero aseguramos que esté activo
        const product = await Product.findOne({ _id: id, activo: true })
            .select('-receta') // No mostramos la receta al usuario final
            .populate('id_restaurante', 'nombre direccion categoria_gastronomica');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Producto no encontrado o no está disponible actualmente"
            });
        }

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener el detalle del producto",
            error: error.message
        });
    }
};