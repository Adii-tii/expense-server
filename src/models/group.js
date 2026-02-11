const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    adminEmail: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, required: true },

    memberEmail: [String],
    category: [String],
    thumbnail: { type: String },

    paymentStatus: {
        amount: Number,
        currency: String,
        date: Date,
        isPaid: Boolean,
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
    },

    balances: [
        {
            userEmail: { type: String, required: true },
            netBalance: { type: Number, default: 0 }
        }
    ]

});

module.exports = mongoose.model("Group", groupSchema);
