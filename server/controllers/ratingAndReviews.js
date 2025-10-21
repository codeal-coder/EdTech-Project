const ratingAndReviews = require("../models/RatingAndReviews");
const Course = require("../models/Course");
const { default: mongoose } = require("mongoose");

//create ratingAndReviews
exports.createRating = async(req,res) =>{
    try {
        //data fetch - user id , 
        const userId = req.user.id;
        const {rating , review,courseId} = req.body;
        console.log("crete ratng ",rating,review,courseId);
        

        //check if student is enrollred or not
        const courseDetails = await Course.findOne(
                                    {_id:courseId},
                                    {
                                        studentEnrolled: {$elemMatch:{$eq:userId}}
                                    },
                                );
        if (!courseDetails) {
            return res.status(404).json({
                success:false,
                message:"Student is enrllred in tis course",
            })
        }

        //check if user already review the courses
        const alreadyReviewed = await ratingAndReviews.findOne(
                                            {
                                                user:userId,
                                                course:courseId,
                                            }
        );
        if(alreadyReviewed){
            return res.status(404).json({
                success:false,
                message:"course is already reviewed for this course",
            })
        }

        //create the rating and reviews 
        const createratingAndReviews = await ratingAndReviews.create({
                                                                    rating:rating,
                                                                    reviews:review,
                                                                    course:courseId,
                                                                    user:userId,
                                                                    }
        )
        //update the course and add rating and reviews
        console.log("rating and reviews 51 in create: ",createratingAndReviews);
        
        const updateCourseDetails = await Course.findByIdAndUpdate({_id:courseId},
            {
            $push:
                {
                    ratingAndReviews:createratingAndReviews._id
                }
            },
            {new:true});
            console.log("updateCourseDetails :",updateCourseDetails);
            
        //return responce    
        return res.status(200).json({
                success:true,
                message:"successfully rated and reviews this course",
                data:createratingAndReviews,
            })   
    } catch (error) {
        return res.status(500).json({
                success:false,
                message:error.message,
            })
        
    }
}

//Avg rating
exports.getAvgRating = async(req,res) =>{
    try {
        //get Course Id
        const courseId = req.body.courseId;

        //calculate avg rating
        const result = await ratingAndReviews.aggregate([
                    {
                        $match:{
                            course:new mongoose.Types.ObjectId(String(courseId)),
                        }
                    },
                    {
                        $group:{
                            _id:null,
                            averageRating:{$avg:"$rating"},
                        }
                    }
        ]);

        //return rating
        if (result.length >0 ) {
            return res.status(200).json({
                success:true,
                message:"",
                averageRating:result[0].averageRating,
            })
        }

        //responce
        //if no rating reviews exist
        return res.status(200).json({
                success:true,
                message:"averge rating is 0, no rating given till now",
                averageRating:0,
            })
        
        

    } catch (error) {
        console.log(error);
        
        return res.status(500).json({
                success:false,
                message:error.message,
            })
    }
}

//getAllRatingAndReviews

exports.getAllRating = async(req,res) =>{
    try {
        const allRewiews = await ratingAndReviews.find({})
                        .sort({rating:"desc"})
                        .populate(
                            {
                                path:"user",
                                select:"firstName lastName email image"
                            }
                        )
                        .populate({
                            path:"course",
                            select:"courseName",
                        })
                        .exec();
        return res.status(200).json({
            success:true,
            message:"All reviews fetched successfully",
            data:allRewiews,
        });

        
    } catch (error) {
        console.log(error);
        
        return res.status(500).json({
                success:false,
                message:error.message,
        })
    
        
    }
}
