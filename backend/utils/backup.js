const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');
const archiver = require('archiver');

/**
 * 執行資料庫備份任務 (壓縮整個 ./db 資料夾)
 */
const runBackup = async () => {
    const dbDir = path.join(__dirname, '../db');
    const mainBackupDir = process.env.DB_BACKUP_MAIN || path.join(__dirname, '../backups/main');
    const subBackupDir = process.env.DB_BACKUP_SUB || path.join(__dirname, '../backups/sub');

    // 格式化時間 YYYY_MM_DD_HH-mm-ss
    const now = new Date();
    const timestamp = now.getFullYear() + '_' +
        String(now.getMonth() + 1).padStart(2, '0') + '_' +
        String(now.getDate()).padStart(2, '0') + '_' +
        String(now.getHours()).padStart(2, '0') + '-' +
        String(now.getMinutes()).padStart(2, '0') + '-' +
        String(now.getSeconds()).padStart(2, '0');
    
    const backupFileName = `backup_${timestamp}.zip`;

    console.log(`[Backup] Starting scheduled ZIP backup at ${now.toLocaleString()}...`);

    // 確保備份目錄存在
    [mainBackupDir, subBackupDir].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    const mainDestPath = path.join(mainBackupDir, backupFileName);
    const subDestPath = path.join(subBackupDir, backupFileName);

    try {
        await createZipBackup(dbDir, mainDestPath);
        console.log(`[Backup] Main ZIP backup successful: ${mainDestPath}`);

        // 複製到副備份路徑 (異地備份)
        fs.copyFileSync(mainDestPath, subDestPath);
        console.log(`[Backup] Sub ZIP backup successful: ${subDestPath}`);

        // 清理舊備份
        [mainBackupDir, subBackupDir].forEach(cleanOldBackups);
    } catch (err) {
        console.error(`[Backup] Error during backup process:`, err.message);
    }
};

/**
 * 建立 ZIP 壓縮檔
 */
const createZipBackup = (sourceDir, outPath) => {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve());
        archive.on('error', (err) => reject(err));

        archive.pipe(output);
        // 將整個 db 資料夾內的內容加入壓縮檔 root
        archive.directory(sourceDir, false);
        archive.finalize();
    });
};

/**
 * 清理超過 60 天的舊備份
 */
const cleanOldBackups = (dir) => {
    const MAX_AGE_DAYS = 60;
    const now = Date.now();

    if (!fs.existsSync(dir)) return;

    fs.readdir(dir, (err, files) => {
        if (err) return;

        files.forEach(file => {
            const filePath = path.join(dir, file);
            if (file.startsWith('backup_') && file.endsWith('.zip')) {
                const stats = fs.statSync(filePath);
                const ageDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
                
                if (ageDays > MAX_AGE_DAYS) {
                    try {
                        fs.unlinkSync(filePath);
                        console.log(`[Backup] Cleaned old backup file: ${file}`);
                    } catch (e) {}
                }
            }
        });
    });
};

/**
 * 初始化排程任務 (每天 00:00)
 */
const initBackupSchedule = () => {
    console.log('[Backup] Database backup scheduler initialized (Daily at 00:00).');
    
    // '0 0 * * *' 代表每天凌晨 0 時 0 分
    // '1 0 * * *' 代表每天凌晨 0 時 1 分
    schedule.scheduleJob('0 0 * * *', () => {
        runBackup();
    });

    // 如果是第一次啟動且備份目錄為空，建議可以先執行一次 (可選)
    // runBackup(); 
};

module.exports = { initBackupSchedule, runBackup };
