const rbacDao = require("../dao/rbacDao");
const bcrypt = require("bcrypt");
const emailService = require("../services/emailService")

const generateTemporaryPassword = (desiredLength) => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";

    let result = ' ';

    for(let i = 0; i <  desiredLength; i++){
        result+= chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;  
}

const rbacController = {
    create: async (req, res) => {
        try {
            const adminUser = req.user;
            const{username, email, role} = req.body;
            console.log(req.body);
            console.log(req.user);

            const tempPassword = generateTemporaryPassword(10);
            const salt = await bcrypt.genSalt(10);
            console.log("created password");

            console.log("this is the temp password : ", tempPassword);

            const hashedPassword = await bcrypt.hash(tempPassword, salt);
            console.log("created password");
            console.log("this is the admin id: " , adminUser.id);

            const user = await rbacDao.create(email,hashedPassword , username, role, adminUser.id);
            console.log("user created!");

            try{
                await emailService.send(
                    email, "temp password",
                    `you temppassword is: ${tempPassword}`
                )
                console.log("email sent successfully!");

            }catch (error){
                console.log(error);
            }

            return res.status(200).json({
                message: "User created!",
                user: user
            })
        } catch (error) {
            console.log(error);

            res.status(500).json({
                message: "Internal server error"
            })
        }
    },

    update: async (req, res) => {
        try {
            const { userId, username, role } = req.body;
            console.log("look at this" + req.body);

            if (!userId) {
                return res.status(400).json({
                    message: "user id is required"
                })
            }


            const user = await rbacDao.update(userId, username, role);

            return res.status(200).json({
                message: "updated user details!"
            })
        } catch (error) {
            console.log(error);

            res.status(500).json({
                message: "Internal Server Error. Try again later."
            })
        }
    },

    delete: async (req, res) => {
        try {
            const { userId } = req.body;
            const user = await rbacDao.getUserById(userId);

            console.log("this is the user: " , user);
            if(!user) {
                return res.status(404).json({
                message: "user not found"
            })
        }

            await rbacDao.delete(userId);  
            return res.status(200).json({
                message :"delete user successfully."
            }) 
        } catch(error){
            return res.status(500).json({
                message:"Internal server error"
            })
        }
    },

    getAllUsers : async(req, res) => {
        try{
            const adminUser = req.user;
            
            const users = await rbacDao.getUsersByAdminId(adminUser.id);
            return res.status(200).json({
                users: users
            })
        } catch (error){
            console.log(error);
            return res.status(500).json({
                message: "Internal server error"
            })
        }
    },

    test: async(req, res) => {
        return res.status(200).json({
            message: "working!"
        })
    }


}

module.exports = rbacController;