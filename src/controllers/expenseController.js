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

            /* ===== VALIDATION ===== */

            const paidTotal = paidBy.reduce((sum, p) => sum + p.amount, 0);
            const splitTotal = splits.reduce((sum, s) => sum + s.share, 0);

            if (paidTotal !== amount || splitTotal !== amount) {
                return res.status(400).json({
                    message: "Paid and split totals must equal expense amount"
                });
            }

            /* initialize remaining */

            const paidMap = {};
            paidBy.forEach(p => {
                paidMap[p.email] = (paidMap[p.email] || 0) + p.amount;
            });

            const preparedSplits = splits.map(s => {
                const paid = paidMap[s.email] || 0;
                const remaining = Math.max(s.share - paid, 0);

                return {
                    ...s,
                    remaining
                };
            });

            const expense = await expenseDao.createExpense({
                groupId,
                title,
                currency: currency || "INR",
                amount,
                splits: preparedSplits,
                paidBy,
                splitType,
                notes
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

            const existing = await expenseDao.getExpenseById(expenseId);

            if (!existing) {
                return res.status(404).json({ message: "Expense not found" });
            }

            const updateData = req.body;

            /* Optional validation if financial fields updated */

            if (updateData.amount && updateData.splits && updateData.paidBy) {

                const paidTotal = updateData.paidBy.reduce((s, p) => s + p.amount, 0);
                const splitTotal = updateData.splits.reduce((s, p) => s + p.share, 0);

                if (paidTotal !== updateData.amount || splitTotal !== updateData.amount) {
                    return res.status(400).json({
                        message: "Paid and split totals must equal expense amount"
                    });
                }
            }

            const updatedExpense = await expenseDao.updateExpense(expenseId, updateData);

            return res.status(200).json({ updatedExpense });

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

            const groupExists = await groupDao.getGroupById(groupId);

            if (!groupExists) {
                return res.status(404).json({
                    message: "Group does not exist"
                });
            }

            const expenses = await expenseDao.getExpensesByGroupId(groupId);
            const totalOwed = await expenseDao.getTotalOwedByUser(groupId, email);
            const totalUserIsOwed = await expenseDao.getTotalUserIsOwed(groupId, email);

            return res.status(200).json({
                expenses,
                totalOwed,
                totalUserIsOwed
            });

        } catch (error) {
            console.log(error);

            return res.status(500).json({
                message: "Internal server error"
            });
        }
    },


    getExpensesBySettlementStatus: async (req, res) => {

        try {

            const { groupId } = req.params;
            const { isSettled } = req.query;

            const expenses = await expenseDao.getExpensesBySettlementStatus(
                groupId,
                isSettled === "true"
            );

            return res.status(200).json({ expenses });

        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },


    getExpensesByUserParticipation: async (req, res) => {

        try {

            const { userId } = req.user;

            const expenses = await expenseDao.getExpensesByUserParticipation(userId);

            return res.status(200).json({ expenses });

        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Internal server error" });
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

            const totalOwed = await expenseDao.getTotalOwedByUser(groupId, email);

            return res.status(200).json({
                totalOwed,
                message: "Total amount you owe in this group"
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    getTotalUserIsOwedInGroup: async (req, res) => {
        try {
            const { email } = req.user;
            const { groupId } = req.params;

            const totalIsOwed = await expenseDao.getTotalUserIsOwed(groupId, email);

            return res.status(200).json({
                totalIsOwed,
                message: "Total amount you are owed in this group"
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    getPeopleIOwe: async (req, res) => {
        try {
            const { groupId } = req.params;
            const { email: myEmail } = req.user;

            const expenses = await expenseDao.getExpensesByGroupId(groupId);
            const unsettledExpenses = expenses.filter(e => !e.isSettled);

            const balanceMap = {};

            unsettledExpenses.forEach((expense) => {
                const totalBill = expense.amount;
                const payers = expense.paidBy; // [{email, amount}]
                const splits = expense.splits; // [{email, remaining}]

                const mySplit = splits.find(s => s.email === myEmail);
                if (mySplit && mySplit.remaining > 0) {
                    payers.forEach(payer => {
                        if (payer.email === myEmail) return; 

                        const amountOwedToPayer = mySplit.remaining * (payer.amount / totalBill);
                        balanceMap[payer.email] = (balanceMap[payer.email] || 0) + amountOwedToPayer;
                    });
                }

                const myPayment = payers.find(p => p.email === myEmail);
                if (myPayment && myPayment.amount > 0) {
                    const myContributionRatio = myPayment.amount / totalBill;

                    splits.forEach(otherPerson => {
                        if (otherPerson.email === myEmail) return;

                        const amountTheyOweMe = otherPerson.remaining * myContributionRatio;
                        balanceMap[otherPerson.email] = (balanceMap[otherPerson.email] || 0) - amountTheyOweMe;
                    });
                }
            });

            const iOweThesePeople = Object.entries(balanceMap)
                .map(([email, netAmount]) => ({
                    email,
                    name: email.split('@')[0], // Fallback name
                    amount: Number(netAmount.toFixed(2))
                }))
                .filter(pair => pair.amount > 0); 

            return res.status(200).json({
                creditors: iOweThesePeople
            });

        } catch (error) {
            console.error("Error in getPeopleIOwe:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

};

module.exports = expenseController;
