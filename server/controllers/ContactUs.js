
const { contactUsEmail } = require("../mail/templates/contactFormRes");
const mailSender = require("../utilis/mailSender");

exports.contactUsController = async (req, res) => {
  const { email, firstname, lastname, message, phoneNo, countrycode } = req.body
  console.log(req.body)
  try {

    //email to user
    const emailRes = await mailSender(
      email,
      "Your Data send successfully",
      contactUsEmail(email, firstname, lastname, message, phoneNo, countrycode)
    )
    console.log("Email Res ", emailRes)
    

    //mail to admin
    const emailResponce = await mailSender(
            process.env.MAIL_USER,
            `new Contact Message from ${email}`,
            `You received a new message from
            ${firstname} ${lastname}
            email: ${email}
            phone no: ${phoneNo}
            message: ${message}`
    );

    return res.json({
      success: true,
      message: "Email send successfully",
      userEmail:emailRes,
      adminEmail:emailResponce,
    })
  } catch (error) {
    console.log("Error", error)
    console.log("Error message :", error.message)
    return res.json({
      success: false,
      message: "Something went wrong...",
    })
  }
}