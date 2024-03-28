const express = require('express');
const router = express.Router();
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null, 'public/userImages')
    },
    filename: function (req,file,cb) {
        let extName = file.originalname.split(".")[1]
        const fileName = "User_" + Date.now() + "." + extName;
        console.log('fileName: ', fileName);
        cb(null, fileName)
    }
})

const upload = multer({storage: storage});

const UserController = require('../controllers/userController');
const adminController = require('../controllers/adminController');
const authorization = require('../auth/auth');
const adminAuth = require('../auth/adminAuth');

// common routes
router.get('/', UserController.getHomePage)
router.post('/register', upload.single('userImage'), UserController.registerUser)
router.post('/login', UserController.loginUser)
router.get('/getAllBooksData', authorization, UserController.getAllBooksList);
router.post('/getUserIssuedBooksList', authorization, UserController.getUserIssuedBooksList);
router.post('/deleteIssueRequest', authorization, UserController.deleteIssueRequest)
router.post('/requestBookIssue', authorization, UserController.requestBookIssue);

//user specific routes
router.post('/getUserBookRequestList', authorization, UserController.getUserBookRequestList)

// admin routes
router.post('/admin/createRoles', UserController.createRoles)
router.post('/admin/getUsersList', authorization, adminAuth, adminController.getUserList);
router.get('/admin/getSingleUserDetails', authorization, adminAuth, adminController.getSingleUserDetails);
router.post('/admin/deleteUser', authorization, adminAuth, adminController.deleteUserData);
router.post('/admin/updateUserData', authorization, adminAuth, adminController.updateUserData);
router.post('/admin/getApprovalRequestList', authorization, adminAuth, adminController.getApprovalRequestList);
router.post('/admin/approveIssueRequest', authorization, adminAuth, adminController.approveIssueRequest);
// router.post('/admin/cancelIssueRequest', authorization, adminController.deleteIssueRequest)

module.exports = router;