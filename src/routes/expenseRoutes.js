const express = require("express");
const expenseController = require("../controllers/expenseController");

const router = express.Router({ mergeParams: true });
const authMiddleware = require("../middlewares/authMiddleware");


router.post("/", expenseController.create);
router.get("/", expenseController.getExpensesByGroup);
router.patch("/:expenseId", expenseController.update);
router.delete("/:expenseId", expenseController.delete);
router.get("/category/" , expenseController.getExpenseByCategory);



module.exports = router;
