const contestQuizService = require('../services/contestQuizService');

async function getPublicContestQuizController(req, res) {
  try {
    const quiz = await contestQuizService.getPublicQuiz();
    return res.json({ quiz });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getPublicContestQuiz error:', err);
    return res.status(500).json({ message: 'Failed to load contest.' });
  }
}

async function getAdminContestQuizController(req, res) {
  try {
    const quiz = await contestQuizService.getAdminQuiz();
    return res.json({ quiz });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load contest settings.' });
  }
}

async function upsertContestQuizController(req, res) {
  try {
    const quiz = await contestQuizService.upsertQuiz(req.body || {});
    return res.json({ quiz });
  } catch (err) {
    const msg = String(err?.message || 'Failed to save contest.');
    const status = msg.toLowerCase().includes('required') || msg.includes('invalid') ? 400 : 500;
    return res.status(status).json({ message: msg });
  }
}

async function deleteContestQuizController(req, res) {
  try {
    const quiz = await contestQuizService.deleteQuiz();
    return res.json({ quiz });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete contest question.' });
  }
}

async function listContestSubmissionsController(req, res) {
  try {
    const data = await contestQuizService.listSubmissions();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load submissions.' });
  }
}

async function submitContestAnswerController(req, res) {
  try {
    await contestQuizService.submitAnswer(req.body || {}, req.user);
    return res.json({ ok: true });
  } catch (err) {
    const msg = String(err?.message || 'Failed to submit answer.');
    const status =
      msg.includes('already submitted') ||
      msg.includes('no longer') ||
      msg.includes('log in') ||
      msg.includes('customer account') ||
      msg.includes('session') ||
      msg.includes('email on file') ||
      msg.includes('select') ||
      msg.includes('available')
        ? 400
        : 500;
    return res.status(status).json({ message: msg });
  }
}

module.exports = {
  getPublicContestQuizController,
  getAdminContestQuizController,
  upsertContestQuizController,
  deleteContestQuizController,
  listContestSubmissionsController,
  submitContestAnswerController,
};
