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

    deleteGroup: async(groupId) => {
        return await Group.findByIdAndDelete(
            groupId
        )
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

    getGroupById : async(groupId) => {
        return await Group.findById(groupId);
    },

    getGroupByEmail: async (email) => {
        return await Group.find({ memberEmail: email });
    },

    getGroupByStatus: async (status) => {
        return await Group.find({ "paymentStatus.isPaid": status });
    },

    getAuditLog: async (groupId) => {
        return await auditLogs.find({groupId}).sort({createdAt: -1});
    },

    getGroupsByCreatedById : async(createdBy) => {
        return await Group.find({createdBy}).select("-password");
    },

    getGroupsPaginated: async(email, limit, skip,sortOptions ={createdAt: -1}) => {
        const [groups, totalCount] = await Promise.all([
            Group.find({
                memberEmail: email
            }).sort(sortOptions)
            .skip(skip)
            .limit(limit),

            Group.countDocuments({memberEmail:email}),
        ])

        return {groups, totalCount};
    },

    //since we have implemented pagination we do not have the entire data on the client device, we will perform sorting operations on the server itself


};

module.exports = groupDao;
