const jwt = require("jsonwebtoken");
require("dotenv").config();
const User  = require("../models/User");

//auth
exports.auth = async (req,res,next) =>{
    
    
    try {
        //extract token
        //console.log("token 11: ",req.cookies.token);
        //console.log(req.body.token);
        //console.log("token 13",req.header("Authorization").replace("Bearer ", ""));
        
        
        
        const token =req.header("Authorization").replace("Bearer ", "") ||
                     req.cookies.token ||
                     req.body.token ;
        
        //console.log("token 21",token);
        

        
        

        //if token missing then return responce
        if (!token) {
            return res.status(401).json({
                success:true,
                message:"missing token",
            })
        }
        
        
        //verify token
        try {
            
            
            const decode = await jwt.verify(token, process.env.JWT_SECERET);
            //console.log("Auth : ",decode);
            //console.log("i am here ay 41");
            
            req.user = decode;
            
        } catch (error) {
            //verification issues
            console.log("error 47 : ",error);
            
            return res.status(500).json({
                success:false,
                message:"errro in token or token is invalid"
            })
        }
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"somthing went wrong while validating  the token "
        });
        
    }
}

//isStudent

exports.isStudent = async(req,res,next) =>{
    try {
        if (req.user.accountType !== "Student") {
            return res.status(401).json({
                success:false,
                message:"this is protected route for student  only "
            })
        }
        next();


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"user rol caanot be verified  "
        });
    }
}

//isAdmin

exports.isAdmin = async(req,res,next) =>{
    try {
        if (req.user.accountType !== "Admin") {
            return res.status(401).json({
                success:false,
                message:"this is protected route for student  only "
            })
        }
        next();


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"user rol caanot be verified  "
        });
    }
}

//isInstructor

exports.isInstructor = async(req,res,next) =>{
    try {
        if (req.user.accountType !== "Instructor") {
            return res.status(401).json({
                success:false,
                message:"this is protected route for student  only "
            })
        }
        next();


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"user rol caanot be verified  "
        });
    }
}