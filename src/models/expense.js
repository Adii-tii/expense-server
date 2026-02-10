const mongoose = require("mongoose");
const Group = require("../models/group");


const expenseSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },

    title: {
        type: String,
        required: true
    },

    currency: {
        type: String,
        default: "INR"
    },

    amount: {
        type: Number,
        required: true
    },

    members: [
        {
            email: {
                type: String,
                required: true
            },
            share: {
                type: Number,
                required: true
            },
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        }
    ],

    paidBy: {
        type: [],
        required: true
    },


    splitType: {
        type: String,
        enum: ["equal", "unequal", "share", "custom"],
        default: "equal"
    },

    status: {
        type: String,
        enum: ["pending", "partial", "settled"],
        default: "pending",
    },

    isSettled: {
        type: Boolean,
        default: false
    },


    updatedAt: {
        type: Date,
    }, 

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Expense", expenseSchema);
