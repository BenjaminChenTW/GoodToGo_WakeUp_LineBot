var User = require("./DB/userDB");
var Ticket = require("./DB/ticketDB");
var redis = require("../models/DB/redis");
var debug = require('debug')('goodtogo-linebot:handler');
var debugLog = require('debug')('goodtogo-linebot:handler');
debugLog.log = console.log.bind(console);

let nowId = null;

function getNowId(cb) {
    Ticket.findOne({}, {
        id: 1
    }, {
        sort: {
            id: -1
        }
    }, (err, newestTicket) => {
        if (err) throw err;
        if (!newestTicket) nowId = 0;
        else nowId = newestTicket.id + 1;
        debugLog("NowID init: " + nowId);
        if (cb) cb();
    });
}
getNowId();

module.exports = {
    phoneNumber: function(event, reply) {
        User.findOneAndUpdate({
            'lineId': event.source.userId
        }, {
            'phone': event.message.text
        }, {
            upsert: true,
            new: true
        }, (err, afterUpdate) => {
            if (err) return reply(false, event.replyToken);
            reply(true, event.replyToken, "登錄完成！如果你有中獎，我們會再與你聯繫，祝你中獎！");
        });
    },
    checkToken: function(event, isTokenReply, notTokenReply) {
        var token = event.message.text.toUpperCase().replace(/\s/g, "");
        redis.get('token:' + token, (err, getReply) => {
            if (err) {
                return notTokenReply(false, event.replyToken);
            } else if (getReply == null) {
                return notTokenReply(true, event.replyToken, "您輸入的驗證碼已被使用");
            } else {
                redis.del('token:' + token, (err, delReply) => {
                    console.log(err, delReply);
                    if (err) return notTokenReply(false, event.replyToken);
                    if (delReply !== 1) return notTokenReply(false, event.replyToken);

                    var generateTicket = function() {
                        var funcList = [];
                        for (var i = 0; i < getReply; i++) {
                            var newTicket = Ticket({
                                id: nowId,
                                user: event.source.userId
                            });
                            nowId++;
                            funcList.push(new Promise((resolve, reject) => {
                                var localTicket = newTicket;
                                localTicket.save((err) => {
                                    if (err) return reject(err);
                                    console.log(localTicket.id);
                                    resolve(localTicket);
                                });
                            }));
                        }
                        Promise
                            .all(funcList)
                            .then((ticketsList) => {
                                checkOverTen(ticketsList, event, isTokenReply);
                            })
                            .catch((err) => {
                                if (err) {
                                    debug(err);
                                    notTokenReply(false, event.replyToken);
                                }
                            });
                    };

                    if (nowId == null) getNowId(generateTicket);
                    else generateTicket(nowId);

                });
            }
        });
    },
    toAdd: function(event, newAddReply, hasAddReply) {
        User.findOne({
            'lineId': event.source.userId
        }, (err, theUser) => {
            if (err) return newAddReply(false, event.replyToken);
            if (!theUser)
                newAddReply(true, event.replyToken, "你尚未登錄聯絡資訊，請輸入可連絡到你的手機號碼");
            else
                hasAddReply(true, event.replyToken, "你已登錄聯絡資訊: " + theUser.phone + "，有需要修正嗎？");
        });
    },
    findWinner: function(event, reply) {

    },
    getAllTicket: function(event, reply, skip) {
        findTicket(event, {
            "user": event.source.userId,
            "isUsed": false
        }, reply, skip);
    },
    othersTicket: function(event, reply) {
        findTicket(event, {
            "user": event.source.userId,
            "isRead": false,
            "isUsed": false
        }, reply);
    }
};

function findTicket(event, query, reply, skip) {
    Ticket.find(query, "", {
        sort: {
            id: 1
        },
        skip: skip
    }, (err, tickets) => {
        if (err) return reply(false, event.replyToken);
        query.skip = skip;
        checkOverTen(tickets, event, reply, query);
    });
}

function checkOverTen(ticketsList, event, reply, options) {
    var ticketIdList = [];
    var ticketIdStrList = [];
    var overTen = false;
    var length = ticketsList.length;
    if (length > 10) {
        overTen = true;
        length = 9;
    }
    for (var i = 0; i < length; i++) {
        ticketIdStrList.push("#" + intReLength(ticketsList[i].id, 4));
        ticketIdList.push(ticketsList[i].id);
    }

    Ticket.updateMany({
        'id': {
            '$in': ticketIdList
        }
    }, {
        'isRead': true
    }, (err, ticketsUpdated) => {
        if (err) return reply(false, event.replyToken);
        if (overTen) {
            if (typeof options.isRead == "undefined") ticketIdStrList.push(((typeof options.skip == "undefined") ? 0 : options.skip) + length);
            else ticketIdStrList.push(-99999);
        }
        reply(true, event.replyToken, ticketIdStrList);
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