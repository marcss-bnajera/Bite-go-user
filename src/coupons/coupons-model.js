import { Schema, model } from 'mongoose';

const couponSchema = new Schema({
    codigo: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    tipo: {
        type: String,
        required: true,
        enum: ['porcentaje', 'monto_fijo']
    },
    valor: {
        type: Number,
        required: true,
        min: 0
    },
    monto_minimo: {
        type: Number,
        default: 0
    },
    usos_maximos: {
        type: Number,
        default: 1
    },
    usos_realizados: {
        type: Number,
        default: 0
    },
    fecha_expiracion: {
        type: Date,
        required: true
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { transform: function (doc, ret) { delete ret.__v; return ret; } }
});

export default model('Coupon', couponSchema);
