const mongoose = require('mongoose');

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
    },
    code: {
        type: String,
        default: null
    },
    codeExpiresAt: {
        type: Date,
        default: null
    }, 
})


module.exports = mongoose.model('User', userSchema);