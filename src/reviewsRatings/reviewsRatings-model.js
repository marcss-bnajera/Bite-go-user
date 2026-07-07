import { Schema, model } from 'mongoose';

const reviewRatingSchema = new Schema({
    id_usuario: {
        type: String,
        required: [true, 'El usuario es obligatorio']
    },
    id_restaurante: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: [true, 'El restaurante es obligatorio']
    },
    id_pedido: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    },
    id_reservacion: {
        type: Schema.Types.ObjectId,
        ref: 'Reservation',
        default: null
    },
    id_sucursal: {
        type: String,
        default: ''
    },
    calificacion: {
        type: Number,
        required: [true, 'La calificación es obligatoria'],
        min: [1, 'La calificación mínima es 1'],
        max: [5, 'La calificación máxima es 5']
    },
    comentario: {
        type: String,
        trim: true,
        maxlength: [500, 'El comentario no puede superar los 500 caracteres'],
        default: ''
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});

reviewRatingSchema.index(
    { id_usuario: 1, id_pedido: 1 },
    { unique: true, partialFilterExpression: { id_pedido: { $type: 'objectId' } } }
);

reviewRatingSchema.index(
    { id_usuario: 1, id_reservacion: 1 },
    { unique: true, partialFilterExpression: { id_reservacion: { $type: 'objectId' } } }
);

export default model('ReviewRating', reviewRatingSchema);
