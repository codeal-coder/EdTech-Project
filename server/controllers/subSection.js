const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const{uploaderToCloudinary} = require("../utilis/imageUploader");
//create a subsection

exports.createSubsection = async(req,res) =>{
    try {
        //ftech data
        const{title,description,sectionId} = req.body;

        //fetch file for video
        const video = req.files.video;
        // console.log("video ",video);
        // console.log("title ",title);
        // console.log("desc ",description);
        // console.log("section id ",sectionId);
        
        
        
        

        //validation
        if (!title || !description  ||!video || !sectionId) {
            return  res.status(401).json({
                success:false,
                message:"missing Properties"
            })
            
        }
        //upload video to  cloudainary
        const uploadVideo = await uploaderToCloudinary(video,process.env.FOLDER_NAME);

        //create a subSection
        const subSectionDetails = await SubSection.create({
            title:title,
            timeDuration:`${uploadVideo.duration}`,
            description:description,
            videoUrl:uploadVideo.secure_url,
        })
        //console.log("subsection: ",subSection);
        
        //update section with this subsection objectId
        const updatedSection = await Section.findByIdAndUpdate(sectionId,
                                        {
                                            $push:{
                                                subSection:subSectionDetails._id
                                            }
                                        },
                                        {new:true}
        ).populate("subSection").exec();


        console.log("updated Section:",updatedSection);
        
        //responce
        return res.status(200).json({
            success:true,
            message:"subSection created successfully",
            data:updatedSection,
        })
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            success:false,
            message:"unable to create a subSection",
            error:error,
        })
        
    }
}

//update sub Section

exports.updateSubsection = async(req,res) =>{
    try {
        const { sectionId, subSectionId, title, description } = req.body
        const subSection = await SubSection.findById(subSectionId)

        if (!subSection) {
            return res.status(404).json({
                success: false,
                message: "SubSection not found",
            })
        }

        if (title !== undefined) {
            subSection.title = title
        }

        if (description !== undefined) {
            subSection.description = description
        }
        if (req.files && req.files.video !== undefined) {
            const video = req.files.video
            const uploadDetails = await uploaderToCloudinary(
                video,
                process.env.FOLDER_NAME
            )
            subSection.videoUrl = uploadDetails.secure_url
            subSection.timeDuration = `${uploadDetails.duration}`
        }

        await subSection.save()

        // find updated section and return it
        const updatedSection = await Section.findById(sectionId).populate(
            "subSection"
        )

        console.log("updated section", updatedSection)

        return res.json({
            success: true,
            message: "Section updated successfully",
            data: updatedSection,
        })

    } catch (error) {
            console.error(error)
            return res.status(500).json({
            success: false,
            message: "An error occurred while updating the section",
        })
  }
}
//delete sub Section

exports.deleteSubSection = async(req,res) =>{
   try {
    const { subSectionId, sectionId } = req.body
    await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $pull: {
          subSection: subSectionId,
        },
      }
    )
    const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })

    if (!subSection) {
      return res
        .status(404)
        .json({ success: false, message: "SubSection not found" })
    }

    // find updated section and return it
    const updatedSection = await Section.findById(sectionId).populate(
      "subSection"
    )

    return res.json({
      success: true,
      message: "SubSection deleted successfully",
      data: updatedSection,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the SubSection",
    })
  }
}