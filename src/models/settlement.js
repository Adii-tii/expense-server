const mongoose = require("mongoose");

const settlementSchema = new mongoose.Schema({

    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
        index: true
    },

    type: {
        type: String,
        enum: ["expense-settlement", "group-settlement"],
        required: true
    },

    fromUserEmail: {
        type: String,
        required: true,
        index: true
    },

    toUserEmail: {
        type: String,
        required: true,
        index: true
    },

    amount: {
        type: Number,
        required: true,
        min: 0
    },

    currency: {
        type: String,
        default: "INR"
    },

    expenseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Expense",
        default: null
    },

    note: String

}, { timestamps: true });

module.exports = mongoose.model("Settlement", settlementSchema);
