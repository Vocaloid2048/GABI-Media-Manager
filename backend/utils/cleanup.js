const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');
const { promisify } = require('util');
const { exec } = require('child_process');
const os = require('os');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const rm = promisify(fs.rm);
const unlink = promisify(fs.unlink);

const TEMP_DIR = process.env.TEMP_DIR || path.join(__dirname, '../Temp');
const MAX_AGE_MS = 5 * 60 * 1000; // 5 Minutes

/**
 * Checks if a file/directory is older than the max age.
 * Uses mtime (Modification Time) to protect files currently being uploaded/written.
 */
const isStale = (stats) => {
    return (Date.now() - stats.mtimeMs) > MAX_AGE_MS;
};

/**
 * Checks if a file OR DIRECTORY is currently in use.
 * Optimized to check directory recursively if needed.
 */
const isResourceInUse = async (targetPath) => {
    // Windows fallback: cannot use lsof. 
    // On Windows, fs.unlink/rm usually fails with EBUSY if open, so we rely on try-catch in the caller.
    if (os.platform() === 'win32') {
        return false; 
    }

    return new Promise((resolve) => {
        // Optimization: Use +D to search recursively inside a directory
        // This prevents spawning 1000 processes for 1000 files.
        const cmd = `lsof +D "${targetPath}"`; 
        
        exec(cmd, (error, stdout, stderr) => {
            // lsof returns exit code 0 (no error) if it finds open files.
            // It returns exit code 1 (error) if NO open files are found (which is weird but standard for lsof).
            // So: if stdout has content, it is in use.
            if (stdout && stdout.trim().length > 0) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
};

/**
 * Cleanup function
 */
const performCleanup = async () => {
    if (!fs.existsSync(TEMP_DIR)) {
        return;
    }

    console.log(`[Cleanup] Starting temp folder cleanup...`);
    
    try {
        const items = await readdir(TEMP_DIR);

        for (const item of items) {
            const itemPath = path.join(TEMP_DIR, item);
            
            try {
                const stats = await stat(itemPath);

                // Skip anything that is not "stale" (modified recently)
                // This is the first line of defense against deleting active uploads.
                if (!isStale(stats)) {
                    continue; 
                }

                // --- Scenario 1: Chunks Directory ---
                if (item === 'chunks' && stats.isDirectory()) {
                    await cleanupChunks(itemPath);
                }
                
                // --- Scenario 2: Extraction Directories & Upload Files ---
                // We group these because the logic is similar: Check Stale -> Check Lock -> Delete
                else if (
                    (item.startsWith('extract_') && stats.isDirectory()) || 
                    (stats.isFile() && (item.startsWith('upload_') || item.startsWith('tmp-') || item.includes('-')))
                ) {
                    
                    // Critical Check: Is it opened by any process (unzipper, uploader, downloader)?
                    const inUse = await isResourceInUse(itemPath);

                    if (!inUse) {
                        try {
                            await rm(itemPath, { recursive: true, force: true });
                            console.log(`[Cleanup] Deleted stale item: ${item}`);
                        } catch (deleteErr) {
                            // Double check: if deletion failed, it might be locked (especially on Windows)
                            console.warn(`[Cleanup] Could not delete ${item}, might be in use. Error: ${deleteErr.message}`);
                        }
                    } else {
                        console.log(`[Cleanup] Skipped ${item} - currently in use (locked).`);
                    }
                }

            } catch (err) {
                // Prevent loop from crashing on single file permission error
                console.error(`[Cleanup] Failed to process ${item}:`, err.message);
            }
        }
    } catch (err) {
        console.error(`[Cleanup] Fatal error executing cleanup:`, err);
    }
};

const cleanupChunks = async (chunksDir) => {
    try {
        const chunkFolders = await readdir(chunksDir);
        for (const folder of chunkFolders) {
            const folderPath = path.join(chunksDir, folder);
            try {
                const stats = await stat(folderPath);
                
                if (stats.isDirectory() && isStale(stats)) {
                    // Check the WHOLE folder at once, not file by file
                    const inUse = await isResourceInUse(folderPath);
                    
                    if (!inUse) {
                        await rm(folderPath, { recursive: true, force: true });
                        console.log(`[Cleanup] Deleted stale chunk folder: ${folder}`);
                    } else {
                        console.log(`[Cleanup] Skipped chunk folder ${folder} - files inside are in use.`);
                    }
                }
            } catch (e) {
                // Ignore errors (e.g. folder disappeared)
            }
        }
    } catch (err) {
        console.error(`[Cleanup] Error cleaning chunks dir:`, err);
    }
};

const initCleanupSchedule = () => {
    console.log(`[Cleanup] Initializing cleanup schedule (Every 5 minutes)...`);
    schedule.scheduleJob('*/5 * * * *', () => {
        performCleanup();
    });
};

module.exports = {
    initCleanupSchedule
};