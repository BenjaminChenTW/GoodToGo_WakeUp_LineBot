var User = require("./DB/userDB");
var Ticket = require("./DB/ticketDB");

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
            reply(false, event.replyToken, "登錄完成！如果你有中獎，我們會再與你聯繫，祝你中獎！");
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
    getAllTicket: function(event, reply) {
        findTicket(event, {
            "user": event.source.userId,
            "isUsed": false
        }, reply);
    },
    othersTicket: function(event, reply) {
        findTicket(event, {
            "user": event.source.userId,
            "isRead": false,
            "isUsed": false
        }, reply);
    }
};

function findTicket(event, query, reply) {
    Ticket.find(query, (err, tickets) => {
        if (err) return reply(false, event.replyToken);
        var ticketIdList = [];
        var overTen = false;
        var length = tickets.length;
        if (length > 10) {
            overTen = true;
            length = 9;
        }
        for (var i = 0; i < length; i++)
            ticketIdList.push(tickets[i].id);
        Ticket.updateMany({
            'id': {
                '$in': ticketIdList
            }
        }, {
            'isRead': true
        }, (err, ticketsUpdated) => {
            if (err) return reply(false, event.replyToken);
            if (overTen)
                ticketIdList.push(-1);
            reply(true, event.replyToken, ticketIdList);
        });
    });
}