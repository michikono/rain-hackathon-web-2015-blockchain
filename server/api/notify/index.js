'use strict';

var express = require('express');

var router = express.Router();

router.post('/', require('./notify.controller.js').index);

module.exports = router;