const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Role"
    },
    profileImage: {
        type: String,
        required: true
    }
})

const User = mongoose.model("User", userSchema);

module.exports = User;