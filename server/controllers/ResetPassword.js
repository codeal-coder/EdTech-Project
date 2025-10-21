const User = require("../models/User");
const mailSender = require("../utilis/mailSender");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

//resetPasswordToken
exports.resetPasswordToken = async(req,res) =>{
    try{
        //get email from req.body
        const email = req.body.email;

        //check user from this email, email validation
        const user = await User.findOne({email:email});
        if (!user) {
            return res.status(401).json({
                success:true,
                message:"user not found"
            })
        }

        //generate link and token
        const token = crypto.randomBytes(20).toString("hex");

        //update user by adding token and expires time
        const updatedDetails =await User.findOneAndUpdate({email:email},
            {
            token:token,
            resetPasswordExpires:Date.now()+ 3600000,
            },
            {new:true});

        console.log("token ",updatedDetails.token);
        
        //create url
        const url = `http://localhost:3000/update_password/${token}`
        //send mail containing then url 
        await mailSender(email,"password reset link",`Password Reset  link ${url}`)

        //return responce
        
        return res.status(200).json({
            success:true,
            message:"password change successfully",
        })

    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"password not change please try again",
        })
        
    }
   
}

//resetpassword
exports.resetPassword = async(req,res) =>{
    try {
        //data fetch
        const{password,confirmPassword,token} = req.body;

        //validation
        if (password !== confirmPassword ) {
            
            return res.status(500).json({
                success:false,
                message:"password not match",
            })
        }

        //get user details from db using token
        const userDetails = await User.findOne({token});
        console.log("userdetails : ",userDetails);
        

        //if no entry - invalid entry
        if (!userDetails) {
            
            return res.status(500).json({
                success:false,
                message:"token invalid",
            })
        }

        //check tokem time
        if (userDetails.resetPasswordExpires < Date.now()) {
            return res.status(400).json({
                success:false,
                message:"token expires, please re-generate token"
            })
        }
        //hash password
        const hashPassword = await bcrypt.hash(password,10)

        //update password
        await User.findOneAndUpdate(
            {
                token:token,
            },
            {
                password:hashPassword,
            },
            {
                new:true,
            }
        )
        //respone
        return res.status(200).json({
            success:true,
            message:"password reset successfully",
        })
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"password not change please try again",
        })
    }
}