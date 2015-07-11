'use strict';

var express = require('express');

var router = express.Router();

router.get('/:assetId', require('./get.controller.js').index);

module.exports = router;