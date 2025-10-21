const mongoose = require("mongoose")

const courseProgressSchema = mongoose.Schema({
    courseID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Course"
       
    },
    completeVideo:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"SubSection",
        },
    ],
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    }
    
    
})
module.exports = mongoose.model("CourseProgress",courseProgressSchema);