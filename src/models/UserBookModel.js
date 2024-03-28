const mongoose = require('mongoose');

const userBookSchema = new mongoose.Schema({
    user_ID: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "User"
    },
    book_ID: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Book"
    },
    issueDate: {
        type: Date,
        required: true,
        default: new Date()
    },
    returnDate: {
        type: Date,
        required: true,
        default: new Date()
    },
    status: {
        type: String,
    }
})

const UserBook = mongoose.model("UserBook", userBookSchema);

module.exports = UserBook;