const IndividualCustomer = require('../models/IndividualCustomer');
const Seller = require('../models/Seller');
const Order = require('../models/Order');
const Product = require('../models/Product');
const DsaPayout = require('../models/DsaPayout');
const Referral = require('../models/Referral');

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseRange(range) {
  const r = String(range || '30d').toLowerCase();
  const m = r.match(/^(\d+)d$/);
  const days = m ? Math.min(parseInt(m[1], 10), 90) : 30;
  return { days, from: daysAgo(days) };
}

async function getSummary() {
  const [
    totalUsers,
    sellersByStatus,
    totalOrders,
    revenueAgg,
    payoutAgg,
    pendingProducts,
    pendingSellers,
  ] = await Promise.all([
    IndividualCustomer.countDocuments(),
    Seller.aggregate([{ $group: { _id: '$approvalStatus', count: { $sum: 1 } } }]),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' }, totalGst: { $sum: '$gstAmount' } } },
    ]),
    DsaPayout.aggregate([
      { $group: { _id: null, total: { $sum: '$submittedAmount' }, pending: { $sum: { $cond: [{ $in: ['$status', ['PENDING', 'PENDING_APPROVAL', 'PENDING_LEGACY']] }, '$submittedAmount', 0] } } } },
    ]),
    Product.countDocuments({ status: 'pending' }),
    Seller.countDocuments({ approvalStatus: 'pending' }),
  ]);

  const sellers = { pending: 0, approved: 0, rejected: 0, total: 0 };
  sellersByStatus.forEach((s) => {
    const k = s._id || 'pending';
    sellers[k] = s.count;
    sellers.total += s.count;
  });

  const rev = revenueAgg[0] || { totalRevenue: 0, totalGst: 0 };
  const pay = payoutAgg[0] || { total: 0, pending: 0 };
  const referralCommission = await Referral.aggregate([
    { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
  ]);

  return {
    totalUsers,
    totalSellers: sellers,
    totalOrders,
    totalRevenue: rev.totalRevenue,
    totalGst: rev.totalGst,
    dsaPayoutTotal: pay.total,
    dsaPayoutPending: pay.pending,
    referralCommissionTotal: referralCommission[0]?.total || 0,
    pendingProductApprovals: pendingProducts,
    pendingSellerApprovals: pendingSellers,
  };
}

async function getCharts(range = '30d') {
  const { from } = parseRange(range);

  const [usersByDay, ordersByDay] = await Promise.all([
    IndividualCustomer.aggregate([
      { $match: { createdAt: { $gte: from } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: from } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    range,
    newUsersByDay: usersByDay.map((r) => ({ date: r._id, count: r.count })),
    ordersByDay: ordersByDay.map((r) => ({ date: r._id, orders: r.orders, revenue: r.revenue })),
  };
}

module.exports = { getSummary, getCharts };
