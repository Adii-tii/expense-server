const mongoose = require("mongoose");

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

    splitType: {
        type: String,
        enum: ["equal", "percentage", "exact"],
        default: "equal"
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
        }
    ],

    paidBy: {
        type: String, // email for now
        required: true
    },

    status: {
        type:String,
        default: false,
    },

    thumbnail: {
        type: String
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Expense", expenseSchema);
