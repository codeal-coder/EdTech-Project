const Section = require("../models/Section");
const Course = require("../models/Course");
const SubSection = require("../models/SubSection");
exports.createSection = async(req,res)=>{
    try {
        //data fetch
        const{sectionName,courseId} = req.body;

        //data validation
        if (!sectionName || !courseId) {
            return res.status(401).json({
                success:false,
                message:"fill All required section"
            })
        }
        //create section
        const newSection = await Section.create({sectionName});

        //update in course with section objectId
        const updatedCourse = await Course.findByIdAndUpdate(
                                                    courseId,
                                                    {
                                                        $push:{
                                                            courseContent:newSection._id,
                                                        },
                                                    },
                                                    {new:true},
        ).populate({
				path: "courseContent",
				populate: {
					path: "subSection",
				},
			})
			.exec();

        //responce
        return res.status(200).json({
                success:true,
                message:" section created",
                updatedCourse,
            })

    } catch (error) {
        console.log(error);
        
        return res.status(401).json({
                success:false,
                message:"error in  section creation"
            })
        
    }
}

//update section
exports.updateSection = async(req,res) =>{
    try {
        //fetch data
        const{sectionName,sectionId,courseId} = req.body;

        //data validation
        if (!sectionName || !sectionId || !courseId) {
            return res.status(401).json({
                success:false,
                message:"fill All required section"
            })
        }

        //update data
        const section  = await Section.findByIdAndUpdate(sectionId,{sectionName},{new:true});
        const course = await Course.findById(courseId)
		.populate({
			path:"courseContent",
			populate:{
				path:"subSection",
			},
		})
		.exec();


        //responce
        return res.status(200).json({
                success:true,
                message:" section updated",
                data:course,
            })

        
    } catch (error) {
        console.log(error);
        
        return res.status(401).json({
                success:false,
                message:"unable to update , please try again"
            })
        
    }
}

//delete section

exports.deleteSection = async (req, res) => {
	try {

		const { sectionId, courseId }  = req.body;
		await Course.findByIdAndUpdate(courseId, {
			$pull: {
				courseContent: sectionId,
			}
		})
		const section = await Section.findById(sectionId);
		console.log(sectionId, courseId);
		if(!section) {
			return res.status(404).json({
				success:false,
				message:"Section not Found",
			})
		}

		//delete sub section
		await SubSection.deleteMany({_id: {$in: section.subSection}});

		await Section.findByIdAndDelete(sectionId);

		//find the updated course and return 
		const course = await Course.findById(courseId).populate({
			path:"courseContent",
			populate: {
				path: "subSection"
			}
		})
		.exec();

		res.status(200).json({
			success:true,
			message:"Section deleted",
			data:course
		});
	} catch (error) {
		console.error("Error deleting section:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};   