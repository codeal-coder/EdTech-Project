const User = require("../models/User")
const Profile = require("../models/Profile")
const Otp = require("../models/Otp")
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailSender = require("../utilis/mailSender");
require("dotenv").config();
const {passwordUpdated} = require("../mail/templates/passwordUpdate");
const { data } = require("react-router-dom");

//sendOtp
exports.sendOTP = async (req , res) =>{
    try{
        //fetch eamil from request body
        const{email} = req.body;

        //check if user already exist
        const checkUserPresent = await User.findOne({email});
        
        // is user exist then return responce
        if (checkUserPresent) {
            return res.status(401).json({
                success:true,
                message:"user already register"
            })
        }

        //generator otp
        var otp = otpGenerator.generate(6,{

            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        });

        //console.log("otp : ",otp);

        //check otp unique or not
        let result = await Otp.findOne({otp:otp});

        while (result) {
            otp = otpGenerator.generate(6,{
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false,
            });
            result = await Otp.findOne({otp:otp});

        }

        const otpPayload = {email,otp};

        //create entry in db for otp

        const otpBody = await Otp.create(otpPayload);
        //console.log(otpBody);

        //return responce successfully
        res.status(200).json({
            success:true,
            message:"otp sent successfully",
            otp,
        })        

        

    }catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            message:error.message,

        })
        

    }
}

//signUp
exports.signUp = async (req,res) =>{
    try{
        //fetch data from body
        const{
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            contactNumber,
            otp,
            accountType
        } = req.body;
        //console.log("otp: " ,otp);
        
        
        //validate krlo
        if (!firstName || 
            !lastName ||
            !email ||
            !password ||
            !confirmPassword ||
            !otp ||
            !accountType) {
            console.log("why missing data");
            
            return res.status(400).json({
                success:false,
                message:"fill all detail"
            })
        }
        
        

        //match 2 password
        if (password !== confirmPassword) {
            return res.status(400).json({
                success:false,
                message:"Password and ConfirmPassword value does not matched ,please try again",

            })
        }
        // check user already exist
        const existUser = await User.findOne({email});
        if (existUser) {
            return res.status(400).json({
                success:false,
                message:"user already registered",
            })
        }

        //find most reent otp for user
        const recentOtp = await Otp.find({email}).sort({createdAt:-1}).limit(1);
        //console.log("recent otp : ",recentOtp,);
        //console.log("otp: ",typeof otp);
        //console.log("r otp",typeof recentOtp[0].otp);
        
        
        
        //validate otp
        if (recentOtp.length === 0) {
            //otp not found
            return res.status(400).json({
                success:false,
                message:"otp not found",
            })
        }else if (otp !==String(recentOtp[0].otp)) {
            //invalid otp
            return res.status(400).json({
                suceess: false,
                message:"invalid otp",
            })
        }

        //hash password
        const hashPassword = await bcrypt.hash(password,10);

        //create entry in db successfully
        const profileDetails = await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null,
        })
        const user = await User.create({
            firstName,
            lastName,
            email,
            password:hashPassword,
            contactNumber, 
            accountType,
            additionalDetails:profileDetails._id,
            image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        })

        //return responce
        return res.status(200).json({
            success:true,
            message:"user register suceessfully",
            user,
        })
    }catch(error){
        console.log(error);
        return res.status(400).json({
            success:false,
            message:error.message,
        })
        
    }
}


//login

