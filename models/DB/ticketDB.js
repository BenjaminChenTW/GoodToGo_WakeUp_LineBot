var mongoose = require('mongoose');

// define the schema for our user model
var schema = mongoose.Schema({
    id: Number,
    user: String,
    isRead: {
        type: Boolean,
        default: false
    },
    isUsed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

schema.index({
    "id": 1
});
schema.index({
    "user": 1
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Ticket', schema);