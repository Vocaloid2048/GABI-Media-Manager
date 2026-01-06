const fs = require('fs');
const db = require('../models');
const path = require('path');
const sharp = require('sharp');

// 擴展的 64 色顏色定義
const COLOR_MAP = {
    // --- 黑色/灰色/白色系 ---
    '黑色': [0, 0, 0],
    '深灰色': [105, 105, 105],
    '灰色': [128, 128, 128],
    '銀色': [192, 192, 192],
    '淺灰色': [211, 211, 211],
    '白色': [255, 255, 255],
    '石板灰': [112, 128, 144],
    '暗石板灰': [47, 79, 79],

    // --- 紅色系 ---
    '栗色': [128, 0, 0],
    '深紅色': [139, 0, 0],
    '紅色': [255, 0, 0],
    '磚紅色': [178, 34, 34],
    '猩紅': [220, 20, 60],
    '番茄紅': [255, 99, 71],
    '珊瑚紅': [255, 127, 80],
    '印度紅': [205, 92, 92],

    // --- 粉色系 ---
    '深粉紅': [255, 20, 147],
    '熱粉紅': [255, 105, 180],
    '粉紅色': [255, 192, 203],
    '淺粉紅': [255, 182, 193],
    '霧玫瑰': [255, 228, 225],

    // --- 橙色系 ---
    '紅橙色': [255, 69, 0],
    '深橙色': [255, 140, 0],
    '橙色': [255, 165, 0],
    '金色': [255, 215, 0],

    // --- 黃色系 ---
    '黃色': [255, 255, 0],
    '淺黃色': [255, 255, 224],
    '卡其色': [240, 230, 140],
    '鹿皮色': [255, 228, 181],
    '檸檬綢': [255, 250, 205],

    // --- 棕色系 ---
    '馬鞍棕': [139, 69, 19],
    '赭色': [160, 82, 45],
    '巧克力色': [210, 105, 30],
    '秘魯色': [205, 133, 63],
    '沙棕色': [244, 164, 96],
    '硬木色': [222, 184, 135],
    '棕褐色': [210, 180, 140],
    '米色': [245, 245, 220],
    '玫瑰褐': [188, 143, 143],

    // --- 綠色系 ---
    '深綠色': [0, 100, 0],
    '綠色': [0, 128, 0],
    '森林綠': [34, 139, 34],
    '萊姆綠': [50, 205, 50],
    '萊姆色': [0, 255, 0],
    '黃綠色': [154, 205, 50],
    '橄欖色': [128, 128, 0],
    '深橄欖綠': [85, 107, 47],
    '海綠色': [46, 139, 87],
    '草坪綠': [124, 252, 0],

    // --- 青色/藍綠色系 ---
    '藍綠色': [0, 128, 128],
    '深青色': [0, 139, 139],
    '綠松石': [64, 224, 208],
    '青色': [0, 255, 255],
    '海藍色': [127, 255, 212],
    '蒼白綠松石': [175, 238, 238],

    // --- 藍色系 ---
    '午夜藍': [25, 25, 112],
    '海軍藍': [0, 0, 128],
    '深藍色': [0, 0, 139],
    '中藍色': [0, 0, 205],
    '藍色': [0, 0, 255],
    '皇家藍': [65, 105, 225],
    '鋼藍色': [70, 130, 180],
    '天藍色': [135, 206, 235],
    '淺藍色': [173, 216, 230],
    '粉末藍': [176, 224, 230],
    '矢車菊藍': [100, 149, 237],

    // --- 紫色系 ---
    '靛青色': [75, 0, 130],
    '紫色': [128, 0, 128],
    '深洋紅': [139, 0, 139],
    '藍紫色': [138, 43, 226],
    '中紫色': [147, 112, 219],
    '李子色': [221, 160, 221],
    '紫羅蘭': [238, 130, 238],
    '洋紅色': [255, 0, 255],
    '蘭花色': [218, 112, 214],
    '薊色': [216, 191, 216]
};

