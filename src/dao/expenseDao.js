const Expense = require("../models/expense");
const { addMembers } = require("./groupDao");

// addExpense
const expenseDao = {
    createExpense: async (expenseData) => {
        const newExpense = new Expense(expenseData);
        return await newExpense.save();
    },

    updateExpense: async (expenseId, amount, title, currency, splitType, items, paidBy) => {

        const expense = Expense.findById(expenseId)
        return await Expense.findByIdAndUpdate(
            amount, title, currency, splitType, items, paidBy
        )
    },

    getExpenseById: async (expenseId) => {
        return await Expense.findById(expenseId);
    },

    addMembers: async (expenseId, newMembers) => {
        return await Expense.findByIdAndUpdate(
            expenseId,
            {
                $addToSet: {
                    members: { $each: newMembers }
                }
            },
            { new: true }
        )
    },

    removeMembers: async (expenseId, emails) => {
        return Expense.findByIdAndUpdate(
            expenseId,
            {
                $pull: {
                    members: { email: { $in: emails } }
                }
            },
            { new: true }
        );
    },


    deleteExpense: async (expenseId) => {
        return await Expense.findByIdAndDelete(groupId)

    },

    getExpensesByStatus: async (status) => {
        return await Expense.find({ "status": status })
    },

    getExpensesByUserStatus: async (userId, status) => {
        return await Expense.find({
            userId: userId,
            status: status
        })
    },

    getExpensesByGroupId: async (groupId) => {
        return await Expense.find({
            groupId: groupId
        })
    },

    getExpensesByMemberEmail: async (emails) => {
        return Expense.find({
            "members.email": { $in: emails }
        });
    }

}
// add or delete members from split
// removeExpense
// editExpense
// getExpensesByStatus
// getExpensesByUserStatus

module.exports = expenseDao;