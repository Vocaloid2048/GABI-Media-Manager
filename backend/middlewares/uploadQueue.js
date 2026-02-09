const activeUploads = new Map(); // userId -> Set<req> (for legacy)
const activeFiles = new Map(); // userId -> Set<fileId>
const requestQueue = []; // Array of { userId, fileId, run }

const MAX_CONCURRENT_FILES = 1;
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 Minutes

/**
 * Checks for available slots and processes the next request in queue for the user.
 * @param {string} userId - The ID of the user.
 */
const processQueue = (userId) => {
    const queueIndex = requestQueue.findIndex(item => item.userId === userId);
    if (queueIndex === -1) return;

    const activeSet = getActiveFileSet(userId);
    cleanZombieRequests(userId, activeSet);

    if (activeSet.size < MAX_CONCURRENT_FILES) {
        const { run } = requestQueue.splice(queueIndex, 1)[0];
        run();
    }
};

/**
 * Gets or creates the active file set for a user.
 * @param {string} userId 
 * @returns {Set}
 */
const getActiveFileSet = (userId) => {
    if (!activeFiles.has(userId)) {
        activeFiles.set(userId, new Set());
    }
    return activeFiles.get(userId);
};

/**
 * Removes requests that are destroyed or aborted but haven't triggered cleanup yet.
 * @param {string} userId 
 * @param {Set} activeSet 
 */
const cleanZombieRequests = (userId, activeSet) => {
    for (const req of activeSet) {
        if (req.destroyed || req.aborted || (req.socket && req.socket.destroyed)) {
            console.log(`User ${userId} found zombie request during check, clearing slot.`);
            activeSet.delete(req);
        }
    }
};

module.exports = (req, res, next) => {
    const userId = req.get('user_id') || req.query.user_id;
    if (!userId) return next();

    const fileId = req.body?.fileId || req.query.fileId;
    if (!fileId) return next(); // not chunked upload

    const activeSet = getActiveFileSet(userId);

    const isAlreadyActive = activeSet.has(fileId);

    if (!isAlreadyActive && activeSet.size >= MAX_CONCURRENT_FILES) {
        console.log(`User ${userId} file ${fileId} queued. Active files: ${activeSet.size}`);
        
        const queueItem = { userId, fileId, run: () => next() };
        requestQueue.push(queueItem);

        // Remove from queue if client disconnects while waiting
        const removeFromQueue = () => {
            const index = requestQueue.indexOf(queueItem);
            if (index !== -1) {
                requestQueue.splice(index, 1);
                console.log(`User ${userId} file ${fileId} removed from queue (disconnected).`);
            }
        };

        req.on('close', removeFromQueue);
        req.on('aborted', removeFromQueue);
        req.on('error', removeFromQueue);
        if (req.socket) req.socket.on('close', removeFromQueue);
        
        return;
    }

    if (!isAlreadyActive) {
        activeSet.add(fileId);
        console.log(`User ${userId} started file ${fileId}. Active files: ${activeSet.size}`);
    }

    // On response finish, check if last chunk
    res.on('finish', () => {
        const chunkIndex = parseInt(req.body?.chunkIndex || req.query.chunkIndex || 0);
        const totalChunks = parseInt(req.body?.totalChunks || req.query.totalChunks || 1);
        
        if (chunkIndex === totalChunks - 1) {
            activeSet.delete(fileId);
            console.log(`User ${userId} finished file ${fileId}. Active files: ${activeSet.size}`);
            processQueue(userId);
        }
    });

    next();
};

module.exports.releaseFile = (userId, fileId) => {
    const activeSet = getActiveFileSet(userId);
    if (activeSet.has(fileId)) {
        activeSet.delete(fileId);
        console.log(`User ${userId} released file ${fileId}. Active files: ${activeSet.size}`);
        processQueue(userId);
    }
};
