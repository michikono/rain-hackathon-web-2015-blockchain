'use strict';

var express = require('express');

var router = express.Router();

router.get('/:assetId/issue/:bucketId', require('./issue.controller.js').index);
router.get('/:assetId', require('./get.controller.js').index);

module.exports = router;