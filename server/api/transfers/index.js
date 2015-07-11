'use strict';

var express = require('express');

var router = express.Router();

router.post('/transfer', require('./transfers.controller.js').index);

module.exports = router;