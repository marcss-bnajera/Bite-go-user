import Coupon from "./coupons-model.js";

/**
 * POST - Validar y aplicar cupón
 */
export const validateCoupon = async (req, res) => {
    try {
        const { codigo, monto_total } = req.body;
        const coupon = await Coupon.findOne({ codigo: codigo.toUpperCase(), activo: true });

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Cupón no encontrado o inactivo" });
        }

        if (new Date() > coupon.fecha_expiracion) {
            return res.status(400).json({ success: false, message: "El cupón ha expirado" });
        }

        if (coupon.usos_realizados >= coupon.usos_maximos) {
            return res.status(400).json({ success: false, message: "El cupón ha alcanzado su límite de usos" });
        }

        if (monto_total < coupon.monto_minimo) {
            return res.status(400).json({ success: false, message: `El monto mínimo para este cupón es Q${coupon.monto_minimo}` });
        }

        let descuento = 0;
        if (coupon.tipo === 'porcentaje') {
            descuento = (monto_total * coupon.valor) / 100;
        } else {
            descuento = Math.min(coupon.valor, monto_total);
        }

        res.status(200).json({
            success: true,
            descuento: Math.round(descuento * 100) / 100,
            tipo: coupon.tipo,
            valor: coupon.valor,
            message: `Cupón aplicado: ${coupon.tipo === 'porcentaje' ? coupon.valor + '%' : 'Q' + coupon.valor + ' de descuento'}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al validar cupón" });
    }
};

/**
 * POST - Registrar uso de cupón (llamar al crear pedido)
 */
export const useCoupon = async (codigo) => {
    try {
        await Coupon.findOneAndUpdate(
            { codigo: codigo.toUpperCase() },
            { $inc: { usos_realizados: 1 } }
        );
    } catch (error) {
        console.error("Error al registrar uso de cupón:", error.message);
    }
};
