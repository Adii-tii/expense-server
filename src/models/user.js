const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    subscriptionId: {
        type: String
    },
    planId: {
        type: String
    },
    status: {
        type: String
    },
    start: {
        type: Date
    },
    end: {
        type: Date
    },
    lastBillDate: {
        type: Date
    },
    nextBillDate: {
        type: Date
    },
    paymentsMade: {
        type: Number
    },
    paymentsRemaining: {
        type: Number
    }
})

const userSchema = new mongoose.Schema({ //defining user schema
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
    },
    googleId: {
        type: String,
    },
    code: {
        type: String,
        default: null
    },
    codeExpiresAt: {
        type: Date,
        default: null
    },
    role:{
        type:String,
    },
    adminId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        index: true 
    },
    credits: {
        type: Number,
        default: 1
    },
    subscription: {
        type: subscriptionSchema,
        required: false
    }

})


module.exports = mongoose.model('User', userSchema);