// [優化 2] 預先將 COLOR_MAP 轉換為陣列格式，避免在迴圈中重複 Object.entries
// 結構: [{ tag: '黑色', r: 0, g: 0, b: 0 }, ...]
const COLOR_LIST = Object.entries(COLOR_MAP).map(([tag, rgb]) => ({
    tag,
    r: rgb[0],
    g: rgb[1],
    b: rgb[2]
}));

// [優化 1] 計算兩個顏色之間的"平方"歐幾里得距離 (移除 Math.sqrt)
function colorSquaredDistance(r1, g1, b1, r2, g2, b2) {
    return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
}

// 將 RGB 映射到最近的顏色標籤
function mapColorToTag(r, g, b) {
    let minDistance = Infinity;
    let closestTag = '未知';

    // 使用預處理好的陣列進行遍歷
    for (let i = 0; i < COLOR_LIST.length; i++) {
        const color = COLOR_LIST[i];
        // 使用平方距離比較
        const dist = colorSquaredDistance(r, g, b, color.r, color.g, color.b);
        if (dist < minDistance) {
            minDistance = dist;
            closestTag = color.tag;
        }
    }
    return closestTag;
}

// 處理單張圖片並返回顏色統計
async function processImage(imagePath) {
    try {
        if (!fs.existsSync(imagePath)) return {};

        // [優化 3] 調整大小為 50x50 (2500像素)，這對主色調分析已經足夠精確，且比 100x100 快 4 倍
        const { data, info } = await sharp(imagePath)
            .resize(50, 50, { fit: 'inside' }) 
            .raw()
            .toBuffer({ resolveWithObject: true });

        const colorCounts = {};

        // 遍歷像素 (每3個字節為 R, G, B)
        for (let i = 0; i < data.length; i += info.channels) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // 忽略透明像素 (如果有 alpha 通道)
            if (info.channels === 4 && data[i + 3] < 128) continue;

            const tag = mapColorToTag(r, g, b);
            // 使用直接賦值通常比 (obj[x] || 0) + 1 微快一點點，但在 V8 中差異不大，保持原樣即可
            colorCounts[tag] = (colorCounts[tag] || 0) + 1;
        }

        return colorCounts;
    } catch (error) {
        console.error(`Error processing image ${imagePath}:`, error.message);
        return {};
    }
}

exports.generateColorTags = async function (videoGroupId) {
    try {
        // 獲取該影片組的所有影片
        const videos = await db.VideoDb.videoData.findAll(
            { where: { group_id: videoGroupId } }
        ).then(async (result) => result !== undefined && result.length == 0 ? [await db.VideoDb.videoData.findOne( { where: { video_id: videoGroupId}})] : result);

        const groupColorStats = {};
        const thumbDir = process.env.THUMB_DIR;

        // [優化 4] 並行處理所有圖片 (Promise.all)
        const promises = videos.map(async (video) => {
            if (video === null) return {};
            let imagePath = null;
            const animPath = path.join(thumbDir, `${video.video_filename}_anim.webp`);
            const staticPath = path.join(thumbDir, `${video.video_filename}.webp`);

            if (fs.existsSync(animPath)) {
                imagePath = animPath;
            } else if (fs.existsSync(staticPath)) {
                imagePath = staticPath;
            }

            if (imagePath) {
                return await processImage(imagePath);
            }
            return {};
        });

        // 等待所有圖片處理完成
        const results = await Promise.all(promises);

        // 匯總結果
        for (const stats of results) {
            for (const [tag, count] of Object.entries(stats)) {
                groupColorStats[tag] = (groupColorStats[tag] || 0) + count;
            }
        }

        // 排序並取出前三名的RGB array
        const sortedColors = Object.entries(groupColorStats)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([tag]) => COLOR_MAP[tag]);

        return Promise.resolve(sortedColors);
    } catch (err) {
        return Promise.reject(err);
    }
}

exports.rgbToHex = function(rgbArray) {
    return '#' + ((1 << 24) + (rgbArray[0] << 16) + (rgbArray[1] << 8) + rgbArray[2]).toString(16).slice(1).toUpperCase();
}