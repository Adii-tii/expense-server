const jwt = require("jsonwebtoken");

const authMiddleware = {
    protect: async (req, res, next) => {
        console.log("AUTH MIDDLEWARE HIT");

        try {
            const token = req.cookies?.jwt;
            console.log("inside try");

            if (!token) {
                return res.status(401).json({
                    message: "Unauthorized access!"
                });
            }

            console.log("completed ", req.user);


            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = decoded;

            console.log("completed ", req.user);
            next();

        } catch (error) {
            console.log(error);
            return res.status(401).json({
                message: "Invalid or expired token"
            });
        }
    }
};

module.exports = authMiddleware;
