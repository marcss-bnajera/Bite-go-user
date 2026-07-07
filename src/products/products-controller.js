import Product from "./products-model.js";

/**
 * GET - Listar todos los productos (Catálogo general)
 */
export const getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const safePage = Math.max(1, parseInt(page) || 1);
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 10), 100);
        const query = { activo: true, disponibilidad: true };

        if (search) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.nombre = { $regex: escaped, $options: "i" };
        }

        const [products, total] = await Promise.all([
            Product.find(query)
                .select('-receta')
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .sort({ createdAt: -1 })
                .populate('id_restaurante', 'nombre categoria_gastronomica')
                .populate('categoria', 'nombre'),
            Product.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / safeLimit),
            currentPage: safePage,
            products
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener productos" });
    }
};

/**
 * GET - Obtener menú completo de un restaurante específico
 */
export const getProductsByRestaurant = async (req, res) => {
    try {
        const { id_restaurante } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const safePage = Math.max(1, parseInt(page) || 1);
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 10), 100);

        const query = { id_restaurante, activo: true, disponibilidad: true };

        const [products, total] = await Promise.all([
            Product.find(query)
                .select('-receta')
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .sort({ createdAt: -1 })
                .populate('categoria', 'nombre'),
            Product.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / safeLimit),
            currentPage: safePage,
            products
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener productos del restaurante" });
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
        }).select("nombre descripcion precio categoria foto_url variaciones")
          .populate('categoria', 'nombre');

        res.status(200).json({
            success: true,
            message: "Menú cargado exitosamente",
            total: menu.length,
            menu
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener el menú" });
    }
};

/**
 * GET - Buscar producto por nombre
 */
export const searchProductsUser = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ success: false, message: "Debes enviar un término de búsqueda" });

        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const products = await Product.find({
            nombre: { $regex: escaped, $options: "i" },
            activo: true,
            disponibilidad: true
        })
            .limit(20)
            .populate("id_restaurante", "nombre")
            .populate("categoria", "nombre");

        res.status(200).json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al buscar productos" });
    }
};

/**
 * GET - Obtener un producto específico por su ID
 */
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findOne({ _id: id, activo: true })
            .select('-receta')
            .populate('id_restaurante', 'nombre direccion categoria_gastronomica')
            .populate('categoria', 'nombre');

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
           
        });
    }
};