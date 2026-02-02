const { uploadVideoFile } = require("./controllers/upload.controller");
const { generateColorTags } = require("./middlewares/generateColorTags");
const { generateDs } = require("./middlewares/generateDs");
const { generateThumbnail, generateThumbnailGroup } = require("./middlewares/generateThumb");
const { VideoDb, initDb } = require('./models');

require('dotenv').config();

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
        { file: { filename: "XXX.zip", "originalname": "XXX.zip" }, "body": { "videoInfo": { "group_title": "XXX", "group_desc": "XXX", "group_author": "XXX" } } },
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

// 輔助函式：印出帶顏色的色塊
function printColorBlock(rgbArray) {
    process.stdout.write(`\x1b[48;2;${rgbArray[0]};${rgbArray[1]};${rgbArray[2]}m  \x1b[0m ${rgbToHex(rgbArray)} `);
}

function rgbToHex(rgbArray) {
    return '#' + ((1 << 24) + (rgbArray[0] << 16) + (rgbArray[1] << 8) + rgbArray[2]).toString(16).slice(1).toUpperCase();
}

async function generateAndPrintColorTags() {
    try {
        const startTime = Date.now();
        const result = await generateColorTags("9b849765-4b41-44c7-9193-f6836b4958e7");

        console.log("Top 3 Color Tags:");
        result.forEach(colorRGB => {
            printColorBlock(colorRGB);
        });
        console.log(""); // 換行
        console.log("Original Result:", result);
        const endTime = Date.now();
        console.log(`Execution Time: ${(endTime - startTime) / 1000} seconds`);

    } catch (error) {
        console.error("Error generating color tags:", error);
    }
}

function generateDsTry() {
    const ds = generateDs(1);
    console.log("Generated ds:", ds);
}

async function generateColorTagsList() {
    console.log("Initializing DB and generating Video Group Color Tags List...");
    await initDb();

    try {
        const groups = await VideoDb.videoGroupData.findAll();
        console.log(`Found ${groups.length} video groups. Processing...`);
        console.log("---------------------------------------------------");
        // CSV Header
        console.log('"group_id","color_tags"');

        // Then read them one by one and generate color tags
        for (const group of groups) {
            try {
                // generateColorTags returns [[r,g,b], [r,g,b], ...]
                const colors = await generateColorTags(group.group_id);

                // Turn r,g,b arrays to hex strings for easier reading
                for (let i = 0; i < colors.length; i++) {
                    colors[i] = rgbToHex(colors[i]);
                }

                console.log(`${group.group_id}!${colors}`);
            } catch (err) {
                console.error(`Error processing group ${group.group_id}:`, err.message);
                // Print empty array in CSV on error
                console.log(`"${group.group_id}!"[]"`);
            }
        }
        console.log("---------------------------------------------------");
        console.log("Done generating list.");

    } catch (error) {
        console.error("Fatal error in generateColorTagsList:", error);
    }
}

// --- ProPresenter .pro 檔案解析測試 ---
async function testReadProFile() {
    const { extractSongDataFromJSON, extractSongData } = require('./utils/readProFile');
    const fs = require('fs');
    const path = require('path');

    // 測試檔案路徑
    const jsonFilePath = path.join(__dirname, './Test/天天歌唱.pro');
    if (!fs.existsSync(jsonFilePath)) {
        console.error('找不到測試檔案:', jsonFilePath);
        return;
    }

    try {
        const songData = await extractSongData(jsonFilePath);
        console.log('解析結果:', JSON.stringify(songData, null, 2));
    } catch (err) {
        console.error('解析失敗:', err);
    }
}

