const expense = require("../models/expense");
const Expense = require("../models/expense");
const { addMembers } = require("./groupDao");

// addExpense
const expenseDao = {
    createExpense: async (expenseData) => {
        const newExpense = new Expense(expenseData);
        return await newExpense.save();    
    },

    updateExpense : async(expenseId, amount, title, currency, splitType, items, paidBy) => {
        
        const expense = Expense.findById(expenseId)
        return await Expense.findByIdAndUpdate(
            amount, title, currency, splitType, items, paidBy
        )
    },

    addMembers : async(expenseId, member) => {
        
    },

    removeMember : async(expenseId, member) => {

    },

    delete : async(expenseId) => {
        return await Expense.findByIdAndDelete(groupId)
    
    },

    getExpensesByStatus : async(status) => {
        return await Expense.find({ "status": status })
    },

    getExpensesByUserStatus : async(groupId, userId, status) => {
        return await Expense.find()
    },

    getExpensesByGroupId : async(groupId) => {
        return await Expense.find({groupId})
    }
}
// add or delete members from split
// removeExpense
// editExpense
// getExpensesByStatus
// getExpensesByUserStatus

module.exports = expenseDao;