const DsaSlider = require('../models/DsaSlider');
const ThirdPartyCredential = require('../models/ThirdPartyCredential');
const Dsa = require('../models/Dsa');
const EmployeeCredentials = require('../models/EmployeeCredentials');
const DsaPayout = require('../models/DsaPayout');
const Issue = require('../models/Issue');
const Review = require('../models/Review');
const Verifier = require('../models/Verifier');
const Seller = require('../models/Seller');
const ShareholdingHistory = require('../models/ShareholdingHistory');
const Shareholder = require('../models/Shareholder');
const AllowedIp = require('../models/AllowedIp');
const IpAddressConfig = require('../models/IpAddressConfig');
const MacAddressConfig = require('../models/MacAddressConfig');
const Vacancy = require('../models/Vacancy');
const activityLogService = require('./activityLogService');
const payslipReportService = require('./payslipReportService');

const SALES_UPLOAD_REPORT_TYPES = new Set([
  'MIS-Subscription',
  'MIS-Lead Tour',
  'MIS-Lead Cake',
  'MIS-Lead Store',
  'MIS-Product Listing',
  'MIS-Email Subscription',
]);

const SECTION_BY_REPORT = {
  'MIS-Lead Tour': 'TOUR',
  'MIS-Lead Cake': 'CAKE',
  'MIS-Lead Store': 'STORE',
};

function cleanString(v) {
  return String(v == null ? '' : v).trim();
}

function uploadSourceLabel(source) {
  if (source === 'vendor_direct') return 'Vendor Direct';
  if (source === 'admin_3p') return 'Admin 3P DSA';
  return '';
}

function parseDateRange(fromDate, toDate) {
  const from = fromDate ? new Date(fromDate) : null;
  const to = toDate ? new Date(toDate) : null;
  if (!from || Number.isNaN(from.getTime()) || !to || Number.isNaN(to.getTime())) {
    throw new Error('Valid fromDate and toDate are required.');
  }
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

function createdAtRange(fromDate, toDate) {
  const { from, to } = parseDateRange(fromDate, toDate);
  return { createdAt: { $gte: from, $lte: to } };
}

async function buildDsaNameLookup(codes) {
  const unique = [...new Set(codes.map((c) => cleanString(c).toUpperCase()).filter(Boolean))];
  if (!unique.length) return {};

  const [creds, dsas] = await Promise.all([
    ThirdPartyCredential.find({ threePEmplCode: { $in: unique } })
      .select('threePEmplCode name')
      .lean(),
    Dsa.find({ dsaCode: { $in: unique } })
      .select('dsaCode name companyName')
      .lean(),
  ]);

  const map = {};
  (dsas || []).forEach((d) => {
    const code = cleanString(d.dsaCode).toUpperCase();
    if (code) map[code] = cleanString(d.name) || cleanString(d.companyName);
  });
  (creds || []).forEach((c) => {
    const code = cleanString(c.threePEmplCode).toUpperCase();
    if (code) map[code] = cleanString(c.name) || map[code] || '';
  });
  return map;
}

function isSalesUploadReport(reportType) {
  return SALES_UPLOAD_REPORT_TYPES.has(cleanString(reportType));
}

async function exportSalesMisRows({
  reportType,
  fromDate,
  toDate,
  uploadSource = 'all',
  q,
} = {}) {
  const { from, to } = parseDateRange(fromDate, toDate);

  const query = {
    uploadDate: { $gte: from, $lte: to },
  };

  const section = SECTION_BY_REPORT[reportType];
  if (section) query.section = section;

  const source = cleanString(uploadSource).toLowerCase();
  if (source === 'vendor_direct' || source === 'admin_3p') {
    query.uploadSource = source;
  }

  const needle = cleanString(q);
  if (needle) {
    const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ dsaCode: re }, { productId: re }, { plan: re }, { country: re }, { category: re }];
  }

  const sliders = await DsaSlider.find(query).sort({ uploadDate: -1 }).lean();
  const nameCodes = sliders.flatMap((s) => [s.uploadedByDsaCode, s.dsaCode]);
  const nameByCode = await buildDsaNameLookup(nameCodes);

  return sliders.map((s) => {
    const empCode =
      s.uploadSource === 'admin_3p'
        ? cleanString(s.uploadedByDsaCode || s.dsaCode).toUpperCase()
        : '';
    const dsaName = empCode ? nameByCode[empCode] || '' : '';

    return {
      id: String(s._id),
      name: s.plan || s.mediaTab || '',
      date: s.uploadDate ? new Date(s.uploadDate).toISOString().slice(0, 10) : '',
      status: s.status || '',
      mediaTab: s.mediaTab || '',
      section: s.section || '',
      country: s.country || '',
      category: s.category || '',
      plan: s.plan || '',
      productId: s.productId || '',
      dsaCode: s.dsaCode || '',
      amount: Number(s.toPay || 0).toFixed(2),
      uploadSourceLabel: uploadSourceLabel(s.uploadSource),
      dsaEmpCode: empCode,
      dsaName,
    };
  });
}

