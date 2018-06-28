var express = require('express');
var router = express.Router();

// router.get('/index', function(req, res, next) {

// });

router.get('/generateToken', function(req, res, next) {
    var reqAmount = req.query.amount;
});

module.exports = router;