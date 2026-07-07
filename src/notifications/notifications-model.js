import { Schema, model } from 'mongoose';

const notificationSchema = new Schema({
    id_usuario: {
        type: String,
        required: true
    },
    titulo: {
        type: String,
        required: true,
        trim: true
    },
    mensaje: {
        type: String,
        required: true,
        trim: true
    },
    tipo: {
        type: String,
        required: true,
        enum: ['pedido', 'reservacion', 'sistema', 'promocion']
    },
    id_pedido: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    },
    leido: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { transform: function (doc, ret) { delete ret.__v; return ret; } }
});

notificationSchema.index({ id_usuario: 1, leido: 1 });
notificationSchema.index({ id_usuario: 1, createdAt: -1 });

export default model('Notification', notificationSchema);
