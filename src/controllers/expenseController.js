    const expenseDao = require("../dao/expenseDao");
    const groupDao = require("../dao/groupDao");
    const Group = require("../models/group");

    const expenseController = {


        create: async (req, res) => {
            try {

                const { groupId } = req.params;

                const {
                    title,
                    category,
                    currency,
                    amount,
                    splits,
                    paidBy,
                    splitType,
                    notes
                } = req.body;

                if (!title || !amount || !splits || !paidBy) {
                    return res.status(400).json({
                        message: "Missing required fields"
                    });
                }

                const group = await Group.findById(groupId);
                if (!group) {
                    return res.status(404).json({
                        message: "Group not found"
                    });
                }

                const paidTotal = paidBy.reduce((sum, p) => sum + p.amount, 0);
                const splitTotal = splits.reduce((sum, s) => sum + s.share, 0);

                if (paidTotal !== amount || splitTotal !== amount) {
                    return res.status(400).json({
                        message: "Paid and split totals must equal expense amount"
                    });
                }

                const paidMap = {};
                paidBy.forEach(p => {
                    paidMap[p.email] = (paidMap[p.email] || 0) + p.amount;
                });

                const preparedSplits = splits.map(s => ({
                    ...s,
                    remaining: s.share - (paidMap[s.email] || 0)
                }));

                const expense = await expenseDao.createExpense({
                    groupId,
                    title,
                    category,
                    currency: currency || "INR",
                    amount,
                    splits: preparedSplits,
                    paidBy,
                    splitType,
                    notes
                });


                preparedSplits.forEach(split => {
                    const entry = group.balances.find(b => b.userEmail === split.email);
                    if (entry) entry.netBalance -= split.share;
                });

                paidBy.forEach(payer => {
                    const entry = group.balances.find(b => b.userEmail === payer.email);
                    if (entry) entry.netBalance += payer.amount;
                });

                await group.save();

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

                const existing = await expenseDao.getExpenseById(expenseId);
                if (!existing) {
                    return res.status(404).json({ message: "Expense not found" });
                }

                return res.status(400).json({
                    message: "Editing expenses after settlements is restricted. Create a correction expense instead."
                });

            } catch (error) {
                console.log(error);
                return res.status(500).json({
                    message: "Internal server error"
                });
            }
        },


        getExpensesByGroup: async (req, res) => {
            try {

                const { groupId } = req.params;
                const { email } = req.user;

                const group = await Group.findById(groupId);

                if (!group) {
                    return res.status(404).json({
                        message: "Group does not exist"
                    });
                }

                const expenses = await expenseDao.getExpensesByGroupId(groupId);

                const myBalance = group.balances.find(b => b.userEmail === email);

                return res.status(200).json({
                    expenses,
                    netBalance: myBalance ? myBalance.netBalance : 0
                });

            } catch (error) {
                console.log(error);
                return res.status(500).json({
                    message: "Internal server error"
                });
            }
        },


        delete: async (req, res) => {
            try {

                const { expenseId } = req.params;

                const expense = await expenseDao.getExpenseById(expenseId);
                if (!expense) {
                    return res.status(404).json({
                        message: "Expense does not exist"
                    });
                }

                const group = await Group.findById(expense.groupId);


                expense.splits.forEach(split => {
                    const entry = group.balances.find(b => b.userEmail === split.email);
                    if (entry) entry.netBalance += split.share;
                });

                expense.paidBy.forEach(payer => {
                    const entry = group.balances.find(b => b.userEmail === payer.email);
                    if (entry) entry.netBalance -= payer.amount;
                });

                await group.save();
                await expenseDao.deleteExpense(expenseId);

                return res.status(200).json({
                    message: "Expense deleted"
                });

            } catch (error) {
                console.log(error);
                return res.status(500).json({
                    message: "Internal server error"
                });
            }
        },


        getTotalOwedByUserInGroup: async (req, res) => {
            try {
                const { email } = req.user;
                const { groupId } = req.params;

                const group = await Group.findById(groupId);

                const myBalance = group.balances.find(b => b.userEmail === email);

                const totalOwed = myBalance && myBalance.netBalance < 0
                    ? Math.abs(myBalance.netBalance)
                    : 0;

                return res.status(200).json({ totalOwed });

            } catch (error) {
                return res.status(500).json({ message: "Internal server error" });
            }
        },


        getTotalUserIsOwedInGroup: async (req, res) => {
            try {
                const { email } = req.user;
                const { groupId } = req.params;

                const group = await Group.findById(groupId);

                if (!group) {
                    return res.status(404).json({ message: "Group not found" });
                }

                const balances = group.balances || [];

                const myBalance = balances.find(
                    b => b.userEmail === email
                );

                const totalIsOwed =
                    myBalance && myBalance.netBalance > 0
                        ? Number(myBalance.netBalance)
                        : 0;

                return res.status(200).json({ totalIsOwed });

            } catch (error) {
                return res.status(500).json({ message: "Internal server error" });
            }
        },



        getPeopleIOwe: async (req, res) => {
            try {

                const { groupId } = req.params;
                const { email } = req.user;

                const group = await Group.findById(groupId);

                if (!group) {
                    return res.status(404).json({ message: "Group not found" });
                }

                const balances = group.balances || [];

                const myBalance = balances.find(
                    b => b.userEmail === email
                );

                if (!myBalance || myBalance.netBalance >= 0) {
                    return res.status(200).json({ creditors: [] });
                }

                let remainingDebt = Math.abs(myBalance.netBalance);

                const creditors = [];

                for (const b of balances) {

                    if (remainingDebt <= 0) break;

                    if (b.netBalance > 0) {

                        const amount = Math.min(remainingDebt, b.netBalance);

                        creditors.push({
                            email: b.userEmail,
                            amount: Number(amount.toFixed(2))
                        });

                        remainingDebt -= amount;
                    }
                }

                return res.status(200).json({ creditors });

            } catch (error) {
                return res.status(500).json({ message: "Internal server error" });
            }
        },


        getUserDebtsInGroup: async (req, res) => {
            try {
                const { groupId } = req.params;
                const { email: myEmail } = req.user; // Logged-in user

                // 1. Fetch all unsettled expenses in the group
                const expenses = await expenseDao.getUnsettledExpensesByGroup(groupId);

                // 2. Map to track net balances specifically for the user
                // { "creditorEmail": netAmount }
                const myDebts = {};

                expenses.forEach((expense) => {
                    const totalAmount = expense.amount;
                    const payers = expense.paidBy; // Array: [{email, amount}]
                    const splits = expense.splits; // Array: [{email, remaining}]

                    const mySplit = splits.find(s => s.email === myEmail);
                    if (mySplit && mySplit.remaining > 0) {
                        payers.forEach((payer) => {
                            if (payer.email === myEmail) return; // Can't owe myself

                            // Calculation: My Remaining Debt * (Payer's Share / Total Bill)
                            const shareOwedToPayer = mySplit.remaining * (payer.amount / totalAmount);

                            myDebts[payer.email] = (myDebts[payer.email] || 0) + shareOwedToPayer;
                        });
                    }

                });

                const finalPairs = Object.entries(myDebts)
                    .map(([creditorEmail, amount]) => ({
                        to: creditorEmail,
                        amount: Number(amount.toFixed(2))
                    }))
                    .filter(pair => pair.amount > 0);

                return res.status(200).json({
                    myDebts: finalPairs
                });

            } catch (error) {
                console.error("Error in getUserDebtsInGroup:", error);
                return res.status(500).json({ message: "Internal server error" });
            }
        },

        getExpenseByCategory: async (req, res) => {
            try {

                const { email } = req.user;
                const { category } = req.params;

                if (!category) {
                    return res.status(400).json({
                        success: false,
                        message: "Category is required"
                    });
                }

                const expenses = await expenseDao.getExpenseByCategoryForUser(email, category);

                return res.status(200).json({
                    success: true,
                    count: expenses.length,
                    expenses
                });

            } catch (error) {

                console.error("getExpenseByCategory Error:", error);

                return res.status(500).json({
                    success: false,
                    message: "Internal server error"
                });
            }
        },

        getExpensesGroupedByCategory: async (req, res) => {

            try {

                const { email } = req.user;

                const data =
                    await expenseDao.getExpensesGroupedByCategoryForUser(email);

                return res.status(200).json({
                    success: true,
                    categories: data
                });

            } catch (error) {

                console.error("Grouped Category Error:", error);

                return res.status(500).json({
                    success: false,
                    message: "Internal server error"
                });
            }
        },





    };

    module.exports = expenseController;
