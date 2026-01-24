const User = require('../models/User');

const userDao = {
    findByEmail: async(email) => {
        return await User.findOne({email});
    },

    create: async(userData) => {
        const newUser = new User(userData);
        return await newUser.save();
    }
};

module.exports = userDao;