(async () => {
    const uploadSongPayloads = [
        { "song_name": "Shekinah 榮耀", "song_copyright": { "composer": "Jaye Thomas, Laura Hackett, Caleb Culver, Seth Yates Gory Ashbury, James Wells, James David Whitworth", "lyricist": "（中譯）IHOP中文事工", "arranger": "Jaye Thomas, Laura Hackett, Caleb Culver, Seth Yates Gory Ashbury, James Wells, James David Whitworth", "album": "大衛帳幕的榮耀專輯 - 恢復榮耀 Restoration", "publisher": "約書亞樂團 Joshua Band", "year": "2011" }, "song_tags": "3,7", "song_language": "Mandarin", "hasTitlePage": true, "song_ytlink": "https://www.youtube.com/watch?v=S92yl-4TyoA" },
        { "song_name": "天天歌唱", "song_copyright": { "composer": "黎雅詩", "lyricist": "甄燕鳴", "arranger": "黎雅詩", "album": "角聲使團敬拜讚美專輯06：生命陶匠", "publisher": "角聲使團 The Heralders", "year": "2004" }, "song_tags": "2", "song_language": "Cantonese", "hasTitlePage": true, "song_ytlink": "https://youtu.be/5FkP0_GDJNU" },
        { "song_name": "渴慕祢", "song_copyright": { "composer": "周敏曦", "lyricist": "周敏曦", "album": "頌恩旋律《詩中之詩》  ", "publisher": "頌恩旋律 Grace Melodia", "year": "2004" }, "song_tags": "2,3", "song_language": "Cantonese", "hasTitlePage": true, "song_ytlink": "https://www.youtube.com/watch?v=a4lTGK6p2Qo" },
        { "song_name": "一千次頌讚", "song_copyright": { "composer": "Michael Luk", "lyricist": "水水", "arranger": "Michael Luk, Frankie Yip", "publisher": "Promist", "year": "2020" }, "song_tags": "3", "song_language": "Cantonese", "hasTitlePage": true, "song_ytlink": "https://www.youtube.com/watch?v=k-zYeURhpPc" },
        { "song_name": "一生的恩惠", "song_copyright": { "composer": "李漫渟", "lyricist": "李漫渟", "arranger": "朱肇階", "publisher": "原始和聲 Raw Harmony", "year": "2022" }, "song_tags": "3", "song_language": "Cantonese", "hasTitlePage": true, "song_ytlink": "https://youtu.be/W5VRtNyn-j8?si=RbHgbwHCy0egr40A" },
        { "song_name": "一首讚美的詩歌", "song_copyright": { "composer": "朱浩權", "lyricist": "朱浩權", "album": "沙浸-無言的讚頌", "publisher": "沙田浸信會", "year": "1990" }, "song_tags": "3", "song_language": "Cantonese", "hasTitlePage": true, "song_ytlink": "https://www.youtube.com/watch?v=b2ikeCRKTwQ" },
        { "song_name": "世界變", "song_copyright": { "composer": "西伯", "lyricist": "西伯", "arranger": "西伯", "album": "西伯作品 6", "publisher": "共享詩歌協會", "year": "2009" }, "song_tags": "2", "song_language": "Cantonese", "hasTitlePage": true, "song_ytlink": "https://youtu.be/vovuxAPkaa4?si=jN-F968xhXd3-V6v" },
        { "song_name": "主你降臨", "song_copyright": { "composer": "Tim Hughes", "lyricist": "（粵譯）楊李靜儀師母", "arranger": "Tim Hughes", "year": "2018" }, "song_tags": "3", "song_language": "Cantonese", "hasTitlePage": true, "song_ytlink": "https://www.youtube.com/watch?v=bxxzwor1oFs" },
        { "song_name": "主我高舉你的名", "song_copyright": { "composer": "Rick Founds", "lyricist": "（粵譯）劉燕玲" }, "song_tags": "3", "song_language": "Cantonese", "hasTitlePage": true, "song_ytlink": "https://www.youtube.com/watch?v=BrPsNHsamaE" },
        { "song_name": "主的喜樂是我力量", "song_copyright": { "composer": "曾祥怡", "lyricist": "曾祥怡", "album": "讚美之泉09-深觸我心", "publisher": "讚美之泉 Stream Of Praise Music Ministries", "year": "2004" }, "song_tags": "2", "song_language": "Cantonese", "hasTitlePage": true, "song_ytlink": "https://www.youtube.com/watch?v=MEHMGqHh9ZY" },
        { "song_name": "主祢照亮了一切", "song_copyright": { "composer": "長澤崇史", "lyricist": "（粵譯）Sabina Lau、森沢優、蘇梓安 Andy", "publisher": "Son Music 新音樂敬拜創作", "year": "2024" }, "song_tags": "3", "song_language": "Cantonese", "hasTitlePage": true, "song_ytlink": "https://www.youtube.com/watch?v=LO9TzWjwomE" },
        { "song_name": "亂世中的禱告", "song_copyright": { "composer": "Brenda Li", "lyricist": "Brenda Li", "arranger": "Carlos Choi, Jad Bantug", "publisher": "Son Music 新音樂敬拜創作", "year": "2020" }, "song_tags": "2,4", "song_language": "Cantonese", "hasTitlePage": true, "song_ytlink": "https://www.youtube.com/watch?v=QVdfU6sueMI" },
        { "song_name": "以愛還愛", "song_copyright": { "composer": "何維健", "lyricist": "盧淑儀", "arranger": "王建威", "album": "愛在軟弱中盛放", "publisher": "撒種音樂事工", "year": "2007" }, "song_tags": "3", "song_language": "Cantonese", "hasTitlePage": true, "song_ytlink": "https://youtu.be/gkpt82jLIi0?si=bdFIWUM0ELQtW-xh" },
        { "song_name": "以賽亞書 60", "song_copyright": { "composer": "李漫渟", "lyricist": "李漫渟", "publisher": "原始和聲 Raw Harmony", "year": "2022" }, "song_tags": "3", "song_language": "Cantonese", "hasTitlePage": true, "song_ytlink": "https://www.youtube.com/watch?v=NwFoqiz7S9Y" },
        { "song_name": "住在你裡面", "song_copyright": { "composer": "曾祥怡", "lyricist": "曾祥怡", "album": "讚美之泉16-相信有愛就有奇蹟  ", "publisher": "讚美之泉 Stream Of Praise Music Ministries", "year": "2011" }, "song_tags": "3,2", "song_language": "Mandarin", "hasTitlePage": true, "song_ytlink": "https://www.youtube.com/watch?v=IKGazOdWmH4" },
        { "song_name": "何等恩典", "song_copyright": { "composer": "謝秉哲", "lyricist": "鄭懋柔", "album": "讚美之泉14-不要放棄．滿有能力", "publisher": "讚美之泉 Stream Of Praise Music Ministries", "year": "2009" }, "song_tags": "3", "song_language": "Mandarin", "hasTitlePage": true, "song_ytlink": "https://www.youtube.com/watch?v=u2M-zzt1Whc" },
        { "song_name": "保守我心", "song_copyright": { "composer": "朱肇階", "lyricist": "朱肇階", "publisher": "原始和聲 Raw Harmony", "year": "2019" }, "song_tags": "3", "song_language": "Cantonese", "hasTitlePage": true, "song_ytlink": "https://www.youtube.com/watch?v=RHXlDJ7d4IQ" },
        { "song_name": "全心委身", "song_copyright": { "composer": "Reuben Morgan", "lyricist": "（粵譯）楊詠恩牧師" }, "song_tags": "2", "song_language": "Cantonese", "hasTitlePage": true, "song_ytlink": "https://www.youtube.com/watch?v=9BE5geraVYw" },
        { "song_name": "全然為祢", "song_copyright": { "composer": "施弘美, Tiffany Wang", "lyricist": "施弘美, Tiffany Wang", "album": "生命河敬拜讚美系列3-釋放屬天的能力", "publisher": "矽谷生命河靈糧堂" }, "song_tags": "3", "song_language": "Mandarin", "hasTitlePage": true, "song_ytlink": "https://www.youtube.com/watch?v=SEJFmdAGa9E" },
        { "song_name": "同頌慶主恩典", "song_copyright": { "composer": "Dave Bankhead, Trish Morgan", "lyricist": "（粵譯）楊詠恩牧師" }, "song_tags": "3", "song_language": "Cantonese", "hasTitlePage": true, "song_ytlink": "https://www.youtube.com/watch?v=8vdTzMCo2k0&list=RD8vdTzMCo2k0&start_radio=1" },
        { "song_name": "君王就在這裡", "song_copyright": { "composer": "曾祥怡", "lyricist": "曾祥怡", "album": "讚美之泉敬22-從早晨到夜晚", "publisher": "讚美之泉 Stream Of Praise Music Ministries", "year": "2017" }, "song_tags": "2", "song_language": "Mandarin", "hasTitlePage": true, "song_ytlink": "https://youtu.be/fdM3T-a5OvM?si=V8WKEmeWl3i6XKIY" },
        { "song_name": "喜樂泉源", "song_copyright": { "composer": "余盈盈", "lyricist": "余盈盈", "album": "讚美之泉敬13-沙漠中的讚美", "publisher": "讚美之泉 Stream Of Praise Music Ministries", "year": "2008" }, "song_tags": "2", "song_language": "Mandarin", "hasTitlePage": true, "song_ytlink": "https://www.youtube.com/watch?v=iCY_YB1jouY" },
        { "song_name": "回到愛祢的最初", "song_copyright": { "composer": "方文聰", "lyricist": "方文聰", "publisher": "玻璃海樂團", "year": "2025" }, "song_tags": "3", "song_language": "Cantonese", "hasTitlePage": true, "song_ytlink": "https://www.youtube.com/watch?v=wZV2H5x3lS8" }
    ]
    try {
        // 允許自簽名憑證（開發環境用）
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

        for (const payload of uploadSongPayloads) {
            // 讀取檔案內容為 base64
            const filePath = path.join(`/Folder/${payload.song_name}.pro`);
            const fileContent = fs.readFileSync(filePath).toString('base64');

            const userId = 1;
            const ds = generateDs(userId);

            if (!ds) {
                alert(locale('auth.ds_generation_failed'));
                setUploading(false);
                return;
            }

            const payloadWithFile = { ...payload, file: fileContent };
            const response = await fetch(`https://localhost:3000/api/song/upload?user_id=${(userId)}&ds=${encodeURIComponent(ds)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payloadWithFile)
            });

            const data = await response.json();
            if (data.retcode === 1) {
                console.log('上傳成功:', payload.song_name);
            }
        }
    } catch (error) {
        console.error('上傳歌曲失敗:', error);
    }
})();