const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
    name : {type: String, required: true},
    description : {type: String, required: true},
    adminEmail: {type:String, required: true},
    createdAt: {type: Date, default: Date.now(), required: true},
    memberEmail: [String],
    thumbnail: {type: String, required: false},
    paymentStatus:
        {
            amount: Number,
            currency: String,
            date: Date,
            isPaid: Boolean,
            
    }
});

module.exports = mongoose.model('Group', groupSchema);