const express = require('express');
const {
  listThirdPartyCredentialsController,
  getThirdPartyCredentialController,
  saveThirdPartyCredentialController,
  deleteThirdPartyCredentialController,
} = require('../controllers/thirdPartyCredentialController');

const router = express.Router();

router.get('/', listThirdPartyCredentialsController);
router.post('/', saveThirdPartyCredentialController);
router.get('/:id', getThirdPartyCredentialController);
router.delete('/:id', deleteThirdPartyCredentialController);

module.exports = router;