async function exportEmployeeList({ fromDate, toDate, q }) {
  const range = createdAtRange(fromDate, toDate);
  const query = { ...range };
  const needle = cleanString(q);
  if (needle) {
    const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ empCode: re }, { employeeName: re }, { department: re }];
  }
  const rows = await EmployeeCredentials.find(query).sort({ empCode: 1 }).lean();
  return rows.map((e) => ({
    empCode: e.empCode || '',
    fullName: e.employeeName || '',
    department: e.department || '',
    designation: e.designation || '',
    doj: e.doj || '',
    status: e.status || '',
  }));
}

async function exportSalaryRegister({ q }) {
  const query = {};
  const needle = cleanString(q);
  if (needle) {
    const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ empCode: re }, { employeeName: re }];
  }
  const rows = await EmployeeCredentials.find(query).sort({ empCode: 1 }).lean();
  return rows.map((e) => ({
    empCode: e.empCode || '',
    fullName: e.employeeName || '',
    basic: e.basicSalary || '',
    hra: e.hra || '',
    ctc: e.ctcMonthly || '',
    perDay: e.ctcPerDay || '',
  }));
}

async function exportVacancyReport({ fromDate, toDate, q }) {
  const range = createdAtRange(fromDate, toDate);
  const query = { ...range };
  const needle = cleanString(q);
  if (needle) {
    const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ jobTitle: re }, { department: re }];
  }
  const rows = await Vacancy.find(query).sort({ postedDate: -1 }).lean();
  return rows.map((v) => ({
    title: v.jobTitle || '',
    department: v.department || '',
    openings: v.numberOfOpenings ?? 0,
    postedDate: v.postedDate || '',
    status: v.status || '',
  }));
}

async function exportB2bLedger({ fromDate, toDate, q }) {
  const range = createdAtRange(fromDate, toDate);
  const query = { ...range };
  const needle = cleanString(q);
  if (needle) {
    const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ dsaCode: re }, { transactionNumber: re }, { dsaName: re }];
  }
  const rows = await DsaPayout.find(query).sort({ createdAt: -1 }).lean();
  return rows.map((p) => ({
    orderId: p.transactionNumber || String(p._id),
    payinAmount: Number(p.submittedAmount || 0).toFixed(2),
    netPayout: Number(p.currencyInr || p.submittedAmount || 0).toFixed(2),
    transferStatus: p.status || '',
    date: p.submissionDate || (p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : ''),
    dsaCode: p.dsaCode || '',
    dsaName: p.dsaName || '',
    country: p.country || '',
    mode: p.mode || '',
    sharePct: p.shareRatio ?? '',
    approvalDate: p.approvedAt ? new Date(p.approvedAt).toISOString().slice(0, 10) : '',
  }));
}

async function exportOutstandingPayments({ q }) {
  const pending = ['PENDING', 'PENDING_APPROVAL', 'ON_HOLD'];
  const query = { status: { $in: pending } };
  const needle = cleanString(q);
  if (needle) {
    const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ dsaCode: re }, { transactionNumber: re }];
  }
  const rows = await DsaPayout.find(query).sort({ createdAt: -1 }).lean();
  return rows.map((p) => ({
    orderId: p.transactionNumber || String(p._id),
    amountDue: Number(p.submittedAmount || 0).toFixed(2),
    dueDate: p.submissionDate || '',
    status: p.status || '',
  }));
}

