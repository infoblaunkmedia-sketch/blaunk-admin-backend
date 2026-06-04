const ContestQuiz = require('../models/ContestQuiz');
const ContestSubmission = require('../models/ContestSubmission');
const User = require('../models/User');

const DEFAULT_KEY = 'win-contest';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function cleanString(v) {
  return String(v == null ? '' : v).trim();
}

function normalizeOptions(options) {
  const list = (Array.isArray(options) ? options : [])
    .map((o) => cleanString(o))
    .slice(0, 4);
  while (list.length < 4) list.push('');
  if (list.some((o) => !o)) throw new Error('All four answer options are required.');
  return list;
}

/** End of selected calendar day (local server timezone). */
function parseValidUntilEndOfDay(value) {
  const raw = String(value || '').slice(0, 10);
  const parts = raw.split('-').map((n) => Number(n));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    throw new Error('Valid until date is invalid.');
  }
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day, 23, 59, 59, 999);
  if (Number.isNaN(d.getTime())) throw new Error('Valid until date is invalid.');
  return d;
}

function formatDeadlineMessage(validUntil) {
  if (!validUntil) return '';
  const d = new Date(validUntil);
  if (Number.isNaN(d.getTime())) return '';
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  const currentYear = new Date().getFullYear();
  const yearSuffix = year !== currentYear ? ` ${year}` : '';
  return `Valid till ${day} ${month}${yearSuffix}`;
}

function toPublicPayload(doc) {
  if (!doc) return null;
  const validUntil = doc.validUntil ? new Date(doc.validUntil) : null;
  const isOpen = validUntil && validUntil.getTime() >= Date.now();
  return {
    question: doc.question,
    options: doc.options || [],
    deadlineMessage: formatDeadlineMessage(validUntil),
    validUntil: validUntil ? validUntil.toISOString() : null,
    isOpen: Boolean(isOpen),
  };
}

async function getQuizDoc() {
  return ContestQuiz.findOne({ key: DEFAULT_KEY }).lean();
}

async function getPublicQuiz() {
  return toPublicPayload(await getQuizDoc());
}

async function getAdminQuiz() {
  const doc = await getQuizDoc();
  if (!doc) {
    return { exists: false };
  }
  const validUntil = doc.validUntil ? new Date(doc.validUntil) : null;
  const validUntilDate = validUntil ? validUntil.toISOString().slice(0, 10) : '';
  return {
    exists: true,
    key: doc.key,
    question: doc.question,
    options: doc.options,
    validUntil: validUntilDate,
    deadlinePreview: formatDeadlineMessage(validUntil),
  };
}

async function upsertQuiz(payload) {
  const question = cleanString(payload?.question);
  if (!question) throw new Error('Question is required.');
  const options = normalizeOptions(payload?.options);
  const validUntil = parseValidUntilEndOfDay(payload?.validUntil);

  await ContestQuiz.findOneAndUpdate(
    { key: DEFAULT_KEY },
    {
      $set: {
        key: DEFAULT_KEY,
        question,
        options,
        validUntil,
        isActive: true,
      },
    },
    { upsert: true, returnDocument: 'after', runValidators: true },
  );

  return getAdminQuiz();
}

async function deleteQuiz() {
  await ContestQuiz.deleteOne({ key: DEFAULT_KEY });
  await ContestSubmission.deleteMany({ quizKey: DEFAULT_KEY });
  return { exists: false };
}

async function listSubmissions() {
  const doc = await getQuizDoc();
  if (!doc) {
    return { records: [], total: 0 };
  }
  const records = await ContestSubmission.find({ quizKey: DEFAULT_KEY })
    .sort({ createdAt: -1 })
    .lean();
  return {
    total: records.length,
    records: records.map((r) => ({
      id: String(r._id),
      participantName: r.participantName,
      participantEmail: r.participantEmail,
      username: r.username || '',
      answerText: r.answerText,
      optionIndex: r.optionIndex,
      submittedAt: r.createdAt,
    })),
  };
}

function isValidEmail(value) {
  return Boolean(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function submitAnswer(payload, authUser) {
  const doc = await getQuizDoc();
  if (!doc) throw new Error('No contest question is available.');
  const publicQuiz = toPublicPayload(doc);
  if (!publicQuiz.isOpen) throw new Error('This contest is no longer accepting answers.');

  if (!authUser?.id) {
    throw new Error('Please log in with your BLAUNK account to submit your answer.');
  }

  const optionIndex = Number(payload?.optionIndex);
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex > 3) {
    throw new Error('Please select a valid answer option.');
  }
  const answerText = doc.options[optionIndex];
  if (!answerText) throw new Error('Invalid answer option.');

  let participantName = '';
  let participantEmail = '';
  let userId = null;
  let username = cleanString(authUser.username);

  const role = String(authUser.role || '').toLowerCase();
  if (role === 'admin') {
    throw new Error('Contest entries must use a customer account. Please log out and sign in as a customer.');
  }

  const user = await User.findById(authUser.id).lean();
  if (!user) {
    throw new Error('Your session could not be verified. Please log out and sign in again.');
  }

  userId = user._id;
  username = user.username || username;
  participantEmail = cleanString(user.email).toLowerCase();
  participantName = user.username || user.email || username;

  if (!isValidEmail(participantEmail)) {
    throw new Error(
      'Your account does not have a valid email on file. Please contact customer support to update your profile.',
    );
  }

  try {
    await ContestSubmission.create({
      quizKey: DEFAULT_KEY,
      optionIndex,
      answerText,
      participantName,
      participantEmail,
      userId,
      username,
    });
  } catch (err) {
    if (err?.code === 11000) {
      throw new Error('You have already submitted an answer for this contest.');
    }
    throw err;
  }

  return { ok: true };
}

module.exports = {
  getPublicQuiz,
  getAdminQuiz,
  upsertQuiz,
  deleteQuiz,
  listSubmissions,
  submitAnswer,
  formatDeadlineMessage,
};
