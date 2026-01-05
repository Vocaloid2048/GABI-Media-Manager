const activeUploads = new Map(); // userId -> count
const requestQueue = []; // Array of { userId, run }

const MAX_CONCURRENT_UPLOADS = 1;

const processQueue = (userId) => {
    const nextRequestIndex = requestQueue.findIndex(item => item.userId === userId);
    if (nextRequestIndex !== -1) {
        const { run } = requestQueue.splice(nextRequestIndex, 1)[0];
        run();
    }
};

module.exports = (req, res, next) => {
    const userId = req.get('user_id') || req.ip;

    // Function to start the request processing
    const run = () => {
        // Increment active count
        activeUploads.set(userId, (activeUploads.get(userId) || 0) + 1);
        
        // Define cleanup and completion handlers
        const onFinish = () => {
            cleanup();
            const current = activeUploads.get(userId) || 0;
            if (current > 0) activeUploads.set(userId, current - 1);
            processQueue(userId);
        };

        const onClose = () => {
            if (!res.writableEnded) {
                cleanup();
                const current = activeUploads.get(userId) || 0;
                if (current > 0) activeUploads.set(userId, current - 1);
                console.log(`User ${userId} upload cancelled (connection closed).`);
                processQueue(userId);
            }
        };

        const cleanup = () => {
            res.removeListener('finish', onFinish);
            res.removeListener('close', onClose);
        };

        // Attach handlers
        res.on('finish', onFinish);
        res.on('close', onClose);

        // Proceed
        next();
    };

    const currentActive = activeUploads.get(userId) || 0;

    if (currentActive >= MAX_CONCURRENT_UPLOADS) {
        console.log(`User ${userId} queued. Active uploads: ${currentActive}`);
        
        const queueItem = { userId, run };
        requestQueue.push(queueItem);

        // Handle cancellation while in queue
        const onReqClose = () => {
            const index = requestQueue.indexOf(queueItem);
            if (index !== -1) {
                requestQueue.splice(index, 1);
                console.log(`User ${userId} disconnected from queue.`);
            }
        };
        
        req.on('close', onReqClose);
        
    } else {
        run();
    }
};
