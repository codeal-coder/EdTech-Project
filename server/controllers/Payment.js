const mongoose  = require("mongoose");
const {instance} = require("../config/razorpay");
const Course = require('../models/Course');
const User = require("../models/User");
const {paymentSuccessEmail} = require("../mail/templates/paymentSuccessEmail")
const CourseProgress = require("../models/CourseProgress");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail")
const mailSender = require("../utilis/mailSender");
const crypto = require("crypto")


//capture the payments and intiate the  razonpay order payments

// exports.capturePayments = async(req,res) =>{
//     try {
//         //get User Id
//         const userId = req.user.id;

//         //get Course Id
//         const courseId = req.body;

//         //validation course and user id
//         if (!userId || !courseId) {
//             return res.status(401).json({
//                 success:false,
//                 message:"invalid Course and User id",
//             })
            
//         }
//         let course;
//         try{
//             // get course details
//              course = await Course.findById(courseId)

//             //validation
//             if (!course) {
//                 return res.status(401).json({
//                     success:false,
//                     message:"invalid Course : cannot find course",
//                 })
                
//             }
//             //validation- user already pay for this course
//             const uid = new mongoose.Types.ObjectId(String(userId));
//             if (course.studentEnrolled.include(uid)) {
//                 return res.status(200).json({
//                     success:false,
//                     message:"Student is already enrolled",
//                 })
//             }
//         }catch(err){
//             return res.status(200).json({
//                 success:false,
//                 message:err.message,
                
//             })
//         }
//         //order create
//         const amount = course.price;
//         const currency = "INR";

//         const options = {
//             amount:amount*100,
//             currency:currency,
//             reciept:Math.random(Date.now()).toString(),
//             notes:{
//                 courseId:course._id,
//                 userId:userId,
//             }
//         }
//         try{
//             //intitate the payments using razorpay

//             const paymentsResponce = await instance.orders.create(options);
//             console.log(paymentsResponce);

//             //return responce
//             return res.status(200).json({
//                 success:true,
//                 courseName:course.courseName,
//                 courseDescription:course.courseDescription,
//                 thumbnail:course.thumbnail,
//                 orderId : paymentsResponce.id,
//                 amount:paymentsResponce.amount,
//                 currency:paymentsResponce.currency,
//                 data:paymentsResponce,
//             })
            
//         }catch(error){
//             console.log(error);
//             return res.status(500).json({
//                 success:false,
//                 message:"could not initiate the payment",
//                 error:error,
//             })
//         }

//     } catch (error) {
        
//         console.log(error);
//         return res.status(500).json({
//                 success:false,
//                 error:error,
//         })
//     }
// }

exports.capturePayment = async (req, res) => {
  const { course } = req.body
  const userId = req.user.id
  console.log(course);
  
  if (course.length === 0) {
    return res.json({ success: false, message: "Please Provide Course ID" })
  }

  let total_amount = 0

  for (const course_id of course) {
    let course
    try {
      // Find the course by its ID
      course = await Course.findById(course_id)

      // If the course is not found, return an error
      if (!course) {
        return res
          .status(200)
          .json({ success: false, message: "Could not find the Course" })
      }

      // Check if the user is already enrolled in the course
      const uid = new mongoose.Types.ObjectId(userId)
      if (course.studentEnrolled.includes(uid)) {
        return res
          .status(200)
          .json({ success: false, message: "Student is already Enrolled" })
      }

      // Add the price of the course to the total amount
      total_amount += course.price
    } catch (error) {
      console.log(error)
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  const options = {
    amount: total_amount * 100,
    currency:"INR",
    receipt: Math.random(Date.now()).toString(),
  }

  try {
    // Initiate the payment using Razorpay
    const paymentResponse = await instance.orders.create(options)
    console.log(paymentResponse)
    res.json({
      success: true,
      data: paymentResponse,
    })
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ success: false, message: "Could not initiate order." })
  }
}


//verify signature of razorpay and server
// verify the payment
exports.verifyPayment = async (req, res) => {
  const razorpay_order_id = req.body?.razorpay_order_id
  const razorpay_payment_id = req.body?.razorpay_payment_id
  const razorpay_signature = req.body?.razorpay_signature
  const courses = req.body?.course 

  const userId = req.user.id
  console.log(razorpay_signature);
  

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !courses ||
    !userId
  ) {
    return res.status(200).json({ success: false, message: "Payment Failed" })
  }

  let body = razorpay_order_id + "|" + razorpay_payment_id

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECERET)
    .update(body.toString())
    .digest("hex")

  if (expectedSignature === razorpay_signature) {
    await enrollStudents(courses, userId, res)
    return res.status(200).json({ success: true, message: "Payment Verified" })
  }

  return res.status(200).json({ success: false, message: "Payment Failed" })
}

// Send Payment Success Email
exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount } = req.body

  const userId = req.user.id

  if (!orderId || !paymentId || !amount || !userId) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide all the details" })
  }

  try {
    const enrolledStudent = await User.findById(userId)

    await mailSender(
      enrolledStudent.email,
      `Payment Received`,
      paymentSuccessEmail(
        `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
        amount / 100,
        orderId,
        paymentId
      )
    )
  } catch (error) {
    console.log("error in sending mail", error)
    return res
      .status(400)
      .json({ success: false, message: "Could not send email" })
  }
}

// enroll the student in the courses
const enrollStudents = async (courses, userId, res) => {
  if (!courses || !userId) {
    return res
      .status(400)
      .json({ success: false, message: "Please Provide Course ID and User ID" })
  }

  for (const courseId of courses) {
    try {
      // Find the course and enroll the student in it
      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        { $push: { studentEnrolled: userId } },
        { new: true }
      )

      if (!enrolledCourse) {
        return res
          .status(500)
          .json({ success: false, error: "Course not found" })
      }
      console.log("Updated course: ", enrolledCourse)

      const courseProgress = await CourseProgress.create({
        courseID: courseId,
        userId: userId,
        completeVideo: [],
      })
      // Find the student and add the course to their list of enrolled courses
      const enrolledStudent = await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            courses: courseId,
            courseProgress: courseProgress._id,
          },
        },
        { new: true }
      )

      console.log("Enrolled student: ", enrolledStudent)
      // Send an email notification to the enrolled student
      const emailResponse = await mailSender(
        enrolledStudent.email,
        `Successfully Enrolled into ${enrolledCourse.courseName}`,
        courseEnrollmentEmail(
          enrolledCourse.courseName,
          `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
        )
      )

      console.log("Email sent successfully: ", emailResponse.response)
    } catch (error) {
      console.log(error)
      return res.status(400).json({ success: false, error: error.message })
    }
  }
}