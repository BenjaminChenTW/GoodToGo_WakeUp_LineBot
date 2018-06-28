var express = require('express');
var router = express.Router();
var crypto = require("crypto");
var redis = require("../models/DB/redis");

// router.get('/index', function(req, res, next) {

// });

router.post('/generateToken', function(req, res, next) {
    var reqAmount = req.body.amount;
    getUnrepeatedToken(reqAmount, function(success, reply) {
        if (!success) return res.end("伺服器錯誤");
        res.end(reply);
    });
});

function getUnrepeatedToken(amount, callback) {
    var newToken = crypto.randomBytes(48).toString('base64').replace(/\W/g, "").substr(0, 5).toUpperCase();
    redis.get('token:' + newToken, (err, reply) => {
        if (err) {
            return callback(false, err);
        } else if (reply !== null) {
            return getUnrepeatedToken(amount, callback);
        } else {
            redis.set('token:' + newToken, amount, (err, reply) => {
                if (err) return callback(false, err);
                if (reply !== 'OK') return callback(false, reply);
                else return callback(true, newToken);
            });
        }
    });
}

module.exports = router;