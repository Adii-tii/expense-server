const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({

    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
        index: true
    },

    title: {
        type: String,
        required: true
    },

    notes: String,

    currency: {
        type: String,
        default: "INR"
    },

    amount: {
        type: Number,
        required: true
    },

    paidBy: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },

            email: {
                type: String,
                required: true
            },

            amount: {
                type: Number,
                required: true
            }
        }
    ],

    splits: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },

            email: {
                type: String,
                required: true
            },

            share: {
                type: Number,
                required: true
            },

            remaining: {
                type: Number,
                required: true
            }
        }
    ],

    splitType: {
        type: String,
        enum: ["equal", "unequal", "share", "custom"],
        default: "equal"
    }

}, { timestamps: true });

module.exports = mongoose.model("Expense", expenseSchema);
