'use strict';

var express = require('express');

var router = express.Router();

router.get('/', require('./balances.controller.js').index);

module.exports = router;