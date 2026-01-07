const activeUploads = new Map(); // userId -> Set<req>
const requestQueue = []; // Array of { userId, run }

const MAX_CONCURRENT_UPLOADS = 1;
const IDLE_TIMEOUT_MS = 10000;

/**
 * Checks for available slots and processes the next request in queue for the user.
 * @param {string} userId - The ID of the user.
 */
const processQueue = (userId) => {
    const queueIndex = requestQueue.findIndex(item => item.userId === userId);
    if (queueIndex === -1) return;

    const activeSet = getActiveSet(userId);
    cleanZombieRequests(userId, activeSet);

    if (activeSet.size < MAX_CONCURRENT_UPLOADS) {
        const { run } = requestQueue.splice(queueIndex, 1)[0];
        run();
    }
};

/**
 * Gets or creates the active upload set for a user.
 * @param {string} userId 
 * @returns {Set}
 */
const getActiveSet = (userId) => {
    if (!activeUploads.has(userId)) {
        activeUploads.set(userId, new Set());
    }
    return activeUploads.get(userId);
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
    const activeSet = getActiveSet(userId);

    // Initial Zombie Cleanup
    cleanZombieRequests(userId, activeSet);

    // Function to execute the upload logic
    const run = () => {
        if (req.destroyed || req.aborted) {
            console.log(`User ${userId} request skipped (closed before run).`);
            processQueue(userId);
            return;
        }

        activeSet.add(req);
        console.log(`User ${userId} started upload. Active uploads: ${activeSet.size}`);

        let finished = false;

        const cleanup = () => {
            if (finished) return;
            finished = true;

            activeSet.delete(req);
            
            // Remove listeners
            res.removeListener('finish', onComplete);
            res.removeListener('close', onComplete);
            req.removeListener('close', onComplete);
            req.removeListener('aborted', onComplete);
            req.removeListener('error', onError);
            if (req.socket) {
                req.socket.removeListener('close', onComplete);
                req.socket.removeListener('timeout', onSocketTimeout);
            }

            processQueue(userId);
        };

        const onComplete = () => cleanup();
        
        const onError = (err) => {
            console.error(`User ${userId} upload error: ${err.message}`);
            cleanup();
        };

        const onSocketTimeout = () => {
            console.log(`User ${userId} socket timeout (${IDLE_TIMEOUT_MS}ms). Destroying.`);
            if (!finished) {
                req.destroy(new Error('Upload idle timeout'));
                cleanup();
            }
        };

        // Attach Event Listeners
        res.on('finish', onComplete);
        res.on('close', onComplete);
        req.on('close', onComplete);
        req.on('aborted', onComplete);
        req.on('error', onError);
        
        if (req.socket) {
            req.socket.on('close', onComplete);
            req.socket.setTimeout(IDLE_TIMEOUT_MS);
            req.socket.on('timeout', onSocketTimeout);
        }

        next();
    };

    // Queue Logic
    if (activeSet.size >= MAX_CONCURRENT_UPLOADS) {
        console.log(`User ${userId} queued. Active uploads: ${activeSet.size}`);
        
        const queueItem = { userId, run };
        requestQueue.push(queueItem);

        // Remove from queue if client disconnects while waiting
        const removeFromQueue = () => {
            const index = requestQueue.indexOf(queueItem);
            if (index !== -1) {
                requestQueue.splice(index, 1);
                console.log(`User ${userId} removed from queue (disconnected).`);
            }
        };

        req.on('close', removeFromQueue);
        req.on('aborted', removeFromQueue);
        req.on('error', removeFromQueue);
        if (req.socket) req.socket.on('close', removeFromQueue);
        
    } else {
        run();
    }
};
