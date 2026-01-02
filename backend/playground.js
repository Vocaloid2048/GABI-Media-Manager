const { generateThumbnail } = require("./middlewares/generateThumb");

function play(){
    generateThumbnail("Zion1_11_HD.mp4").then(()=>{
        console.log("Thumbnail generated successfully.");
    }).catch((err)=>{
        console.error("Error generating thumbnail:", err);
    });
}

play();