const { default: mongoose } = require("mongoose")

require("dotenv").config();

exports.connect = async()=> {
    await mongoose.connect(process.env.MANGODB_URL,{
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() =>{ console.log("DB connection successfully");
    })
    .catch((error) => {
        console.log("DB connection failed");
        console.log(error);
        process.exit(1);
        
        
    })
}