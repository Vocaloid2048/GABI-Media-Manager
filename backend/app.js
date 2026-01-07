const express = require('express');
const session = require('express-session')
const fs = require('fs')
const https = require('https')
const path = require('path');
const cors = require('cors')

const app = express();
const router = require('./routers/router');
const { VideoDb, initDb } = require('./models');
const { initBackupSchedule } = require('./utils/backup');

const PORT = process.env.PORT || 3000

app.use(express.json({ limit: '50gb' }))
app.use(express.urlencoded({ limit: '50gb', extended: true }));
app.enable('trust proxy');
app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: 'bla bla bla'
  })
)

// CORS 設定：允許前端開發伺服器、生產環境域名以及繞過 Cloudflare 的自訂域名
const origins = [
  process.env.FRONTEND_ORIGIN,
  process.env.VITE_DEV_SERVER_ORIGIN,
  'http://localhost:5173'
].filter(Boolean).flatMap(o => o.split(',').map(s => s.trim()));

const corsOptions = {
  origin: origins.length > 0 ? origins : true, // 如果沒設定則預設允許
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'username', 'password_hash', 'Authorization', 'user_id', 'ds']
}
app.use(cors(corsOptions))

// Check is Database Connected
initDb();

// Start Database Backup Schedule
initBackupSchedule();

// HTTPS configuration
const useHttps = process.env.BACKEND_USE_HTTPS === 'true';
// use path.resolve(__dirname, ...) if certs are stored relative to this file
const certPath = path.resolve(__dirname, './cert/cert.pem');
const keyPath = path.resolve(__dirname, './cert/key.pem');

console.log("useHttps:", useHttps);
console.log("certPath:", fs.existsSync(certPath), certPath);
console.log("keyPath:", fs.existsSync(keyPath), keyPath);

if (useHttps && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const credentials = { 
    key: fs.readFileSync(keyPath, 'utf8'), 
    cert: fs.readFileSync(certPath, 'utf8') 
  }

  https.createServer(credentials, app).listen(PORT, () => {
    console.log(`[Backend] Server is running on https://localhost:${PORT} (SSL Enabled)`)
  })
} else {
  // Run the app with HTTP
  app.listen(PORT, () => {
    console.log(`[Backend] Server is running on http://localhost:${PORT}`)
  })
}

app.use('/api', router)

// Serve thumbnails statically for frontend consumption
const thumbsDir = process.env.THUMB_DIR
if (thumbsDir && fs.existsSync(thumbsDir)) {
  app.use('/thumbs', express.static(thumbsDir))
}

app.get('/', (req, res) => res.send('Welcome to visit GABI Media Manager API'))
// Catch-all 404 for unmatched routes (Express v5 compatible)
app.use((req, res) => {
  // return an error
  res.status(404).json({
    status: 'error',
    message: 'Undefined route'
  })
})

