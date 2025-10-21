const Course = require("../models/Course");
const Section =  require("../models/Section");
const SubSection = require("../models/SubSection");
const Catagory = require("../models/Catagory");
const User = require("../models/User");
const CourseProgress = require("../models/CourseProgress");
const {uploaderToCloudinary} = require("../utilis/imageUploader");
const {convertSecondsToDuration} = require("../utilis/secToDuration");


//create course handler function
exports.createCourse = async(req,res) =>{
    try {
        //fetch data
        let{courseName,courseDescription,whatYouWillLearn,price,category,tag:_tag,instruction:_instructions,status} = req.body;

        //get thumbNail
        const thumbnail = req.files.thumbnailImage;
        console.log("Files ",thumbnail );
       
        
        
        
        

        // Convert the tag and instructions from stringified Array to Array
        const tag = JSON.parse(_tag)
        const instruction = JSON.parse(_instructions)

        // console.log("tag", tag)
        // console.log("instructions", instruction)
        // console.log("1",courseDescription);
        // console.log("2",courseName);
        // console.log("3",price);
        // console.log("4",whatYouWillLearn);
        // console.log("5",category);
        // console.log(thumbnail);
        // console.log(tag.length);
        // console.log(instruction.length);
                
        
        
        

        //validation
        if (!courseName || !courseDescription ||!price ||!whatYouWillLearn ||!category || !thumbnail || !tag.length || !instruction.length) {
            return res.status(401).json({
                success:false,
                message:"All filed required",
            })

        }

        if (!status || status === undefined) {
            status = "Draft"
        }

        //check for instuctor
        const userId = req.user.id;

        const insrtuctorDetails = await User.findById(userId,{accountType:"Instructor"});
        console.log("Instructor details" , insrtuctorDetails);

        if (!insrtuctorDetails) {
            return res.status(401).json({
                success:false,
                message:"Instructor details not found",
            })
        }

        //check given tag is valid or not
        const catagoryDetails = await Catagory.findById(category);
        if (!catagoryDetails) {
            return res.status(401).json({
                success:false,
                message:"category  details not found",
            })
            
        }

        // upload image to cloudinary
        console.log("course 65 ",thumbnail);
        
        const thumbnailImage = await uploaderToCloudinary(thumbnail,process.env.FOLDER_NAME);
        console.log("course thumbnail image ",thumbnailImage);

        //create an entry for new course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor:insrtuctorDetails._id,
            whatYouWillLearn,
            price,
            tag,
            category:catagoryDetails._id,
            thumbnail:thumbnailImage.secure_url,
            instruction,
            status:status,
        })

        //add the new course to the  user schema of instructor
        await User.findByIdAndUpdate(
            {_id:insrtuctorDetails._id},
            {
                $push:{
                    courses:newCourse._id,
                }
            },
            {new:true},
        )

        //TODO: update the category Schema
        await Catagory.findByIdAndUpdate(
            {_id:category},
            {
                $push:{
                   
                   course:newCourse._id,
                }
            },
            {new:true},
        )

        //return responce
        return res.status(200).json({
            success:true,
            message:"course created successfully",
            data:newCourse,
        })

        
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"course creation unsuccessfully",
        })

        
    }
}

//getAllCourse handler function

exports.showAllCourse = async(req,res) =>{
    try {
        await Course.find({},{
            courseName:true,
            price:true,
            thumbnail:true,
            studentEnrolled:true,
            instructor:true,
            ratingAndReviews:true,
            studentEnrolled:true,

        }).populate("instructor")
        .exec();



        
        return res.status(200).json({
            success:true,
            message:"data for course fetch successfully",
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"cannot fetch course data",
            error:error,
        })
    }
}


