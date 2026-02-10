const express = require("express");
const expenseController = require("../controllers/expenseController");

const router = express.Router({ mergeParams: true });

router.post("/", expenseController.create);
router.get("/", expenseController.getExpensesByGroup);
router.patch("/:expenseId", expenseController.update);
router.patch("/:expenseId/add-members", expenseController.addMembers);
router.patch("/:expenseId/remove-members", expenseController.removeMember);
router.delete("/:expenseId", expenseController.delete);

router.get("/status", expenseController.getExpenseByStatus);
router.get("/user/status", expenseController.getExpenseByUserStatus);
router.get("/members", expenseController.getExpensespByMembers);

module.exports = router;
