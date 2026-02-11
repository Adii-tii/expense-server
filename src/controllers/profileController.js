const userDao = require("../dao/userDao");

const profileController = {
    getUserInfo: async(req, res) => {
        try{
            const email = req.user.email;
            const user = await userDao.findByEmail(email);

            return res.json({
                user: user
            })

        }catch(error){
            return res.status(500).json({
                message: "internal server error"
            })
        }
    }
}

module.exports = profileController