async function exportDsaPerformance({ fromDate, toDate }) {
  const range = createdAtRange(fromDate, toDate);
  const rows = await DsaPayout.find(range).lean();
  const byCode = {};
  rows.forEach((p) => {
    const code = cleanString(p.dsaCode).toUpperCase() || 'UNKNOWN';
    if (!byCode[code]) {
      byCode[code] = {
        dsaCode: code,
        dsaName: p.dsaName || '',
        totalTx: 0,
        totalVolume: 0,
        approved: 0,
        rejected: 0,
      };
    }
    byCode[code].totalTx += 1;
    byCode[code].totalVolume += Number(p.currencyInr || p.submittedAmount || 0);
    if (p.status === 'APPROVED') byCode[code].approved += 1;
    if (p.status === 'REJECTED') byCode[code].rejected += 1;
  });
  return Object.values(byCode).map((g) => ({
    dsaCode: g.dsaCode,
    dsaName: g.dsaName,
    totalTx: g.totalTx,
    totalVolume: g.totalVolume.toFixed(2),
    approvedCount: g.approved,
    rejectedCount: g.rejected,
  }));
}

async function exportDsaPaymentHistory({ fromDate, toDate, q }) {
  const range = createdAtRange(fromDate, toDate);
  const query = { ...range };
  const needle = cleanString(q);
  if (needle) {
    const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.dsaCode = re;
  }
  const rows = await DsaPayout.find(query).sort({ createdAt: -1 }).lean();
  return rows.map((p) => ({
    dsaCode: p.dsaCode || '',
    amount: Number(p.submittedAmount || 0).toFixed(2),
    currency: p.currency || 'INR',
    status: p.status || '',
    date: p.submissionDate || (p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : ''),
  }));
}

async function exportDsaLimitUsage({ q }) {
  const query = {};
  const needle = cleanString(q);
  if (needle) {
    query.dsaCode = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }
  const rows = await DsaPayout.find(query).sort({ updatedAt: -1 }).limit(500).lean();
  const latest = {};
  rows.forEach((p) => {
    const code = cleanString(p.dsaCode).toUpperCase();
    if (!code || latest[code]) return;
    latest[code] = p;
  });
  return Object.values(latest).map((p) => ({
    dsaCode: p.dsaCode || '',
    available: Number(p.availableBalance || 0).toFixed(2),
    used: Number(p.usedValue || 0).toFixed(2),
    bod: Number(p.bodBalance || 0).toFixed(2),
  }));
}

async function exportAdminActivity({ fromDate, toDate, q }) {
  const rows = await activityLogService.listActivityLogs({ fromDate, toDate, q });
  return rows.map((l) => ({
    date: l.timestamp ? new Date(l.timestamp).toISOString().slice(0, 10) : '',
    action: l.action || '',
    performedBy: l.performedBy || '',
    role: l.role || '',
    module: l.module || '',
  }));
}

async function exportIssueReport({ fromDate, toDate, q }) {
  const range = createdAtRange(fromDate, toDate);
  const query = { ...range };
  const needle = cleanString(q);
  if (needle) {
    const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ rnNumber: re }, { customerName: re }, { issueType: re }];
  }
  const rows = await Issue.find(query).sort({ createdAt: -1 }).lean();
  return rows.map((i) => ({
    rnNumber: i.rnNumber || '',
    customerName: i.customerName || '',
    issueType: i.issueType || '',
    status: i.status || '',
    raisedDate: i.raisedDate || (i.createdAt ? new Date(i.createdAt).toISOString().slice(0, 10) : ''),
    customerId: i.customerId || '',
    email: i.email || '',
    resolvedDate: i.resolvedAt ? new Date(i.resolvedAt).toISOString().slice(0, 10) : '',
  }));
}

async function exportReviewSummary({ fromDate, toDate, q }) {
  const range = createdAtRange(fromDate, toDate);
  const query = { ...range };
  const needle = cleanString(q);
  if (needle) {
    const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ reviewerName: re }, { product: re }];
  }
  const rows = await Review.find(query).sort({ createdAt: -1 }).lean();
  return rows.map((r) => ({
    reviewerName: r.reviewerName || '',
    product: r.product || '',
    rating: r.rating ?? '',
    status: r.status || '',
    date: r.reviewDate || (r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : ''),
    reviewText: r.reviewText || '',
    vendorId: r.vendorId || '',
  }));
}

