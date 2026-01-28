const Group = require("../models/group");
const auditLogs = require("../models/auditLogs");

const groupDao = {

    createGroup: async (data) => {
        const newGroup = new Group(data);
        return await newGroup.save();
    },

    updateGroup: async (data) => {
        const { groupId, name, description, thumbnail, adminEmail, paymentStatus } = data;

        return await Group.findByIdAndUpdate(
            groupId,
            { name, description, thumbnail, adminEmail, paymentStatus },
            { new: true }
        );
    },

    addMembers: async (groupId, membersEmail) => {
        return await Group.findByIdAndUpdate(
            groupId,
            {
                $addToSet: {
                    memberEmail: { $each: membersEmail }
                }
            },
            { new: true }
        );
    },

    removeMembers: async (groupId, membersEmail) => {
        return await Group.findByIdAndUpdate(
            groupId,
            {
                $pull: {
                    memberEmail: { $in: membersEmail }
                }
            },
            { new: true }
        );
    },

    getGroupByEmail: async (email) => {
        return await Group.find({ memberEmail: email });
    },

    getGroupByStatus: async (status) => {
        return await Group.find({ "paymentStatus.isPaid": status });
    },

    getAuditLog: async (groupId) => {
        return await auditLogs.find({groupId}).sort({createdAt: -1});
    }

};

module.exports = groupDao;
