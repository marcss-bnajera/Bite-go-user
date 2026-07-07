import User from "./users-model.js";

/**
 * POST - Registro de usuario (solo clientes)
 */
export const register = async (req, res) => {
    try {
        const { password, ...data } = req.body;

        if (!password || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "La contraseña debe tener al menos 8 caracteres"
            });
        }

        const existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "El correo ya está registrado"
            });
        }

        const user = new User({
            ...data,
            password,
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
           
        });
    }
};

/**
 * PUT - Actualizar perfil propio
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, email, rol, ...data } = req.body;

        if (req.user.uid !== id) {
            return res.status(403).json({
                success: false,
                message: "No tienes permiso para actualizar un perfil que no es el tuyo."
            });
        }

        if (password) {
            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: "La contraseña debe tener al menos 8 caracteres"
                });
            }
            data.password = password;
        }

        const allowedFields = { nombre: data.nombre, telefono: data.telefono, direccion: data.direccion, dpi: data.dpi };
        Object.keys(allowedFields).forEach(k => allowedFields[k] === undefined && delete allowedFields[k]);

        const user = await User.findByIdAndUpdate(id, allowedFields, { new: true });

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
           
        });
    }
};
