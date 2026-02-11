const express = require("express");
const expenseController = require("../controllers/expenseController");

const router = express.Router({ mergeParams: true });


router.post("/", expenseController.create);
router.get("/", expenseController.getExpensesByGroup);
router.patch("/:expenseId", expenseController.update);
router.delete("/:expenseId", expenseController.delete);

module.exports = router;
