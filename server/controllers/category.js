const Catagory = require("../models/Catagory")
const Course = require("../models/Course")
function getRandomInt(max) {
    return Math.floor(Math.random() * max)
  }
//create catagory ka handler function
exports.createCategory = async(req,res) =>{
    try {
        //fetch data
        const{name,description} = req.body;

        //validation
        if (!name || !description) {
            return res.status(401).json({
            success:false,
            message:"All field required",
        })
        }

        //create entry in db
        const catagoryDetails = await Catagory.create({name:name,description:description})
        console.log(catagoryDetails);

        //return responce
        return res.status(200).json({
            success:true,
            message:"Category created successfully",
        })
        
        
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
        
    }
}

//getAllTags handler function

exports.showAllCategory = async(req,res) =>{
    
    
    try {
        const allCatagory = await Catagory.find({});

        return res.status(200).json({
            success:true,
            message:"all tags return successfully",
            data:allCatagory,
        })
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
        
    }
}

//catagory page details categoryPageDetails
exports.categoryPageDetails = async (req, res) => {
    try {
      const { categoryId } = req.body
      console.log("PRINTING CATEGORY ID: ", categoryId);
      // Get courses for the specified category
      const selectedCategory = await Catagory.findById(categoryId)
        .populate({
          path: "course",
          match: { status: "Published" },
          populate: "ratingAndReviews",
        })
        .exec()
  
      //console.log("SELECTED COURSE", selectedCategory)
      // Handle the case when the category is not found
      if (!selectedCategory) {
        console.log("Category not found.")
        return res
          .status(404)
          .json({ success: false, message: "Category not found" })
      }
      // Handle the case when there are no courses
      if (selectedCategory.course.length === 0) {
        console.log("No courses found for the selected category.")
        return res.status(404).json({
          success: false,
          message: "No courses found for the selected category.",
        })
      }
  
      // Get courses for other categories
      const categoriesExceptSelected = await Catagory.find({
        _id: { $ne: categoryId },
      })
      let differentCategory = await Catagory.findOne(
        categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]
          ._id
      )
        .populate({
          path: "course",
          match: { status: "Published" },
        })
        .exec()
        //console.log("Different COURSE", differentCategory)
      // Get top-selling courses across all categories
      const allCategories = await Catagory.find()
        .populate({
          path: "course",
          match: { status: "Published" },
          populate: {
            path: "instructor",
        },
        })
        .exec()
      const allCourses = allCategories.flatMap((category) => category.course)
      const mostSellingCourses = allCourses
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 10)
       // console.log("mostSellingCourses COURSE", mostSellingCourses)
      res.status(200).json({
        success: true,
        data: {
          selectedCategory,
          differentCategory,
          mostSellingCourses,
        },
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
  }