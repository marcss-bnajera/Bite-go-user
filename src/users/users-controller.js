import User from "./users-model.js";
import bcrypt from "bcryptjs";

/**
 * POST - Registro de usuario
 */
export const register = async (req, res) => {
    try {
        // 1. Extraemos password y el resto de datos
        const { password, ...data } = req.body;

        // 2. Encriptar contraseña
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        // 3. Creamos el usuario con los nombres de campos en ESPAÑOL
        const user = new User({
            ...data,
            password: hashedPassword,
            rol: "Cliente",
            activo: true
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: "Usuario registrado exitosamente como Cliente"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al registrar usuario",
            error: error.message
        });
    }
};

/**
 * PUT 
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, email, ...data } = req.body;

        if (password) {
            const salt = bcrypt.genSaltSync(10);
            data.password = bcrypt.hashSync(password, salt);
        }

        const user = await User.findByIdAndUpdate(id, data, { new: true });

        if (!user) return res.status(404).json({
            success: false,
            message: "Usuario no encontrado"
        });

        res.status(200).json({
            success: true,
            message: "Usuario actualizado",
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al actualizar",
            error: error.message
        });
    }
};
/**
 * POST - Login (Básico, sin tokens por ahora)
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Buscar al usuario por email
        const user = await User.findOne({ email, activo: true });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "El correo no está registrado o la cuenta está desactivada"
            });
        }

        // 2. Comparar la contraseña encriptada
        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                message: "Contraseña incorrecta"
            });
        }

        res.status(200).json({
            success: true,
            message: `Bienvenido de nuevo, ${user.nombre}`,
            user
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error en el servidor durante el login",
            error: error.message
        });
    }
};

/**
 * GET - Obtener un usuario por ID 
 */
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user || !user.activo) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener el perfil",
            error: error.message
        });
    }
};
