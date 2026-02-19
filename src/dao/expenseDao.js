const Expense = require("../models/expense");
const mongoose = require("mongoose");
const Group = require("../models/group");

const expenseDao = {


    createExpense: async (expenseData) => {
        const newExpense = new Expense(expenseData);
        return await newExpense.save();
    },


    updateExpense: async (expenseId, updateData) => {
        return await Expense.findByIdAndUpdate(
            expenseId,
            updateData,
            { new: true }
        );
    },


    getExpenseById: async (expenseId) => {
        return await Expense.findById(expenseId);
    },


    updateSplitRemaining: async (expenseId, email, newRemaining) => {

        return await Expense.findOneAndUpdate(
            {
                _id: expenseId,
                "splits.email": email
            },
            {
                $set: {
                    "splits.$.remaining": newRemaining
                }
            },
            { new: true }
        );
    },


    markExpenseSettled: async (expenseId) => {
        return await Expense.findByIdAndUpdate(
            expenseId,
            { isSettled: true },
            { new: true }
        );
    },


    deleteExpense: async (expenseId) => {
        return await Expense.findByIdAndDelete(expenseId);
    },


    getExpensesByGroupId: async (groupId) => {
        return await Expense.find({ groupId });
    },

    getExpensesBySettlementStatus: async (groupId, isSettled) => {
        return await Expense.find({
            groupId,
            isSettled
        });
    },

    getExpensesByUserParticipation: async (email) => {

        return await Expense.find({
            $or: [
                { "splits.email": email },
                { "paidBy.email": email }
            ]
        });

    },

    getExpensesPaidByUser: async (userId) => {
        return await Expense.find({
            "paidBy.userId": userId
        });
    },

    getUnsettledDebtsBetweenUsers: async (groupId, fromEmail, toEmail) => {
        try {
            // Use $elemMatch to ensure the specific user has a remaining balance > 0
            const toReturn = await Expense.find({
                groupId: groupId,
                "paidBy.email": toEmail, // The creditor
                isSettled: false,
                splits: {
                    $elemMatch: {
                        email: fromEmail,      // The debtor
                        remaining: { $gt: 0 }  // Must have debt in THIS specific split
                    }
                }
            }).sort({ createdAt: 1 }); // FIFO: Settle oldest debts first

            return toReturn;
        } catch (error) {
            console.error("Error in getUnsettledDebtsBetweenUsers:", error);
            throw error;
        }
    },

    getTotalOwedBetweenUsers: async (groupId, fromEmail, toEmail) => {

        const expenses = await Expense.find({
            groupId,
            isSettled: false,
            "splits.email": fromEmail,
            "paidBy.email": toEmail
        });

        let totalDebt = 0;

        for (const exp of expenses) {

            const fromSplit = exp.splits.find(
                s => s.email === fromEmail
            );

            if (!fromSplit || fromSplit.remaining <= 0) continue;

            const toPaid = exp.paidBy.find(
                p => p.email === toEmail
            );

            if (!toPaid) continue;

            const totalPaid = exp.paidBy.reduce(
                (sum, p) => sum + p.amount,
                0
            );

            if (totalPaid === 0) continue;

            const ratio = toPaid.amount / totalPaid;

            totalDebt += fromSplit.remaining * ratio;
        }

        return totalDebt;
    },

    getTotalUserIsOwed: async (groupId, email) => {

        const expenses = await Expense.find({
            groupId,
            isSettled: false,
            $or: [
                { "paidBy.email": email },
                { "splits.email": email }
            ]
        });

        let total = 0;

        for (const exp of expenses) {

            const myPaid = exp.paidBy
                .filter(p => p.email === email)
                .reduce((sum, p) => sum + p.amount, 0);

            const myShare = exp.splits
                .filter(s => s.email === email)
                .reduce((sum, s) => sum + s.share, 0);

            const net = myPaid - myShare;

            if (net > 0) total += net;
        }

        return total;
    },

    getExpenseByCategoryForUser: async (userEmail, category) => {

        return await Expense.find({
            category,
            "splits.email": userEmail
        }).lean();

    },

    getExpensesGroupedByCategoryForUser: async (email) => {
        return await Expense.aggregate([
            { $unwind: "$splits" },

            {
                $match: {
                    "splits.email": email
                }
            },

            {
                $group: {
                    _id: "$category",
                    expenses: { $push: "$$ROOT" },
                    totalAmount: { $sum: "$splits.share" }
                }
            },

            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    expenses: 1,
                    totalAmount: 1
                }
            },

            { $sort: { totalAmount: -1 } }
        ]);
    },


    getUnsettledExpensesForGroups: async (groupIds) => {

        return await Expense.find({
            groupId: { $in: groupIds },
            "splits.remaining": { $gt: 0 }
        }).lean();

    },

    getTotalOwedByUserInGroup: async (email, group) => {
        console.log("this the group", group);
        const myBalance = group.balances.find(b => b.userEmail === email);

        const totalOwed = myBalance && myBalance.netBalance < 0
            ? Math.abs(myBalance.netBalance)
            : 0
        return totalOwed;
    },

    getTotalUserIsOwedInGroup: async (email, group) => {
        const balances = group.balances || [];

        const myBalance = balances.find(
            b => b.userEmail === email
        );

        const totalIsOwed =
            myBalance && myBalance.netBalance > 0
                ? Number(myBalance.netBalance)
                : 0;

        return totalIsOwed;
    },

    getTotalUserSpendings: async (email) => {
        const result = await Expense.aggregate([
            { $match: { "splits.email": email } },
            { $unwind: "$splits" },
            { $match: { "splits.email": email } },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$splits.share" }
                }
            }
        ]);

        return result[0]?.total || 0;
    }


};

module.exports = expenseDao;

