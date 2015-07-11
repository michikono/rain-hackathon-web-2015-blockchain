'use strict';

var express = require('express');
var controller = require('./text.controller');

var router = express.Router();

router.get('/', controller.index);

module.exports = router;