//course entire details
exports.getCourseDetails = async(req,res)=>{
    try {
        //find Course Id
        const {courseId} = req.body;
        console.log(courseId);
        

        //find Course details
        const courseDetails = await Course.findOne({_id:courseId})
                        .populate(
                            {
                                path:"instructor",
                                populate:{
                                    path:"additionalDetails",
                                },
                            },
                        )
                        .populate("category")
                        //.populate("ratingAndReviews")
                        .populate(
                            {
                                path:"courseContent",
                                populate:{                                
                                    path:"subSection",
                                },
                            },
                        )
                        .exec();

        //validation
        if (!courseDetails) {
            return res.status(401).json({
                success:false,
                message:"could not find the course with course id"
            })
        }
        //total duration of course

        let totalDurationInSeconds = 0;
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration)
                totalDurationInSeconds += timeDurationInSeconds
            })
        })
        //console.log(totalDurationInSeconds);
        
        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)
        //console.log(totalDuration);
        
        //return responce
        return res.status(200).json({
                success:true,
                message:"Course Details fetch successfully",
                data:{courseDetails,
                  totalDuration
                },
                
            })
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
                success:false,
                message:error.message,
            })
        
    }
}

// Edit Course Details
exports.editCourse = async (req, res) => {
  try {
    const { courseId } = req.body
    const updates = {...req.body}
    const course = await Course.findById(courseId)
    console.log("update: ",updates);
    

    if (!course) {
      return res.status(404).json({ error: "Course not found" })
    }

    // If Thumbnail Image is found, update it
    if (req.files) {
      console.log("thumbnail update")
      const thumbnail = req.files.thumbnailImage
      const thumbnailImage = await uploaderToCloudinary(
        thumbnail,
        process.env.FOLDER_NAME
      )
      course.thumbnail = thumbnailImage.secure_url
    }

    // Update only the fields that are present in the request body
    for (const key in updates) {
      if (updates.hasOwnProperty(key)) {
        if (key === "tag" || key === "instructions") {
          course[key] = JSON.parse(updates[key])
        } else {
          course[key] = updates[key]
        }
      }
    }

    await course.save()

    const updatedCourse = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec()

    res.json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}


// Get a list of Course for a given Instructor
exports.getInstructorCourses = async (req, res) => {
  try {
    // Get the instructor ID from the authenticated user or request body
    const instructorId = req.user.id

    // Find all courses belonging to the instructor
    const instructorCourses = await Course.find({
      instructor: instructorId,
    }).sort({ createdAt: -1 })

    // Return the instructor's courses
    res.status(200).json({
      success: true,
      data: instructorCourses,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: "Failed to retrieve instructor courses",
      error: error.message,
    })
  }
}



// Delete the Course
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.body

    // Find the course
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Unenroll students from the course
    const studentsEnrolled = course.studentEnrolled
    for (const studentId of studentsEnrolled) {
      await User.findByIdAndUpdate(studentId, {
        $pull: { courses: courseId },
      })
    }

    // Delete sections and sub-sections
    const courseSections = course.courseContent
    for (const sectionId of courseSections) {
      // Delete sub-sections of the section
      const section = await Section.findById(sectionId)
      if (section) {
        const subSections = section.subSection
        for (const subSectionId of subSections) {
          await SubSection.findByIdAndDelete(subSectionId)
        }
      }

      // Delete the section
      await Section.findByIdAndDelete(sectionId)
    }

    // Delete the course
    await Course.findByIdAndDelete(courseId)

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// Get Course List
exports.getAllCourses = async (req, res) => {
  try {
    const allCourses = await Course.find(
      { status: "Published" },
      {
        courseName: true,
        price: true,
        thumbnail: true,
        instructor: true,
        ratingAndReviews: true,
        studentsEnrolled: true,
      }
    )
      .populate("instructor")
      .exec()

    return res.status(200).json({
      success: true,
      data: allCourses,
    })
  } catch (error) {
    console.log(error)
    return res.status(404).json({
      success: false,
      message: `Can't Fetch Course Data`,
      error: error.message,
    })
  }
}

exports.getFullCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body
    const userId = req.user.id
    const courseDetails = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec()

    let courseProgressCount = await CourseProgress.findOne({
      courseID: courseId,
      userId: userId,
    })

    console.log("courseProgressCount : ", courseProgressCount)

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      })
    }

    // if (courseDetails.status === "Draft") {
    //   return res.status(403).json({
    //     success: false,
    //     message: `Accessing a draft course is forbidden`,
    //   });
    // }

    let totalDurationInSeconds = 0
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration)
        totalDurationInSeconds += timeDurationInSeconds
      })
    })

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
        completedVideos: courseProgressCount?.completedVideos
          ? courseProgressCount?.completedVideos
          : [],
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}