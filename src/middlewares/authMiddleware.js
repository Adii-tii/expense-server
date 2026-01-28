const jwt = require("jsonwebtoken");

const authMiddleware = {
    protect: async (req, res, next) => {
        console.log("AUTH MIDDLEWARE HIT");

        try {
            const token = req.cookies?.jwtToken;
            console.log("inside try");

            if (!token) {
                return res.status(401).json({
                    message: "Unauthorized access!"
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = decoded;

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
