var express = require('express');
var router = express.Router();
var crypto = require("crypto");
var redis = require("../models/DB/redis");

var User = require("../models/DB/userDB");
var Ticket = require("../models/DB/ticketDB");
var Prize = require("../models/DB/prizeDB");

router.get('/index', function(req, res, next) {
    res.render('index', {});
});

router.get('/tickets', function(req, res, next) {
    User.count({}, (err, userAmount) => {
        if (err) return next(err);
        Ticket.find({}, "", {
            sort: {
                id: -1
            }
        }, (err, ticketList) => {
            if (err) return next(err);
            var result = [];
            for (var i in ticketList)
                result.push({
                    id: "#" + intReLength(ticketList[i].id, 4),
                    phone: ticketList[i].phone,
                    hasPrize: ticketList[i].isUsed
                });
            res.render('tickets', {
                userAmount: userAmount,
                ticketList: result
            });
        });
    });
});

router.get('/apply', function(req, res, next) {
    res.render('apply', {});
});

router.get('/winner', function(req, res, next) {
    Prize.find({}, {}, {
        sort: {
            createdAt: -1
        }
    }, (err, prizeList) => {
        if (err) return next(err);
        var result = [];
        var usedAmount = 0;
        for (var i in prizeList) {
            result.push({
                id: "#" + intReLength(prizeList[i].ticketId, 4),
                phone: prizeList[i].phone,
                prize: prizeList[i].prize,
                onclick: "onclick=\"get('#" + intReLength(prizeList[i].ticketId, 4) + "','" + prizeList[i].phone + "')\"",
                isUsed: prizeList[i].isUsed
            });
            if (prizeList[i].isUsed) usedAmount++;
        }

        res.render('winner', {
            usedAmount: usedAmount,
            prizeList: result
        });
    });
});

router.post('/generateToken', function(req, res, next) {
    var reqAmount = req.body.amount;
    if (isNaN(parseInt(reqAmount)))
        return res.end("請輸入數字");
    getUnrepeatedToken(reqAmount, function(success, reply) {
        if (!success) return res.end("伺服器錯誤");
        res.end(reply);
    });
});

router.post('/applyPrize', function(req, res, next) {
    var provider = req.body.provider;
    var prize = req.body.prize;
    var id = req.body.id;
    Ticket.findOneAndUpdate({
        id: id,
        isUsed: false
    }, {
        isUsed: true
    }, (err, theTicket) => {
        if (err) return next(err);
        if (!theTicket) return res.end("找不到對應抽獎券，或已被使用過");
        var newPrize = Prize({
            ticketId: id,
            user: theTicket.user,
            phone: theTicket.phone,
            prize: provider + "_" + prize
        });
        newPrize.save((err) => {
            if (err) return next(err);
            res.end();
        });
    });
});

router.post('/findRecord', function(req, res, next) {
    var query = req.body.query;
    if (query.length == 10) {
        query = {
            phone: query
        };
    } else if (query.length < 10) {
        query = {
            id: query
        };
    } else {
        res.end([]);
    }
    if (req.body.type == "prize") {
        query.ticketId = query.id;
        query.id = undefined;
        Prize.find(query, {}, {
            sort: {
                createdAt: -1
            }
        }, (err, reply) => {
            if (err) return res.end([]);
            var result = [];
            for (var i in reply)
                result.push({
                    id: "#" + intReLength(reply[i].ticketId, 4),
                    phone: reply[i].phone,
                    prize: reply[i].prize,
                    onclick: "onclick=\"get('#" + intReLength(reply[i].ticketId, 4) + "','" + reply[i].phone + "')\"",
                    isUsed: reply[i].isUsed
                });
            return res.end(JSON.stringify(result));
        });
    } else {
        Ticket.find(query, "", {
            sort: {
                id: -1
            }
        }, (err, reply) => {
            if (err) return res.end([]);
            var result = [];
            for (var i in reply)
                result.push({
                    id: "#" + intReLength(reply[i].id, 4),
                    phone: reply[i].phone,
                    hasPrize: reply[i].isUsed
                });
            return res.end(JSON.stringify(result));
        });
    }
});

router.post('/getPrize', function(req, res, next) {
    var id = req.body.id;
    var phone = req.body.phone;
    Prize.findOneAndUpdate({
        ticketId: id,
        phone: phone,
        isUsed: false
    }, {
        isUsed: true
    }, (err, reply) => {
        if (err || !reply) return res.end('false');
        res.end('true');
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

function intReLength(data, length) {
    var str = data.toString();
    var amountToAdd = length - str.length;
    for (var j = 0; j < amountToAdd; j++) {
        str = "0" + str;
    }
    return str;
}

module.exports = router;