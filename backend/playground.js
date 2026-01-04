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

async function tempDataGenerate() {
    const dataPair = [
        { file: { filename: "XXX.zip", "originalname": "XXX.zip" }, "body": { "videoInfo": "{\"group_title\":\"XXX\", \"group_desc\": \"XXX\", \"group_author\": \"XXX\"}" } },
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

    const limit = 3; // Concurrency limit
    const executing = [];

    for (const req of dataPair) {
        const p = (async () => {
            try {
                // Copy the file to TEMP_DIR
                const tempDir = process.env.TEMP_DIR || 'Test/Temp';
                const sourcePath = path.join(req.file.path, req.file.filename);
                const destPath = path.join(tempDir, req.file.filename);

                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                fs.copyFileSync(sourcePath, destPath);
                req.get = function (header) { };
                req.file.path = destPath;

                req.query = { user_id: 1 };
                await uploadVideoFile(req, res);
                console.log(`Processed file: ${req.file.filename}`);
            } catch (error) {
                console.error(`Error processing file ${req.file.filename}:`, error);
            }
        })();

        const e = p.then(() => executing.splice(executing.indexOf(e), 1));
        executing.push(e);
        if (executing.length >= limit) {
            await Promise.race(executing);
        }
    }
    await Promise.all(executing);
}

tempDataGenerate();
