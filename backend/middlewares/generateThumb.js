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
    // Since we are using UUIDs, the filename is already safe. 
    // But we keep generateSafeName for compatibility if needed, or just use basename.
    // For UUIDs, generateSafeName(uuid) returns uuid.
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
    const webpPath = path.join(thumbDir, `${baseName}.webp`);
    const animWebpPath = path.join(thumbDir, `${baseName}_anim.webp`);

    // Static WebP (Lossless for max quality)
    await runProcess(ffmpegPath, [
        '-hide_banner',
        '-loglevel', 'error',
        '-y',
        '-ss', '00:00:01',
        '-i', inputPath,
        '-frames:v', '1',
        '-vf', 'scale=640:-2:flags=lanczos',
        '-c:v', 'libwebp',
        '-lossless', '1',
        webpPath,
    ]);

    // Animated WebP (High Quality)
    await runProcess(ffmpegPath, [
        '-hide_banner',
        '-loglevel', 'error',
        '-y',
        '-ss', '00:00:01',
        '-t', '1',
        '-i', inputPath,
        '-vf', 'fps=10,scale=640:-2:flags=lanczos',
        '-c:v', 'libwebp',
        '-q:v', '90',
        '-loop', '0',
        '-preset', 'default',
        '-an',
        animWebpPath,
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
        order: [['video_filename', 'ASC']],
    });
    if (!videos || videos.length === 0) { throw new Error(`No videos for group ${groupId}`); }

    // 2) Determine group base name
    const groupBase = this.generateSafeName(
        videoGroupThumbName || await db.VideoDb.videoGroupData
            .findOne({ where: { group_id: groupId } })
            .then(g => (g && g.group_thumb_name) ? g.group_thumb_name : `group_${groupId}`)
    );
    const mergedWebpPath = path.join(thumbDir, `${path.parse(groupBase).name}_anim.webp`);
    const webpPath = path.join(thumbDir, `${path.parse(groupBase).name}.webp`);

    // 3) Collect source video paths for animated merge
    const videoDir = process.env.VIDEO_DIR;
    const sourceInputs = videos.map(v => {
        const ext = v.video_format ? `.${v.video_format.toLowerCase()}` : '';
        return path.join(videoDir, `${v.video_filename}${ext}`);
    }).filter(p => fs.existsSync(p)).slice(0, 8);

    const firstWebp = videos
        .map(v => path.join(thumbDir, `${(v.video_thumb_name || v.video_filename)}.webp`))
        .find(p => fs.existsSync(p));

    if (sourceInputs.length === 0) { throw new Error('No source videos found for group merge'); }

    // 4) Merge Source Videos into Animated WebP
    const args = ['-hide_banner', '-loglevel', 'error', '-y'];
    
    sourceInputs.forEach(p => {
        args.push('-ss', '00:00:01', '-t', '1', '-i', p);
    });

    if (sourceInputs.length === 1) {
        args.push(
            '-vf', 'fps=10,scale=640:-2:flags=lanczos',
            '-c:v', 'libwebp', '-q:v', '90', '-loop', '0',
            '-preset', 'default', '-an',
            mergedWebpPath
        );
    } else {
        const filterChains = sourceInputs.map((_, i) => `[${i}:v]fps=10,scale=640:-2:flags=lanczos[v${i}]`);
        const concatInputsStr = sourceInputs.map((_, i) => `[v${i}]`).join('');
        const fullFilter = `${filterChains.join(';')};${concatInputsStr}concat=n=${sourceInputs.length}:v=1:a=0`;

        args.push(
            '-filter_complex', fullFilter,
            '-c:v', 'libwebp', '-q:v', '90', '-loop', '0',
            '-preset', 'default', '-an',
            mergedWebpPath
        );
    }

    await runProcess(ffmpegPath, args);

    // 5) Group Static WebP: prioritize copying the first video's WebP
    if (firstWebp && fs.existsSync(firstWebp)) {
        fs.copyFileSync(firstWebp, webpPath);
    }

    return true;
}

exports.generateSafeName = (videoFilename) => {
    return path.basename(String(videoFilename.replaceAll(" ", "_").replace(/[!@#$%^&*();:<>{}[\]'\",]/g, "") || ''));
}