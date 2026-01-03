const { uploadVideoFile } = require("./controllers/upload.controller");
const { generateThumbnail, generateThumbnailGroup } = require("./middlewares/generateThumb");

const fs = require('fs');
const path = require('path');

function play1() {
    generateThumbnail("Zion1_11_HD.mp4").then(() => {
        console.log("Thumbnail generated successfully.");
    }).catch((err) => {
        console.error("Error generating thumbnail:", err);
    });
}

function play2() {
    generateThumbnailGroup(1).then(() => {
        console.log("Group thumbnail generated successfully.");
    }).catch((err) => {
        console.error("Error generating group thumbnail:", err);
    });
}

function tempDataGenerate() {
    const dataPair = [
        { file: { path: "XXX", filename: "XXX.zip", "originalname": "XXX.zip" }, "body": { "videoInfo": { "group_title": "XXX", "group_desc": "XXX", "group_author": "XXX" } } },
    ]
    const res = {
        status: function (code) {
            return {
                json: function (data) {
                    console.log(`Response Code: ${code}, Data:`, data);
                }
            };
        }
    };

    dataPair.forEach(async (req) => {
        try {
            // Copy the file to TEMP_DIR
            const tempDir = process.env.TEMP_DIR;
            const sourcePath = path.join(req.file.path, req.file.filename);
            const destPath = path.join(tempDir, req.file.filename);

            fs.copyFileSync(sourcePath, destPath);
            req.file.path = destPath;

            req.query = { user_id: 1 };
            await uploadVideoFile(req, res);
            console.log(`Processed file: ${req.file.filename}`);
        } catch (error) {
            console.error(`Error processing file ${req.file.filename}:`, error);
        }
    });
}

tempDataGenerate();
