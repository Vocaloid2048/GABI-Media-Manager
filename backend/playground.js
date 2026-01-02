const { generateThumbnail, generateThumbnailGroup } = require("./middlewares/generateThumb");

function play1(){
    generateThumbnail("Zion1_11_HD.mp4").then(()=>{
        console.log("Thumbnail generated successfully.");
    }).catch((err)=>{
        console.error("Error generating thumbnail:", err);
    });
}

function play2(){
    generateThumbnailGroup(1).then(() => {
        console.log("Group thumbnail generated successfully.");
    }).catch((err) => {
        console.error("Error generating group thumbnail:", err);
    });
}

play2();