exports.login = async(req,res) =>{
    try {
        
        //get datat from req body
        const{email,password} = req.body;

        //validation data
        if (!email || !password) {
            return res.status(401).json({
                success:false,
                message:'fill all details',
            })
        }

        //user check exist or not
        const user = await User.findOne({email}).populate("additionalDetails");
        if (!user) {
            return res.status(400).json({
                success:false,
                message:"user not exist"
            })
        }

        //password match and generate token JWT
        if(await bcrypt.compare(password,user.password)){
            const payload= {
                email:user.email,
                id:user._id,
                accountType:user.accountType,
            }
            const token = jwt.sign(payload, process.env.JWT_SECERET,{
                expiresIn:"12h",
            })
            //console.log(token);
            
            user.token = token;
            user.password = undefined;
        
        
            //create cookie
            const options={
                expires:new Date(Date.now() + 3*24*60*60*1000),
                httpOnly:true,
            }
            res.cookie("token", token,options).status(200).json({
                success:true,
                token,
                user,
                message:"logged in successfully",
            })
        }else{
            return res.status(401).json({
                success:false,
                message:"password is incorrect"
            });
        }

    } catch (error) {
        console.log(error);
        return res.status(401).json({
                success:false,
                message:"login failure,please try again."
        });
    }
        
    
}

// //change password
// exports.changePassword = async (req,res) =>{
//     try{
//         //fetch data from body
//         const{oldPassword,email,newPassword,confrimPassword} = req.body;
//         // const {email} = req.body;
//         // const oldPassword = req.body.oldPassword.trim();
//         // const newPassword = req.body.newPassword.trim();
//         // const confrimPassword = req.body.confrimPassword.trim();

//         //get oldPassword, newPassword, confirmNewPassword
        
        
//         const user = await User.findOne({email});
//         console.log(user);
        
//         if(!user){
//             return res.status(401).json({
//                 success:false,
//                 message:"user not found"
//             })
//         }
//         //check old password - validation
//         if (!newPassword || !confrimPassword || !oldPassword) {
//             return res.status(401).json({
//             success:false,
//             message:"fill all details"
//         })
//         }

//         console.log("Old password (trimmed):", `"${oldPassword}"`, "length:", oldPassword.length);
//         console.log("Password from DB:", `"${user.password}"`, "length:", user.password.length);
        
        
//         const pass = await bcrypt.compare(oldPassword,user.password);
//         console.log(pass,"match value ");
        
//         if (!pass) {
//             return res.status(401).json({
//                 success:false,
//                 message:"password not matched, try again"
//             })
//         }
//         if (newPassword !== confrimPassword) {
//             return res.status(401).json({
//                 success:false,
//                 message:"password not matched"
//             })
//         }

//         //update new password in db
//         const hashPassword = await bcrypt.hash(newPassword,10);
//         // user.password = hashPassword;
//         const UserDetails = await User.findByIdAndUpdate(user._id,{password:hashPassword},{new:true})
        
//         //send mail
//         const emailResponse = await mailSender(
//         UserDetails.email,
//         "Password for your account has been updated",
//         passwordUpdated(
//           UserDetails.email,
//           `Password updated successfully for ${UserDetails.firstName} ${UserDetails.lastName}`
//         )
//       )
//         return res.status(200).json({
//             success:true,
//             message:"Password update successfully",
//             pass:emailResponse
//         })
//     }catch(error){
//         console.log(error);
//         return res.status(500).json({
//             success:false,
//             message:error.message
//         })
        
//     }


// }

exports.changePassword = async (req, res) => {
  try {
    // Get user data from req.user
    const userDetails = await User.findById(req.user.id)

    // Get old password, new password, and confirm new password from req.body
    const { oldPassword, newPassword } = req.body

    // Validate old password
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    )
    if (!isPasswordMatch) {
      // If old password does not match, return a 401 (Unauthorized) error
      return res
        .status(401)
        .json({ success: false, message: "The password is incorrect" })
    }

    // Update password
    const encryptedPassword = await bcrypt.hash(newPassword, 10)
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    )

    // Send notification email
    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Password for your account has been updated",
        passwordUpdated(
          updatedUserDetails.email,
          `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
        )
      )
      console.log("Email sent successfully:", emailResponse.response)
    } catch (error) {
      // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
      console.error("Error occurred while sending email:", error)
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      })
    }

    // Return success response
    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" })
  } catch (error) {
    // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
    console.error("Error occurred while updating password:", error)
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    })
  }
}
