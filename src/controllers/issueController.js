const issueService = require('../services/issueService');

async function listIssuesController(req, res) {
  try {
    const records = await issueService.listIssues(req.query || {});
    return res.json({ records });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to list issues.' });
  }
}

async function getIssueController(req, res) {
  try {
    const record = await issueService.getIssueById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Issue not found.' });
    return res.json({ record });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load issue.' });
  }
}

async function saveIssueController(req, res) {
  try {
    const record = await issueService.saveIssue(req.body || {});
    return res.status(200).json({ record });
  } catch (error) {
    const msg = String(error?.message || '');
    const status = msg.toLowerCase().includes('required') || msg.includes('not found') ? 400 : 500;
    return res.status(status).json({ message: msg || 'Failed to save issue.' });
  }
}

async function patchIssueController(req, res) {
  try {
    const record = await issueService.patchIssueStatus(req.params.id, req.body?.status);
    if (!record) return res.status(404).json({ message: 'Issue not found.' });
    return res.json({ record });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to update issue.' });
  }
}

async function deleteIssueController(req, res) {
  try {
    const deleted = await issueService.deleteIssueById(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Issue not found.' });
    return res.json({ deleted: true });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete issue.' });
  }
}

module.exports = {
  listIssuesController,
  getIssueController,
  saveIssueController,
  patchIssueController,
  deleteIssueController,
};
