const User = require("../models/user")


const rbacDao = {
    create: async(email, hashedPassword, username, role, adminId) => {
        return await User.create({
            email: email,
            password: hashedPassword,
            username: username,
            role: role,
            adminId: adminId
        });
    },

    update: async(userId, username, role) => {
        console.log(username);
        return await User.findByIdAndUpdate(
            userId,
            {username, role},
            {new: true}
        );
    },

    delete: async(userId) => {
        return await User.findByIdAndDelete(userId);
    },

    getUsersByAdminId: async(adminId) => {
        return await User.find({adminId}).select("-password");
    },

    getUserById: async(userId) => {
        console.log("executing this...getting user by id")
        return await User.findById(userId);
    }
}

module.exports = rbacDao;