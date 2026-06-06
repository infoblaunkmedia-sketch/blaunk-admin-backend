const Order = require('../models/Order');
const { ORDER_STATUSES, PAYMENT_STATUSES } = require('../models/Order');

function clean(v) { return String(v == null ? '' : v).trim(); }
const { formatDateDDMMYYYY } = require('../utils/dateFormat');

function formatDate(d) {
  return formatDateDDMMYYYY(d);
}

function toDto(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    orderNumber: doc.orderNumber,
    buyerId: doc.buyerId ? String(doc.buyerId) : '',
    sellerId: doc.sellerId ? String(doc.sellerId) : '',
    productId: doc.productId ? String(doc.productId) : '',
    buyerName: doc.buyerName || '',
    sellerName: doc.sellerName || '',
    productTitle: doc.productTitle || '',
    qty: doc.qty,
    amount: doc.amount,
    gstAmount: doc.gstAmount,
    paymentStatus: doc.paymentStatus,
    orderStatus: doc.orderStatus,
    trackingNo: doc.trackingNo || '',
    createdAt: doc.createdAt,
    orderDate: formatDate(doc.createdAt),
  };
}

async function nextOrderNumber() {
  const count = await Order.countDocuments();
  return `ORD${String(count + 1).padStart(6, '0')}`;
}

async function listOrders({ orderStatus, sellerId, fromDate, toDate, q, page = 1, limit = 30 } = {}) {
  const query = {};
  if (orderStatus && ORDER_STATUSES.includes(orderStatus)) query.orderStatus = orderStatus;
  if (sellerId) query.sellerId = sellerId;
  const needle = clean(q);
  if (needle) {
    const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ orderNumber: re }, { buyerName: re }, { sellerName: re }, { productTitle: re }];
  }
  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) query.createdAt.$gte = new Date(fromDate);
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }
  const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 30, 1), 100);
  const safePage = Math.max(parseInt(String(page), 10) || 1, 1);
  const skip = (safePage - 1) * safeLimit;
  const [rows, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    Order.countDocuments(query),
  ]);
  return {
    records: rows.map(toDto),
    pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.max(1, Math.ceil(total / safeLimit)) },
  };
}

async function getOrderById(id) {
  const doc = await Order.findById(id).lean();
  return toDto(doc);
}

async function updateOrderStatus(id, { orderStatus, trackingNo, paymentStatus } = {}) {
  const updates = {};
  if (orderStatus) {
    if (!ORDER_STATUSES.includes(orderStatus)) throw new Error('Invalid orderStatus');
    updates.orderStatus = orderStatus;
  }
  if (paymentStatus) {
    if (!PAYMENT_STATUSES.includes(paymentStatus)) throw new Error('Invalid paymentStatus');
    updates.paymentStatus = paymentStatus;
  }
  if (trackingNo !== undefined) updates.trackingNo = clean(trackingNo);
  const doc = await Order.findByIdAndUpdate(id, { $set: updates }, { returnDocument: 'after' }).lean();
  return toDto(doc);
}

async function ensureSeedOrders() {
  if (await Order.countDocuments()) return { seeded: 0 };
  const IndividualCustomer = require('../models/IndividualCustomer');
  const Seller = require('../models/Seller');
  const Product = require('../models/Product');
  const buyer = await IndividualCustomer.findOne().lean();
  const seller = await Seller.findOne().lean();
  const product = await Product.findOne().lean();
  if (!buyer || !seller) return { seeded: 0 };
  await Order.insertMany([
    {
      orderNumber: 'ORD000001',
      buyerId: buyer._id,
      sellerId: seller._id,
      productId: product?._id,
      buyerName: buyer.fullName,
      sellerName: seller.businessName,
      productTitle: product?.title || 'Product',
      qty: 2,
      amount: 1500,
      gstAmount: 270,
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
    },
    {
      orderNumber: 'ORD000002',
      buyerId: buyer._id,
      sellerId: seller._id,
      productId: product?._id,
      buyerName: buyer.fullName,
      sellerName: seller.businessName,
      productTitle: product?.title || 'Product',
      qty: 1,
      amount: 45000,
      gstAmount: 8100,
      paymentStatus: 'pending',
      orderStatus: 'placed',
    },
  ]);
  return { seeded: 2 };
}

module.exports = { listOrders, getOrderById, updateOrderStatus, ensureSeedOrders };
