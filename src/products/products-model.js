import { Schema, model } from 'mongoose';

const variacionDisponibleSchema = new Schema({
    nombre: { type: String, required: true },
    opciones: [String],
    es_extra: { type: Boolean, default: false },
    precio_adicional: { type: Number, default: 0 }
});

const productSchema = new Schema({
    id_restaurante: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    nombre: { type: String, required: true },
    descripcion: { type: String },
    categoria: {
        type: String,
        enum: ['Entradas', 'Platos', 'Bebidas', 'Postres', 'Otros']
    },
    precio: { type: Number, required: true },
    disponibilidad: { type: Boolean, default: true },
    foto_url: { type: [String], default: [] },
    variaciones_disponibles: [variacionDisponibleSchema],
    activo: { type: Boolean, default: true }
}, { timestamps: true });

export default model('Product', productSchema);