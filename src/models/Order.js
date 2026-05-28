const mongoose = require('mongoose');

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
const ORDER_STATUSES = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'IndividualCustomer', default: null },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', default: null },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    qty: { type: Number, default: 1, min: 1 },
    amount: { type: Number, default: 0, min: 0 },
    gstAmount: { type: Number, default: 0, min: 0 },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: 'placed', index: true },
    trackingNo: { type: String, default: '', trim: true },
    buyerName: { type: String, default: '', trim: true },
    sellerName: { type: String, default: '', trim: true },
    productTitle: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
module.exports = Order;
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
module.exports.ORDER_STATUSES = ORDER_STATUSES;
