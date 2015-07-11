'use strict';

var express = require('express');

var router = express.Router();

router.get('/:bucketId/balances', require('./balances/balances.controller.js').index);

module.exports = router;