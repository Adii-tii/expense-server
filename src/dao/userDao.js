const User = require('../models/user');

const userDao = {
    findByEmail: async(email) => {
        return await User.findOne({email});
    },

    create: async(userData) => {
        const newUser = new User(userData);
        try{
            return await newUser.save();
        } catch (error){
            if(error.code === 11000){
                const err = new Error();
                err.code = 'USER_EXISTS';
                throw err;
            }else{
                console.log(error);
                throw new Error({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Something went wrong while communicating with DB'
                });
            }
        }
    }
};

module.exports = userDao;
