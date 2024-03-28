const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs')
const Joi = require('joi');

const User = require('../models/UserModel');
const Role = require('../models/RoleModel');
const Book = require('../models/BooksModel');
const UserBook = require('../models/UserBookModel');
const RequestBook = require('../models/RequestBook');

module.exports = {
    async getHomePage (req,res) {
        try {
            res.send({ statusCode: 200, message: "Hello World!!"})        
        } catch (error) {
            console.log("Error getting home page: ", error);
            res.send({statusCode: 400, message: error.message})
        }
    },

    async registerUser (req, res) {
        try {
            let data = JSON.parse(req.body.data);

            let userSchema = Joi.object().keys({
                name: Joi.string().required(),
                email: Joi.string().required(),
                password: Joi.string().required(),
            }).options({abortEarly : false});
            
            let { error } = userSchema.validate(data)

            if (error) {
                res.send({statusCode: 400, message: error.toString()})
                
            } else {
                let findUserRole = await Role.findOne({roleName: "user"}).lean();
                if (findUserRole) {
                    data.role = findUserRole._id;
                    data.profileImage = req.file.filename;
    
                    data.password = await bcrypt.hash(data.password, 12);
    
                    let registerUser = await User.create(data);
                    res.json({ statusCode: 200, result: registerUser})
                } else {
                    if (req.file) {
                        fs.unlink('public/userImages/' + req.file.filename, (err) => {
                            if (err) {
                                console.log("Error while delete file", err);
                            } else {
                                console.log("Image deleted successfully");
                            }
                        });
                    }
                    res.json({ statusCode: 400, message: "Role Not found!!" })
                }
            }
            
        } catch (error) {
            console.log("Error while register user: ", error);
            if (req.file) {
                fs.unlink('public/userImage/' + req.file.filename, (err) => {
                    if (err) {
                        console.log("Error while delete file");
                    } else {
                        console.log("Image deleted successfully");
                    }
                });
            }
            res.send({ statusCode: 400, message: error.message })
        }
    },

    async createRoles(req,res) {
        try {
            let createRole = await Role.create(req.body);
            res.send(createRole);
        } catch (error) {
            console.log("Error while create Roles: ", error);
            res.send({ statusCode: 400, message: error.message })
        }
    },

    async loginUser(req,res) {
        try {
            let data = req.body.data;

            let getUserFromDB = await User.findOne({email: data.email}).populate("role").lean();
            if (getUserFromDB) {
                
                let isAuthenticated = await bcrypt.compare(data.password, getUserFromDB.password);

                if (isAuthenticated) {
                    let token = jwt.sign(getUserFromDB, "mynameisGauravSongaraFromAhmedabad");
                    delete getUserFromDB.password;

                    res.send({
                        statusCode: 200,
                        token: token,
                        userdata: getUserFromDB,
                        message: "User Logged in"
                    })

                } else {
                    res.send({
                        statusCode: 400,
                        message: "Invalid Credentials!!"
                    })
                }
            } else {
                res.send({
                    statusCode: 400,
                    message: "Invalid Credentials!!"
                })
            }
            
        } catch (error) {
            console.log("Error while Login: ", error);
            res.send({ statusCode: 400, message: error.message })
        }
    },

    async getAllBooksList(req,res) {
        try {
            let getAllBooksList = await Book.find().lean();
            if (getAllBooksList) {
                res.send({statusCode: 200, records: getAllBooksList})
            } else {
                res.send({ statusCode: 400, message: "Books not found" })
            }
            
        } catch (error) {
            console.log("Error while getAllBooksList: ", error);
            res.send({ statusCode: 400, message: error.message })
        }
    },

    async getUserIssuedBooksList(req,res) {
        try {
            // let user_ID = req.user._id;
            let data = req.body;

            // let getUserIssuedBooksList = await UserBook.find({user_ID: req.user._id})

            let getUserIssuedBooksList = await UserBook.aggregate([
                {
                    $match: {
                        user_ID: new mongoose.Types.ObjectId(req.user._id)
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
                            { $skip: req.body.start },
                            { $limit: req.body.end },
                            { $sort: { _id: -1 } }
                        ],
                        totalCount: [
                            { $count: "count"}
                        ]
                    }
                }
            ])
            console.log('getUserIssuedBooksList -----------: ', JSON.stringify(getUserIssuedBooksList));
            
            if (getUserIssuedBooksList) {
                let count = getUserIssuedBooksList[0]?.totalCount ? getUserIssuedBooksList[0]?.totalCount.length > 0 ? getUserIssuedBooksList[0]?.totalCount[0].count : 0 : 0;

                getUserIssuedBooksList[0].result.forEach((el) => {
                    el.issueDate = new Date(el.issueDate).toLocaleDateString('en-gb', { timeZone: "Asia/Kolkata"})
                    el.returnDate = new Date(el.returnDate).toLocaleDateString('en-gb', { timeZone: "Asia/Kolkata"})
                })
                res.send({ statusCode: 200, records: getUserIssuedBooksList[0].result, totalRecords: count})
            } else {
                res.send({ statusCode: 400, records: null, message: error.message })
            }
            
        } catch (error) {
            console.log("Error while getUserIssuedBooksLis: ", error.message);
            res.send({ statusCode: 400, message: error.message })
        }
    },

    async deleteIssueRequest(req,res) {
        try {
            let deleteIssueRequest = await RequestBook.findOneAndDelete({ book_ID: req.body.book_ID, user_ID: req.user._id });
            res.send({ statusCode: 200, message: "Issue Request Cancelled Successfully" })

            
        } catch (error) {
            console.log("Error while delete Issue Request: ", error.message);
            res.send({ statusCode: 400, message: error.message })
        }
    },

    async getUserBookRequestList(req,res) {
        try {
            let data = req.body;
            
            let response = await RequestBook.aggregate([
                {
                    $match: {
                        user_ID: new mongoose.Types.ObjectId(req.user._id)
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
                res.send({ statusCode: 400, message: "Error while get books request List" })
            }
            
        } catch (error) {
            console.log("Error while get books request List: ", error.message);
            res.send({ statusCode: 400, message: error.message })
        }
    },

    async requestBookIssue (req,res) {
        try {

            let getIssuedBooksList = await UserBook.find({ $and: [{user_ID: req.user._id} , {book_ID: req.body.bookId}]});
            console.log('getIssuedBooksList: ', getIssuedBooksList);

            if (getIssuedBooksList.length > 0) {
                res.send({ statusCode: 400, message: "Book Already Issued" })
                
            } else {
                let getRequestedBookIssue = await RequestBook.find({ $and: [{user_ID: req.user._id} , {book_ID: req.body.bookId}]});
                console.log('getRequestedBookIssue: ', getRequestedBookIssue);

                if (getRequestedBookIssue.length > 0) {
                    res.send({ statusCode: 400, message: "Book Already In Request Queue" })

                } else {
                    let dataObj = {
                        user_ID: req.user._id,
                        book_ID: req.body.bookId,
                        requestType: "Issue",
                        status: "PENDING"
                    }
        
                    let requestBookIssue = await RequestBook.create(dataObj);
                    console.log('requestBookIssue --------: ', requestBookIssue);
        
                    if (requestBookIssue instanceof Error) {
                        res.send({ statusCode: 400, message: "Error while Issue Book" });
        
                    } else {
                        res.send({ statusCode: 200, message: "Request Approved" })
                    }
                }
            }

            
        } catch (error) {
            console.log("Error while issue book request: ", error.message);
            res.send({ statusCode: 400, message: error.message })
        }
    },
}