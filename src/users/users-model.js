'use strict'

import { Schema, model } from 'mongoose';

const userSchema = new Schema({
    auth_id: {
        type: String,
        unique: true,
        sparse: true
    },
    nombre: {
        type: String,
        default: "Usuario",
        trim: true
    },
    username: {
        type: String,
        trim: true,
        default: ""
    },
    email: {
        type: String,
        required: [true, 'El correo es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        select: false
    },
    telefono: {
        type: String,
        trim: true
    },
    direccion: {
        type: String,
        trim: true
    },
    direcciones: [{
        etiqueta: { type: String, trim: true, required: true },
        direccion: { type: String, trim: true, required: true },
        predeterminada: { type: Boolean, default: false }
    }],
    favoritos: [{
        type: Schema.Types.ObjectId,
        ref: 'Restaurant'
    }],
    rol: {
        type: String,
        required: true,
        enum: ['SuperAdmin', 'Admin_Restaurante', 'Mesero', 'Repartidor', 'Cocinero', 'Cliente'],
        default: 'Cliente'
    },
    id_restaurante: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        default: null
    },
    foto_url: {
        type: String,
        default: ""
    },
    foto_public_id: {
        type: String,
        default: ""
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    // Esto asegura que al convertir a JSON no se envíe la contraseña por accidente
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.__v;
            return ret;
        }
    }
});

export default model('User', userSchema);