const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const User = require('../models/UserModel')
const Role = require('../models/RoleModel');
const Book = require('../models/BooksModel');
const UserBook = require('../models/UserBookModel');
const RequestBook = require('../models/RequestBook');

module.exports = {
    async getUserList(req,res) {
        try {

            let userList = await User.aggregate([
                {
                    $lookup: {
                        from: "roles",
                        localField: "role",
                        foreignField: "_id",
                        as:"roles",
                    }
                },
                {
                    $unwind: {
                        path: "$roles",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $match: {
                        $or:[
                            { name: { $regex: req.body.filterData, $options: 'i' } },
                            { email: { $regex: req.body.filterData, $options: 'i' } },
                            { "roles.roleName" : { $regex: req.body.filterData, $options: 'i' }}
                        ]
                    }
                },
                {
                    $facet: {
                        result: [
                            { $sort: { _id: -1} },
                            { $skip: req.body.start },
                            { $limit: req.body.end },
                        ],
                        totalCount: [
							{
								$count: "count",
							},
						]
                    }
                }
            ])
            console.log('userList: ', userList);

            if (userList) {
                let count = userList[0]?.totalCount ? userList[0]?.totalCount.length > 0 ? userList[0]?.totalCount[0].count : 0 : 0;
                res.send({ statusCode: 200, records: userList[0].result, totalRecords: count})
            } else {
                res.send({ statusCode: 400, records: null, message: error.message })
            }
            
        } catch (error) {
            console.log("Error while get User List: ", error);
            res.send({ statusCode: 400, message: error.message })
        }
    },

    async getSingleUserDetails(req,res) {
        try {
            let getUserData = await User.findById(req.query.id).populate("role").lean();
            if (getUserData) {
                res.send({ statusCode: 200, result: getUserData })
            } else {
                res.send({ statusCode: 404, result: null, message: "User Data Not Found!!"})
            }
            
        } catch (error) {
            console.log("Error while get single user data: ", error);
            res.send({ statusCode: 400, message: error.message })
        }
    },

    async updateUserData(req,res) {
        try {
            console.log("req.files >>>>>>>>>>>>>>", req.file);
            let data = req.body.data;
            let findRoleByName = await Role.findOne({roleName: data.role});
            
            if (findRoleByName) {
                data.role = findRoleByName._id;
                let updateUser = await User.findByIdAndUpdate(req.body.condition._id, data)
                console.log('updateUser ----------: ', updateUser);

                if (updateUser) {
                    res.send({statusCode: 200, message: "User Updated Successfully"})
                } else {
                    res.send({statusCode: 404, message: "Error while update user"})
                }
            } else {
                res.send({statusCode: 404, message: "Role Not Found"})
            }
            
        } catch (error) {
            console.log("Error while updateUserData: ", error);
            res.send({ statusCode: 400, message: error.message })
        }
    },

    async deleteUserData(req,res) {
        try {
            let deleteUser = await User.findByIdAndDelete(req.body._id);
            if (deleteUser) {
                res.send({statusCode: 200, message: "User Deleted Successfully"})
            } else {
                res.send({statusCode: 404, message: "Error while delete user"})
            }
            
        } catch (error) {
            console.log("Error while deleteUserData: ", error);
            res.send({ statusCode: 400, message: error.message })
        }
    },

    async getApprovalRequestList (req,res) {
        try {
            let data = req.body;
            
            let response = await RequestBook.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "user_ID",
                        foreignField: "_id",
                        as: "user_ID"
                    }
                },
                {
                    $unwind: {
                        path: "$user_ID",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "books",
                        localField: "book_ID",
                        foreignField: "_id",
                        as: "book_ID"
                    }
                },
                {
                    $unwind: {
                        path: "$book_ID",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $facet: {
                        result: [
                            { $skip: data.start },
                            { $limit: data.end },
                        ],
                        totalCount: [
                            { $count: "count"}
                        ]
                    }
                }
            ])
            console.log('response ----------: ', response);

            if (response) {
                let count = response[0]?.totalCount ? response[0]?.totalCount.length > 0 ? response[0]?.totalCount[0].count : 0 : 0;
                res.send({ statusCode: 200, records: response[0].result, totalRecords: count})

            } else {
                res.send({ statusCode: 400, message: "Error while get request approval List" })
            }
            
        } catch (error) {
            console.log("Error while get Approval Request List: ", error);
            res.send({ statusCode: 400, message: error.message })
        }
    },

    async approveIssueRequest (req,res) {
        try {
            let issueDate = new Date();
            let returnDate = new Date(issueDate.getFullYear(), issueDate.getMonth(), (issueDate.getDate() + 15))

            let dataObj = {
                user_ID: req.body.user_ID,
                book_ID: req.body.book_ID,
                issueDate: issueDate,
                returnDate: returnDate,
                status: "Issued"
            }

            let issueBook = await UserBook.create(dataObj);
            console.log('issueBook --------: ', issueBook);

            if (issueBook instanceof Error) {
                res.send({ statusCode: 400, message: "Error while Issue Book" });

            } else {
                let updateReqStatus = await RequestBook.findOneAndUpdate({ user_ID: req.body.user_ID, book_ID: req.body.book_ID }, 
                    { $set: { status: "APPROVED" } },
                    { new: true });

                console.log('updateReqStatus ------------: ', updateReqStatus);

                res.send({ statusCode: 200, message: "Request Approved" })
            }
        } catch (error) {
            console.log("Error while issue book request: ", error.message);
            res.send({ statusCode: 400, message: error.message })
        }
    },
}