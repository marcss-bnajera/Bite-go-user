import User from "./users-model.js";
import { cloudinary } from "../../middlewares/file-uploader.js";

/**
 * Helper: buscar usuario por auth_id (el ID string del JWT del auth-service .NET)
 */
const findByAuthId = async (authId) => {
    return User.findOne({ auth_id: authId });
};

/**
 * GET - Verificar si el usuario autenticado existe en MongoDB (sin crear).
 * Se usa en re-validación de sesión (refresh, cambio de pestaña).
 */
export const getMe = async (req, res) => {
    try {
        const user = await findByAuthId(req.user.uid);
        if (!user) {
            return res.status(404).json({ success: false, message: "Usuario no encontrado" });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al verificar usuario" });
    }
};

/**
 * POST - Sincronizar usuario desde auth-service (.NET) al user-service (Node.js/MongoDB).
 * Solo verifica que el usuario exista. Si no existe, retorna 404.
 */
export const syncUser = async (req, res) => {
    try {
        const auth_id = req.user.uid;
        const email = req.user.email;
        const name = req.user.name || '';
        const surname = req.user.surname || '';
        const username = req.user.username || '';

        if (!auth_id) {
            return res.status(400).json({ success: false, message: "Token no contiene auth_id" });
        }

        let user = await User.findOne({ auth_id });

        if (!user && email) {
            user = await User.findOne({ email });
            if (user) {
                user.auth_id = auth_id;
                await user.save();
            }
        }

        if (!user) {
            user = await User.create({
                auth_id,
                email,
                nombre: `${name} ${surname}`.trim() || username || email.split('@')[0],
                username: username || email.split('@')[0],
                rol: 'Cliente',
                activo: true
            });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al sincronizar usuario" });
    }
};

/**
 * POST - Registro de usuario en MongoDB (desde auth-service o frontend).
 * No requiere password porque la auth la maneja .NET.
 */
export const register = async (req, res) => {
    try {
        const { auth_id, email, nombre, username, rol, telefono } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "El correo es obligatorio"
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            if (auth_id && !existingUser.auth_id) {
                existingUser.auth_id = auth_id;
                await existingUser.save();
            }
            return res.status(200).json({
                success: true,
                message: "Usuario ya existía en MongoDB",
                user: existingUser
            });
        }

        const user = new User({
            auth_id: auth_id || undefined,
            email,
            nombre: nombre || "Usuario",
            username: username || "",
            telefono: telefono || "",
            rol: rol || "Cliente",
            activo: true
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: "Usuario registrado exitosamente en MongoDB",
            user
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

        const user = await findByAuthId(req.user.uid);
        if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

        if (user._id.toString() !== id) {
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
            user.password = password;
        }

        const updateData = { nombre: data.nombre, telefono: data.telefono, direccion: data.direccion };
        Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

        Object.assign(user, updateData);
        await user.save();

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
 * Solo permite ver tu propio perfil (o SuperAdmin ve cualquiera)
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

        if (req.user.rol !== 'SuperAdmin' && user.auth_id !== req.user.uid) {
            return res.status(403).json({
                success: false,
                message: "No tienes permiso para ver el perfil de otro usuario"
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

/**
 * GET - Obtener favoritos del usuario autenticado
 */
export const getFavorites = async (req, res) => {
    try {
        const user = await findByAuthId(req.user.uid);
        if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });
        await user.populate('favoritos', 'nombre direccion fotos_url categoria_gastronomica precio_promedio');
        res.status(200).json({ success: true, favoritos: user.favoritos });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener favoritos" });
    }
};

/**
 * POST - Toggle favorito (agregar/quitar)
 */
export const toggleFavorite = async (req, res) => {
    try {
        const { id_restaurante } = req.body;
        const user = await findByAuthId(req.user.uid);
        if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

        const index = user.favoritos.indexOf(id_restaurante);
        if (index > -1) {
            user.favoritos.splice(index, 1);
        } else {
            user.favoritos.push(id_restaurante);
        }
        await user.save();

        res.status(200).json({
            success: true,
            isFavorite: index === -1,
            message: index > -1 ? "Eliminado de favoritos" : "Agregado a favoritos"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al actualizar favorito" });
    }
};

/**
 * GET - Obtener direcciones del usuario
 */
export const getAddresses = async (req, res) => {
    try {
        const user = await findByAuthId(req.user.uid);
        if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });
        res.status(200).json({ success: true, direcciones: user.direcciones });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener direcciones" });
    }
};

/**
 * POST - Agregar dirección
 */
export const addAddress = async (req, res) => {
    try {
        const { etiqueta, direccion, predeterminada } = req.body;
        const user = await findByAuthId(req.user.uid);
        if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

        if (predeterminada) {
            user.direcciones.forEach(d => d.predeterminada = false);
        }
        user.direcciones.push({ etiqueta, direccion, predeterminada: !!predeterminada });

        if (predeterminada || user.direcciones.length === 1) {
            user.direccion = direccion;
        }
        await user.save();

        res.status(201).json({ success: true, message: "Dirección agregada", direcciones: user.direcciones });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al agregar dirección" });
    }
};

/**
 * PUT - Subir foto de perfil
 */
export const uploadProfilePhoto = async (req, res) => {
    try {
        const user = await findByAuthId(req.user.uid);
        if (!user) {
            return res.status(404).json({ success: false, message: "Usuario no encontrado" });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No se envió ninguna imagen" });
        }

        if (user.foto_public_id) {
            await cloudinary.uploader.destroy(user.foto_public_id);
        }

        user.foto_url = req.file.path;
        user.foto_public_id = req.file.filename;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Foto de perfil actualizada",
            foto_url: user.foto_url
        });
    } catch (error) {
        console.error("uploadProfilePhoto error:", error);
        res.status(500).json({ success: false, message: "Error al subir la imagen" });
    }
};

/**
 * DELETE - Eliminar foto de perfil
 */
export const deleteProfilePhoto = async (req, res) => {
    try {
        const user = await findByAuthId(req.user.uid);
        if (!user) {
            return res.status(404).json({ success: false, message: "Usuario no encontrado" });
        }

        if (user.foto_public_id) {
            await cloudinary.uploader.destroy(user.foto_public_id);
        }

        user.foto_url = "";
        user.foto_public_id = "";
        await user.save();

        res.status(200).json({
            success: true,
            message: "Foto de perfil eliminada"
        });
    } catch (error) {
        console.error("deleteProfilePhoto error:", error);
        res.status(500).json({ success: false, message: "Error al eliminar la imagen" });
    }
};

/**
 * DELETE - Eliminar dirección
 */
export const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await findByAuthId(req.user.uid);
        if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

        user.direcciones = user.direcciones.filter(d => d._id.toString() !== id);

        const pred = user.direcciones.find(d => d.predeterminada);
        user.direccion = pred ? pred.direccion : (user.direcciones[0]?.direccion || "");

        await user.save();

        res.status(200).json({ success: true, message: "Dirección eliminada", direcciones: user.direcciones });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al eliminar dirección" });
    }
};
