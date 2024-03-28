const jwt = require('jsonwebtoken');

async function authorization (req,res,next) {
    try {
        // console.log("req.headers >>>>>>>>>>>", req.headers);

        if (req.headers["authorization"]) {
            let token = req.headers["authorization"];
            // console.log('token -----------------: ', token);

            let authorizedUser = jwt.verify(token, "mynameisGauravSongaraFromAhmedabad");
            // console.log('authorizedUser --------: ', authorizedUser);

            if (authorizedUser) {
                req.user = authorizedUser;
                next();

            } else {
                res.send({ statusCode: 400, message: "Invalid Token" })
            }
            
        } else {
            res.send({ statusCode: 400, message: "Invalid Token" })
        }

        
    } catch (error) {
        console.log("Error while autorization: ", error);
        res.send({ statusCode: 400, message: "Invalid Token" })
    }
}

module.exports = authorization;