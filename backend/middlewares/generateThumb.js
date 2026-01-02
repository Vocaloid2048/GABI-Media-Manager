const db = require("../models");
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const runProcess = (cmd, args) => {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, args, { windowsHide: true });
        let stderr = '';
        child.stderr?.on('data', (d) => { stderr += d.toString(); });
        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
                return;
            }
            reject(new Error(`${cmd} exited with code ${code}${stderr ? `\n${stderr}` : ''}`));
        });
    });
};

/**
 * Generate Thumbnail for a Video File
 * @param {string} videoFileName Name of the video file, with SUFFIX
 * @returns {boolean} Success status
 */
exports.generateThumbnail = async (videoFileName) => {
    const safeName = this.generateSafeName(videoFileName);
    const videoDir = process.env.VIDEO_DIR;
    const thumbDir = process.env.THUMB_DIR;

    if (!ffmpegPath) {
        throw new Error('ffmpeg-static path not found (ffmpegPath is empty)');
    }

    console.log(`videoDir: ${videoDir}, thumbDir: ${thumbDir}, safeName: ${safeName}`);
    const inputPath = path.join(videoDir, safeName);
    if (!fs.existsSync(inputPath)) {
        throw new Error(`Video file does not exist: ${inputPath}`);
    }

    if (!fs.existsSync(thumbDir)) {
        fs.mkdirSync(thumbDir, { recursive: true });
    }

    const baseName = path.parse(safeName).name;
    const pngPath = path.join(thumbDir, `${baseName}.png`);
    const gifPath = path.join(thumbDir, `${baseName}.gif`);

    // PNG thumbnail generate (640px width)
    await runProcess(ffmpegPath, [
        '-hide_banner',
        '-loglevel', 'error',
        '-y',
        // Seek a little to avoid black first frame; works for most videos
        '-ss', '00:00:01',
        '-i', inputPath,
        '-frames:v', '1',
        '-vf', 'scale=640:-2:flags=lanczos',
        pngPath,
    ]);

    // GIF thumbnail (2 seconds, 15 FPS, 640px width) with palette for quality
    // Use palettegen/paletteuse for better GIF quality
    await runProcess(ffmpegPath, [
        '-hide_banner',
        '-loglevel', 'error',
        '-y',
        '-ss', '00:00:01',
        '-t', '2',
        '-i', inputPath,
        '-filter_complex',
        [
            'fps=15,scale=640:-2:flags=lanczos,split[s0][s1];',
            '[s0]palettegen=stats_mode=diff[p];',
            '[s1][p]paletteuse=dither=bayer:bayer_scale=3',
        ].join(''),
        '-loop', '0',
        gifPath,
    ]);

    return true;
}

/**
 * Generate Merge Version of Thumbnails for a Video Group, also PNG by first video
 * @param {number} groupId ID of the video group
 * @returns {boolean} Success status
 */
exports.generateThumbnailGroup = async (groupId, videoGroupThumbName) => {
    if (!ffmpegPath) { throw new Error('ffmpeg-static path not found'); }

    const thumbDir = process.env.THUMB_DIR;
    if (!thumbDir) { throw new Error('THUMB_DIR is not set'); }
    fs.mkdirSync(thumbDir, { recursive: true });

    // 1) Get all videos in the group
    const videos = await db.VideoDb.videoData.findAll({
        where: { group_id: groupId },
        order: [['video_id', 'ASC']],
    });
    if (!videos || videos.length === 0) { throw new Error(`No videos for group ${groupId}`); }

    // 2) Determine group base name
    const groupBase = this.generateSafeName(
        videoGroupThumbName || await db.VideoDb.videoGroupData
            .findOne({ where: { group_id: groupId } })
            .then(g => (g && g.group_thumb_name) ? g.group_thumb_name : `group_${groupId}`)
    );
    const mergedGifPath = path.join(thumbDir, `${path.parse(groupBase).name}.gif`);
    const pngPath = path.join(thumbDir, `${path.parse(groupBase).name}.png`);

    // 3) Collect individual video GIFs and PNGs
    const gifInputs = videos
        .map(v => path.join(thumbDir, `${(v.video_thumb_name || v.video_filename)}.gif`))
        .filter(p => fs.existsSync(p));
    const firstPng = videos
        .map(v => path.join(thumbDir, `${(v.video_thumb_name || v.video_filename)}.png`))
        .find(p => fs.existsSync(p));

    if (gifInputs.length === 0) { throw new Error('No per-video GIFs to merge'); }

    // 4) Merge GIFs
    const args = ['-hide_banner', '-loglevel', 'error', '-y'];
    gifInputs.forEach(g => args.push('-i', g));

    if (gifInputs.length === 1) {
        // Only one GIF, just copy
        args.push(
            '-filter_complex', 'fps=15,scale=640:-2:flags=lanczos',
            '-loop', '0',
            mergedGifPath
        );
    } else {
        const inputs = gifInputs.map((_, i) => `[${i}:v]`).join('');
        const filter = `${inputs}concat=n=${gifInputs.length}:v=1:a=0,fps=15,scale=640:-2:flags=lanczos`;
        args.push(
            '-filter_complex', filter,
            '-loop', '0',
            mergedGifPath
        );
    }

    await runProcess(ffmpegPath, args);

    // 5) Group PNG: prioritize copying the first video's PNG
    if (firstPng && fs.existsSync(firstPng)) {
        fs.copyFileSync(firstPng, pngPath);
    }

    return true;
}

exports.generateSafeName = (videoFilename) => {
    return path.basename(String(videoFilename.replaceAll(" ", "_").replace(/[!@#$%^&*();:<>{}[\]'\",]/g, "") || ''));
}