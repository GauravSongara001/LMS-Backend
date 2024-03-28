const mongoose = require('mongoose');

const requestBookSchema = new mongoose.Schema({
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
    requestType: {
        type: String,
        required: true,
    },
    status: {
        type: String,
    }
})

const RequestBook = mongoose.model("RequestBook", requestBookSchema);

module.exports = RequestBook;