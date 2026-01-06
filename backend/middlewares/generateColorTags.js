const fs = require('fs');
const db = require('../models');
const path = require('path');
const ColorThief = require('colorthief');

// 30 Color Palette (10 Categories x 3 Colors)
const PALETTE_HEX = [
    // Grayscale
    "#000000", "#808080", "#ffffff",
    // Red
    "#ff0000", "#8b0000", "#ff6347",
    // Pink
    "#ff1493", "#ffc0cb", "#ffe4e1",
    // Orange
    "#ffa500", "#ff4500", "#ffd700",
    // Yellow
    "#ffff00", "#f0e68c", "#fffacd",
    // Brown
    "#8b4513", "#d2691e", "#f5f5dc",
    // Green
    "#008000", "#32cd32", "#556b2f",
    // Cyan
    "#00ffff", "#008080", "#7fffd4",
    // Blue
    "#0000ff", "#000080", "#87ceeb",
    // Purple
    "#800080", "#ee82ee", "#4b0082"
];

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

// Pre-calculate RGBs for distance checking
const COLOR_LIST = PALETTE_HEX.map(hex => ({
    tag: hex,
    ...hexToRgb(hex)
}));

// [Optimization 1] Squared Euclidean distance
function colorSquaredDistance(r1, g1, b1, r2, g2, b2) {
    return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
}

// Map RGB to nearest Palette Hex
function mapColorToTag(r, g, b) {
    let minDistance = Infinity;
    let closestColor = null;

    for (let i = 0; i < COLOR_LIST.length; i++) {
        const color = COLOR_LIST[i];
        const dist = colorSquaredDistance(r, g, b, color.r, color.g, color.b);
        if (dist < minDistance) {
            minDistance = dist;
            closestColor = color;
        }
    }

    // Filter Logic:
    // Discard if the difference is too large based on user requirements
    // Condition: |r_diff| > 16 OR |g_diff| > 16 OR |b_diff| > 16 OR ( |r_diff| + |g_diff| + |b_diff| ) > 32
    if (closestColor) {
        const rDiff = Math.abs(r - closestColor.r);
        const gDiff = Math.abs(g - closestColor.g);
        const bDiff = Math.abs(b - closestColor.b);

        if (rDiff > 48 || gDiff > 48 || bDiff > 48) {
            return null; // Return null if too different
        }
    }

    // Return the Hex String as key
    return closestColor ? closestColor.tag : null; 
}

// 處理單張圖片並返回顏色統計
async function processImage(imagePath) {
    try {
        if (!fs.existsSync(imagePath)) return {};

        // ColorThief extract 8 main colors (user requested 8)
        const palette = await ColorThief.getPalette(imagePath, 8);
        
        const colorCounts = {};

        if (palette && Array.isArray(palette)) {
            palette.forEach((rgb, index) => {
                const [r, g, b] = rgb;
                const weight = 9 - index; // 8, 7, 6, ..., 1
    
                const tag = mapColorToTag(r, g, b); // This returns Hex String now
                if (tag) { // Only count if valid tag returned
                    colorCounts[tag] = (colorCounts[tag] || 0) + weight;
                }
            });
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

        // [Optimazation 4] Parallel processing
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

        const results = await Promise.all(promises);

        for (const stats of results) {
            for (const [tag, count] of Object.entries(stats)) {
                groupColorStats[tag] = (groupColorStats[tag] || 0) + count;
            }
        }

        // Sort and pick top 5
        const sortedHexColors = Object.entries(groupColorStats)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
            .map(([tag]) => tag);
            
        // We need to return RGB arrays because existing controller expects rgb array to convert to hex
        return sortedHexColors.map(hex => {
            const c = hexToRgb(hex);
            return [c.r, c.g, c.b];
        });

    } catch (err) {
        return Promise.reject(err);
    }
}

exports.rgbToHex = function(rgbArray) {
    return '#' + ((1 << 24) + (rgbArray[0] << 16) + (rgbArray[1] << 8) + rgbArray[2]).toString(16).slice(1).toUpperCase();
}
