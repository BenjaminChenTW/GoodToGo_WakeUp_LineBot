var mongoose = require('mongoose');

// define the schema for our user model
var schema = mongoose.Schema({
    ticketId: Number,
    user: String,
    phone: String,
    prize: String,
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
schema.index({
    "phone": 1
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Prize', schema);