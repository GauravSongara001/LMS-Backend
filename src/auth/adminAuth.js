async function adminAuth (req,res,next) {
    try {
       if (req.user) {
            if (req.user.role.roleName == 'admin') {
                next();                
            } else {
                res.send({ statusCode: 400, message: "Unauthorized" })
            }
       } else {
            res.send({ statusCode: 400, message: "Unauthorized" })
       }
        
    } catch (error) {
        console.log("Error while autorization: ", error);
        res.send({ statusCode: 400, message: "Invalid Token" })
    }
}

module.exports = adminAuth;