async function exportVerifierActivity({ fromDate, toDate }) {
  const range = createdAtRange(fromDate, toDate);
  const rows = await Verifier.find(range).sort({ updatedAt: -1 }).lean();
  const vendorIds = rows.map((v) => v.vendorId).filter(Boolean);
  const sellers = await Seller.find({ _id: { $in: vendorIds } })
    .select('companyName businessName vendorCode')
    .lean();
  const sellerMap = {};
  sellers.forEach((s) => {
    sellerMap[String(s._id)] = s.businessName || s.vendorCode || '';
  });
  return rows.map((v) => ({
    date: v.updatedAt ? new Date(v.updatedAt).toISOString().slice(0, 10) : '',
    vendorId: String(v.vendorId || ''),
    companyName: sellerMap[String(v.vendorId)] || '',
    emailStatus: v.emailStatus || '',
    mobileStatus: v.mobileStatus || '',
    photoStatus: v.photoStatus || '',
    bankStatus: v.bankStatus || '',
    shopStatus: v.shopLocationStatus || '',
    overallStatus: v.overallStatus || '',
    submittedBy: v.submittedBy || '',
    reviewedBy: v.reviewedBy || '',
  }));
}

async function exportKycStatus({ fromDate, toDate }) {
  return exportVerifierActivity({ fromDate, toDate });
}

async function exportShareholdingRegister({ q }) {
  const query = {};
  const needle = cleanString(q);
  if (needle) {
    const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const sh = await Shareholder.find({
      $or: [{ name: re }, { pan: re }, { mobile: re }],
    })
      .select('_id')
      .lean();
    const ids = sh.map((s) => s._id);
    if (ids.length) query.shareholder = { $in: ids };
    else return [];
  }
  const histories = await ShareholdingHistory.find(query)
    .populate('shareholder')
    .sort({ updatedAt: -1 })
    .limit(5000)
    .lean();

  return histories.map((h) => {
    const s = h.shareholder || {};
    return {
      name: s.name || '',
      beneficiaryDpId: h.beneficiaryDpId || h.dpNumber || '',
      folioNumber: h.folioNumber || '',
      pan: h.pan || s.pan || '',
      shareType: h.shareType || '',
      numberOfShares: h.numberOfShares ?? '',
      holdingPercent: h.holdingPercent ?? '',
      mobile: s.mobile || '',
      aadhaar: s.aadhaar || '',
      address: s.address || '',
      mode: h.mode || '',
      isinCode: h.isinCode || '',
      pledge: h.pledge || '',
      remarks: h.remarks || '',
    };
  });
}

async function exportSecurityLog() {
  const [ips, ipCfg, macCfg] = await Promise.all([
    AllowedIp.find({}).sort({ updatedAt: -1 }).lean(),
    IpAddressConfig.find({}).sort({ updatedAt: -1 }).lean(),
    MacAddressConfig.find({}).sort({ updatedAt: -1 }).lean(),
  ]);
  const rows = [];
  (ips || []).forEach((r) => {
    rows.push({
      type: 'Allowed IP',
      value: r.ipAddress || '',
      addedBy: r.addedBy || '',
      addedDate: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : '',
      status: r.active ? 'Active' : 'Inactive',
    });
  });
  (ipCfg || []).forEach((r) => {
    rows.push({
      type: 'IP Config',
      value: r.ipAddress || r.serviceProvider || '',
      addedBy: '',
      addedDate: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : '',
      status: 'Active',
    });
  });
  (macCfg || []).forEach((r) => {
    rows.push({
      type: 'MAC Config',
      value: r.macAddress || r.serviceProvider || '',
      addedBy: '',
      addedDate: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : '',
      status: 'Active',
    });
  });
  return rows;
}

async function exportIpAccessLog() {
  return exportSecurityLog();
}

async function exportMonthlyPayslipSummary(opts) {
  return payslipReportService.exportPayslipSummaryRows('monthly-payslip', opts);
}

async function exportYearlyPayslipSummary(opts) {
  return payslipReportService.exportPayslipSummaryRows('yearly-payslip', opts);
}

