var mongoose = require('mongoose');

// define the schema for our user model
var schema = mongoose.Schema({
    phone: String,
    lineId: String
}, {
    timestamps: true
});

schema.index({
    "phone": 1
});
schema.index({
    "lineId": 1
});

// create the model for users and expose it to our app
module.exports = mongoose.model('User', schema);