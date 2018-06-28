/**
 * BOT init
 */
var config = require('../config/config.js');
const Client = require('@line/bot-sdk').Client;
const client = new Client(config.bot);
var debug = require('debug')('goodtogo-linebot:bot');
var handlers = require("../models/messageHandler");

module.exports = {
    // event handler
    handleEvent: function(event) {
        if (event.type === 'message' && event.message.type === 'text') {
            if (isMobilePhone(event.message.text)) {
                handlers.phoneNumber(event, textReply);
            } else if (event.message.text === "抽獎說明") {
                textReply(true, event.replyToken, "1. 向工作人員索取指定序號\n2. 輸入序號得到抽獎券\n3. 每天19:30將現場抽出得獎者");
            } else if (event.message.text === "登錄聯絡資訊") {
                handlers.toAdd(event, textReply, buttonsReply);
            } else if (event.message.text === "我要修正聯絡資訊") {
                textReply(true, event.replyToken, "請輸入可連絡到你的手機號碼");
            } else if (event.message.text === "手機號碼無誤，不需修正") {
                textReply(true, event.replyToken, "好的，祝你中獎！");
            } else if (event.message.text === "查詢中獎名單") {
                handlers.findWinner(event, textReply);
            } else if (event.message.text === "我的抽獎券") {
                handlers.getAllTicket(event, imageCarouselTemplateReply);
            } else if (event.message.text === "檢視更多抽獎券") {
                handlers.othersTicket(event, imageCarouselTemplateReply);
            } else {
                textReply(true, event.replyToken, "不好意思，我們是有點笨的機器人，無法辨識你的文字><\n如果有任何問題，歡迎到好盒器攤位找工作人員哦！");
            }
        } else {
            return Promise.resolve(null);
        }
    },
    multicast: function(id, message, sended, name, imgUrl) {
        client.pushMessage(id, message)
            .then((res) => sended(name, imgUrl))
            .catch((err) => {
                sended(err);
                debug(JSON.stringify(err.originalError.response.config.data));
                debug(JSON.stringify(err.originalError.response.data));
            });
    }
};

/*
 *  event handling
 */
function isMobilePhone(phone) {
    var reg = /^[09]{2}[0-9]{8}$/;

    return reg.test(phone);
}

function textReply(success, replyToken, message) {
    if (!success) {
        message = '伺服器維修中...請聯繫客服或再嘗試一次！';
    } else if (message === '') {
        return Promise.resolve(null);
    }
    // create a echoing text message
    const echo = {
        type: 'text',
        text: message
    };
    // use reply API
    return client.replyMessage(replyToken, echo).catch((err) => {
        debug(JSON.stringify(err.originalError.response.config.data));
        debug(JSON.stringify(err.originalError.response.data));
    });
};

function buttonsReply(success, replyToken, message) {
    var echo;
    if (!success) {
        echo = {
            type: 'text',
            text: '伺服器維修中...請聯繫客服或再嘗試一次！'
        };
    } else {
        echo = {
            "type": "template",
            "altText": message,
            "template": {
                "type": "buttons",
                "text": message,
                "actions": [{
                        "type": "message",
                        "label": "我要修正聯絡資訊",
                        "text": "我要修正聯絡資訊"
                    },
                    {
                        "type": "message",
                        "label": "手機號碼無誤，不需修正",
                        "text": "手機號碼無誤，不需修正"
                    }
                ]
            }
        };
    }
    return client.replyMessage(replyToken, echo).catch((err) => {
        debug(JSON.stringify(err.originalError.response.config.data));
        debug(JSON.stringify(err.originalError.response.data));
    });
};

function imageCarouselTemplateReply(success, replyToken, ticketIds) {
    var echo;
    if (!success) {
        echo = {
            type: 'text',
            text: '伺服器維修中...請聯繫客服或再嘗試一次！'
        };
    } else {
        echo = {
            "type": "template",
            "altText": "抽獎券們！",
            "template": {
                "type": "image_carousel",
                "columns": []
            }
        };
        for (var i in ticketIds) {
            if (ticketIds[i] !== -1)
                echo.template.columns.push({
                    "imageUrl": "https://app.goodtogo.tw/wakeup/images/item3.jpg",
                    "action": {
                        "type": "postback",
                        "label": ticketIds[i],
                        "uri": "action=buy"
                    }
                });
            else
                echo.template.columns.push({
                    "imageUrl": "https://app.goodtogo.tw/wakeup/images/item3.jpg",
                    "action": {
                        "type": "message",
                        "label": "檢視更多抽獎券",
                        "text": "檢視更多抽獎券"
                    }
                });
        }
    }
    return client.replyMessage(replyToken, echo).catch((err) => {
        debug(JSON.stringify(err.originalError.response.config.data));
        debug(JSON.stringify(err.originalError.response.data));
    });
}