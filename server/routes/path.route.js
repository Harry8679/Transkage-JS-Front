const express = require('express');
const { createPath, getAllPaths } = require('../controllers/path.controller');

const router = express.Router();

router.post('/paths', createPath);
router.get('/paths', getAllPaths);

module.exports = router;