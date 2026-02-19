const groupDao = require("../dao/groupDao");
const userDao = require("../dao/userDao");
const Group = require("../models/group");
const cloudinaryService = require("../services/cloudinaryService");


const groupController = {
    create: async (req, res) => {
        const user = req.user;

        try {
            const userInfo = await userDao.findByEmail(user.email);

            if (userInfo.credits === undefined) {
                userInfo.credits = 1;
            }

            if (userInfo.credits === 0) {
                return res.status(400).json({
                    message: "Insufficient credits available to create group"
                });
            }

            const { name, description, memberEmail, thumbnail } = req.body;

            let allMembers = [user.email];

            if (memberEmail && Array.isArray(memberEmail)) {
                allMembers = [...new Set([...allMembers, ...memberEmail])];
            }

            const balances = allMembers.map(email => ({
                userEmail: email,
                netBalance: 0
            }));

            const newGroup = await groupDao.createGroup({
                name,
                description,
                adminEmail: user.email,
                memberEmail: allMembers,
                balances,
                thumbnail,
                paymentStatus: {
                    amount: 0,
                    currency: "INR",
                    date: Date.now(),
                    isPaid: false
                },
                createdBy: user.id
            });

            userInfo.credits -= 1;
            await userInfo.save();

            return res.status(201).json({
                message: "Group created successfully",
                group: newGroup
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "Internal server error"
            });
        }
    },


    update: async (req, res) => {
        try {
            const { groupId } = req.params;
            const { name, adminEmail, description, thumbnail } = req.body;

            const group = await Group.findById(groupId);

            if (!group) {
                return res.status(404).json({
                    message: "Group not found!"
                });
            }

            if (group.adminEmail !== req.user.email) {
                return res.status(403).json({
                    message: "Only admin can edit group details"
                });
            }

            const updatedData = {};

            if (name) updatedData.name = name;
            if (thumbnail) updatedData.thumbnail = thumbnail;
            if (adminEmail) updatedData.adminEmail = adminEmail;
            if (description) updatedData.description = description;

            const updatedGroup = await groupDao.updateGroup({
                groupId,
                ...updatedData
            });

            return res.status(200).json({
                message: "Group details updated successfully",
                group: updatedGroup
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "Internal server error!"
            });
        }
    },

    uploadGroupThumbnail: async (req, res) => {
        try {
            const groupId = req.params.groupId;

            if (!req.file) {
                return res.status(400).json({ message: "No image provided" });
            }

            const result = await cloudinaryService.uploadImage(
                req.file.buffer,
                {
                    folder: "group_thumbnails",
                    publicId: `group_${groupId}`,
                    transformation: [{ width: 256, height: 256, crop: "fill" }],
                    mime: req.file.mimetype
                }
            );

            const updatedGroup = await groupDao.updateGroupThumbnail(
                groupId,
                result.secure_url
            );

            return res.json({
                thumbnail: result.secure_url,
                group: updatedGroup
            });

        } catch (err) {
            console.error("uploadGroupThumbnail error:", err);
            return res.status(500).json({ message: "Thumbnail upload failed" });
        }
    },



    addMembers: async (req, res) => {
        try {
            const { groupId } = req.params;
            const { newMembers } = req.body;

            const group = await Group.findById(groupId);

            if (!group) {
                return res.status(404).json({ message: "Group not found" });
            }

            if (group.adminEmail !== req.user.email) {
                return res.status(403).json({
                    message: "Only admin can add members"
                });
            }

            const membersToAdd = newMembers.filter(
                email => !group.memberEmail.includes(email)
            );

            group.memberEmail.push(...membersToAdd);

            membersToAdd.forEach(email => {
                group.balances.push({
                    userEmail: email,
                    netBalance: 0
                });
            });

            await group.save();

            return res.status(200).json({
                message: "Members added successfully",
                group
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "Internal server error!"
            });
        }
    },


    removeMembers: async (req, res) => {
        const { groupId, emails } = req.body;

        try {
            const group = await Group.findById(groupId);

            if (!group) {
                return res.status(404).json({ message: "Group not found" });
            }

            if (group.adminEmail !== req.user.email) {
                return res.status(403).json({
                    message: "Only admin can remove members"
                });
            }

            for (let email of emails) {
                const balanceEntry = group.balances.find(
                    b => b.userEmail === email
                );

                if (balanceEntry && balanceEntry.netBalance !== 0) {
                    return res.status(400).json({
                        message: `Cannot remove ${email}, unsettled balances exist`
                    });
                }
            }

            group.memberEmail = group.memberEmail.filter(
                email => !emails.includes(email)
            );

            group.balances = group.balances.filter(
                b => !emails.includes(b.userEmail)
            );

            await group.save();

            return res.status(200).json({
                message: "Members removed successfully",
                group
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "Internal server error!"
            });
        }
    },


    deleteGroup: async (req, res) => {
        try {
            const email = req.user.email;
            const { groupId } = req.params;

            const group = await groupDao.getGroupById(groupId);

            if (!group) {
                return res.status(404).json({
                    message: "Group not found!"
                });
            }

            if (group.adminEmail !== email) {
                return res.status(403).json({
                    message: "Only admin can delete group"
                });
            }

            await groupDao.deleteGroup(groupId);

            return res.status(200).json({
                message: "Removed group successfully"
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "Internal server error!"
            });
        }
    },


    getGroupsByUser: async (req, res) => {
        try {
            const { email } = req.user;

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 5;
            const skip = (page - 1) * limit;

            const sortBy = req.query.sortBy || "newest";

            let sortOptions = { createdAt: -1 };

            if (sortBy === "oldest") {
                sortOptions = { createdAt: 1 };
            }

            const { groups, totalCount } =
                await groupDao.getGroupsPaginated(
                    email,
                    limit,
                    skip,
                    sortOptions
                );

            if (groups.length === 0) {
                return res.status(404).json({
                    message: "No groups exist for this user"
                });
            }

            return res.status(200).json({
                message: "All groups fetched successfully!",
                groups,
                groupCount: totalCount,
                pagination: {
                    totalItems: totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                    currentPage: page,
                    itemsPerPage: limit
                }
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: "Internal Server Error!"
            });
        }
    },


    getAuditLogs: async (req, res) => {
        return res.status(200).json({
            logs: []
        });
    }

};

module.exports = groupController;