async function exportEmployeeCostSummary(opts) {
  const rows = await payslipReportService.exportPayslipSummaryRows('employee-ctc', opts);
  return rows.map((r) => ({
    empCode: r.empCode,
    fullName: r.fullName,
    department: r.department,
    annualCost: r.annualCost,
    grossEarnings: r.grossEarnings,
  }));
}

async function exportThirdPartyRoster({ fromDate, toDate, q }) {
  const query = {};
  if (fromDate && toDate) {
    try {
      Object.assign(query, createdAtRange(fromDate, toDate));
    } catch {
      // roster can export without strict range
    }
  }
  const needle = cleanString(q);
  if (needle) {
    const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { name: re },
      { threePEmplCode: re },
      { threePCompanyName: re },
      { department: re },
    ];
  }
  const rows = await ThirdPartyCredential.find(query).sort({ threePEmplCode: 1 }).lean();
  return rows.map((c) => ({
    empCode: c.threePEmplCode || '',
    name: c.name || '',
    department: c.department || '',
    company: c.threePCompanyName || '',
    mobile: c.mobileNo || '',
    email: c.email || '',
    status: c.status || '',
    country: c.country || '',
    updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString().slice(0, 10) : '',
  }));
}

async function exportDsaAdActivity(opts) {
  return exportSalesMisRows({ ...opts, reportType: 'MIS-Subscription' });
}

async function exportVendorStatusSummary({ fromDate, toDate, q }) {
  const range = createdAtRange(fromDate, toDate);
  const query = { ...range };
  const needle = cleanString(q);
  if (needle) {
    const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ businessName: re }, { vendorCode: re }, { email: re }];
  }
  const rows = await Seller.find(query).sort({ updatedAt: -1 }).lean();
  return rows.map((s) => ({
    vendorCode: s.vendorCode || '',
    businessName: s.businessName || '',
    email: s.email || '',
    mobile: s.mobile || '',
    status: s.status || '',
    approvalStatus: s.approvalStatus || '',
    kycStatus: s.kycStatus || '',
    country: s.country || '',
    registeredDate: s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : '',
    lastUpdated: s.updatedAt ? new Date(s.updatedAt).toISOString().slice(0, 10) : '',
  }));
}

const REPORT_EXPORTERS = {
  'Employee List': exportEmployeeList,
  'Salary Register': exportSalaryRegister,
  'Vacancy Report': exportVacancyReport,
  '3P DSA Employee Roster': exportThirdPartyRoster,
  'Monthly Payroll Summary': exportMonthlyPayslipSummary,
  'Yearly Payroll Summary': exportYearlyPayslipSummary,
  'Monthly Payslip Summary': exportMonthlyPayslipSummary,
  'Yearly Payslip Summary': exportYearlyPayslipSummary,
  'Employee Cost Summary': exportEmployeeCostSummary,
  'B2B Payment Ledger': exportB2bLedger,
  'Outstanding Payments': exportOutstandingPayments,
  'DSA Performance': exportDsaPerformance,
  'DSA Payment History': exportDsaPaymentHistory,
  'DSA Limit Usage': exportDsaLimitUsage,
  'DSA Ad Activity': exportDsaAdActivity,
  'Admin Activity Log': exportAdminActivity,
  'Issue Report': exportIssueReport,
  'Review Summary': exportReviewSummary,
  'Vendor Status Summary': exportVendorStatusSummary,
  'Verifier Activity': exportVerifierActivity,
  'KYC Status Summary': exportKycStatus,
  'Shareholding Register': exportShareholdingRegister,
  'Security Log': exportSecurityLog,
  'IP Access Log': exportIpAccessLog,
};

async function exportMisRows({ department, reportType, fromDate, toDate, uploadSource, q } = {}) {
  const type = cleanString(reportType);
  if (isSalesUploadReport(type)) {
    return exportSalesMisRows({ reportType: type, fromDate, toDate, uploadSource, q });
  }
  const handler = REPORT_EXPORTERS[type];
  if (!handler) return [];
  return handler({ department, reportType: type, fromDate, toDate, uploadSource, q });
}

module.exports = {
  SALES_UPLOAD_REPORT_TYPES,
  isSalesUploadReport,
  exportSalesMisRows,
  exportMisRows,
};
