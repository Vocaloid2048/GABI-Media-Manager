const activeUploads = new Map(); // userId -> count
const requestQueue = []; // Array of { userId, next }

const MAX_CONCURRENT_UPLOADS = 1;

const processQueue = (userId) => {
    const nextRequestIndex = requestQueue.findIndex(item => item.userId === userId);
    if (nextRequestIndex !== -1) {
        const { next } = requestQueue.splice(nextRequestIndex, 1)[0];
        activeUploads.set(userId, (activeUploads.get(userId) || 0) + 1);
        next();
    }
};

module.exports = (req, res, next) => {
    // Get User ID from headers (set by auth middleware or frontend)
    // Note: This middleware runs BEFORE auth middleware in the route chain if we place it first.
    // But we need user_id. 
    // The frontend sends user_id in headers.
    const userId = req.get('user_id') || req.ip; // Fallback to IP if no user_id

    const currentActive = activeUploads.get(userId) || 0;

    if (currentActive >= MAX_CONCURRENT_UPLOADS) {
        console.log(`User ${userId} queued. Active uploads: ${currentActive}`);
        requestQueue.push({ userId, next });
    } else {
        activeUploads.set(userId, currentActive + 1);
        next();
    }

    // Hook into response finish to release the slot
    res.on('finish', () => {
        const current = activeUploads.get(userId) || 0;
        if (current > 0) {
            activeUploads.set(userId, current - 1);
        }
        processQueue(userId);
    });

    res.on('close', () => {
        // Handle premature close (e.g. client disconnect)
        if (!res.writableEnded) {
             const current = activeUploads.get(userId) || 0;
            if (current > 0) {
                activeUploads.set(userId, current - 1);
            }
            processQueue(userId);
        }
    });
};
