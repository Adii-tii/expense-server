const express = require("express");
const router = express.Router();
const rbacController = require("../controllers/rbacController")
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeMiddleware = require("../middlewares/authorizeMiddleware");

router.use(authMiddleware.protect);


router.post("/", authorizeMiddleware('user:create') , rbacController.create);
router.delete("/delete", authorizeMiddleware('user:delete'), rbacController.delete);
router.patch("/", authorizeMiddleware('user:update'), rbacController.update);
router.get("/", authorizeMiddleware('user:view'),  rbacController.getAllUsers);

module.exports = router;