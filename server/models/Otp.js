const mongoose = require("mongoose");
const mailsender = require("../utilis/mailSender");
const {otpTemplate} = require("../mail/templates/emailVerificationTemplate");

const otpSchema = mongoose.Schema({
    email:{
        type:String,
        required:true
       
    },
    otp:{
        type:Number,
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now,
        expires:60*5,
    },
    
    
    
})


//a function = to send otp to email

// async function sendVerificationEmail(email,otp) {
//     try {

//         const mailResponce = await mailsender();
//         console.log("Email send successfully: ",mailResponce);
        
        
//     } catch (error) {
//         console.log("error occured while sending email ",error.message);
//         throw error;
        
//     }
// }

otpSchema.pre("save", async function(next) {
    await mailsender(this.email,"Email Verification from StudyNation",otpTemplate(this.otp));
    next();
})

module.exports = mongoose.model("OTP",otpSchema);