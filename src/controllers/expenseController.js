const expenseDao = require("../dao/expenseDao");
const groupDao = require("../dao/groupDao");

const expenseController = {

    create: async (req, res) => {
        try {
            const { groupId } = req.params;

            const {
                title,
                currency,
                amount,
                members,
                paidBy,
                splitType,
            } = req.body;

            if (!title || !amount || !paidBy || !splitType || !groupId) {
                return res.status(400).json({
                    message: "Missing required fields"
                });
            }

            const expense = await expenseDao.createExpense({
                groupId,
                title,
                currency: currency || "INR",
                amount,
                members,
                paidBy,
                splitType,
                status: "pending",
                createdAt: new Date()
            });

            return res.status(201).json({
                expense,
                message: "Expense created successfully"
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "Internal Server Error"
            });
        }
    },

    update: async (req, res) => {
        try {
            const { expenseId } = req.params;
            const expense = await expenseDao.getExpenseById(expenseId);

            if (!expense) {
                return res.status(404).json({
                    message: "Not found"
                })
            }

            const { amount, title, currency, splitType, items, paidBy } = req.body;
            const updatedExpense = await expenseDao.updateExpense({
                expenseId, amount, title, currency, splitType, items, paidBy
            }, { new: true });

            updatedExpense.updatedAt = Date.now();

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "Internal server error"
            })
        }
    },

    addMembers: async (req, res) => {
        try {
            const expenseId = req.params.expenseId;
            let expense = await expenseDao.getExpenseById(expenseId);
            const { newMembers } = req.body;

            if (!expense) {
                return res.status(404).json({
                    message: "Expense not found"
                })
            }

            if (newMembers.length === 0) {
                return res.status(400).json({
                    message: "Nothing to add"
                })
            }

            expense = await expenseDao.addMembers(expenseId, newMembers);

            return res.status(200).json({
                expense,
                message: "added new members successfully"
            })

        } catch {
            return res.status(500).json({
                message: "Internal server error"
            })
        }
    },

    removeMembers: async (req, res) => {
        try {
            const expenseId = req.params.expenseId;
            const { members } = req.body;

            let expense = await expenseDao.getExpenseById(expenseId);

            if (!expense) {
                return res.status(404).json({
                    message: "Expense not found"
                })
            }

            expense = await expenseDao.removeMembers(expenseId, members);

            return res.status(200).json({
                expense,
                message: "removed members successfully"
            })

        } catch (error) {
            return res.status(500).json({
                message: "Removed members successfully"
            })
        }
    },

    getExpensesByGroup: async (req, res) => {
        try {
            const { groupId } = req.params;

            const groupExists = await groupDao.getGroupById(groupId);

            if (!groupExists) {
                return res.status(404).json({
                    message: "Group does not exist"
                });
            }

            const expenses = await expenseDao.getExpensesByGroupId(groupId);

            if (expenses.length === 0) {
                return res.status(200).json({
                    expenses: [],
                    message: "No expenses added yet"
                });
            }

            return res.status(200).json({
                expenses,
                message: "Expenses fetched successfully"
            });

        } catch (error) {
            console.log(error);

            return res.status(500).json({
                message: "Internal server error"
            });
        }
    },

    getExpenseByStatus: async (req, res) => {
        try {
            const { status } = req.query;

            if (!status) {
                return res.status(400).json({ message: "Status required" });
            }

            const expenses = await expenseDao.getExpensesByStatus(status);

            return res.status(200).json({
                expenses,
                message: "fetched successfully"
            })
        } catch (error) {
            console.log(error);

            return res.status(500).json({
                message: "internal server error"
            })
        }
    },

    getExpenseByUserStatus: async (req, res) => {
        try {
            const { userId } = req.user;
            const  status  = req.query.status;
            const expenses = await expenseDao.getExpensesByUserStatus(userId, status);

            return res.status(200).json({
                expenses: expenses,
                message: "fetched expenses successfully"
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "Internal Server Error"
            })
        }
    },

    getExpensespByMembers: async (req, res) => {
        try {
            const { memberEmail } = req.body;

            const expenses = await expenseDao.getExpensesByMemberEmail(memberEmail);

            return res.status(200).json({
                expenses,
                message: "fetched successfully!"
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "internal server error"
            })
        }
    },

    delete: async (req, res) => {
        try {
            const expenseId = req.params.expenseId;

            const expense = await expenseDao.getExpenseById(expenseId);
            if (!expense) {
                return res.status(404).json({
                    message: "expense does not exist"
                })
            }

            await expenseDao.deleteExpense(expenseId);

            return res.status(200).json({
                message: "ok"
            })
        } catch (error) {
            return res.status(500).json({
                message: "internal server error!"
            })
        }
    },

    updateSettlement: async(req, res) => {
        
    }

};

module.exports = expenseController;
