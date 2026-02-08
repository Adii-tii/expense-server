const permissions = require("../utility/permissions");

const authorize = (requiredPermissions) => {
    return (req, res, next) => {
        const user = req.user; //authmiddleware executes before authorize middleware
        
        if(!user){
            return res.status(401).json({
                message: "Unauthorized access"
            })
        }

        const userPermissions = permissions[user.role] || [];
        if(!userPermissions.includes(requiredPermissions)){
            return res.status(403).json({
                message: "Forbidden: Insufficient permissions"
            })
        }

        next();
    }
}

module.exports = authorize