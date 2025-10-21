const mongoose = require("mongoose")

const courseSchema = mongoose.Schema({
    
    courseName:{
        type:String,
        required:true,
        trim:true,
    },
    courseDescription:{
        type:String,
        required:true,
    },
    instructor:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    whatYouWillLearn:{
        type:String,
    },
    courseContent:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Section",
        }
    ],
    ratingAndReviews:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"RatingAndReviews",
        }
    ],
    price:{
        type:String,
    },
    thumbnail:{
        type:String,
    },
    tag:{
        type:[String],
        required:true,
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Category",
    },
    studentEnrolled:[{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User",
        
    }],
    instruction:{
        type:[String],
    },
    status:{
        type:String,
        enum:["Draft","Published"]
    },
    createdAt:{
        type:Date,
        default:Date.now,
    }

    
    
})
module.exports = mongoose.model("Course",courseSchema);