const express = require('express');
const session = require('express-session')
const fs = require('fs')
const https = require('https')
const cors = require('cors')

const app = express();
const router = require('./routers/router');
const { VideoDb, initDb } = require('./models');

require('dotenv').config();

const PORT = process.env.PORT || 3000

app.use(express.json({ limit: '10mb' }))
app.enable('trust proxy');
app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: 'bla bla bla'
  })
)

// CORS (allow front-end dev server and custom headers for login)
const allowedOrigin = process.env.VITE_DEV_SERVER_ORIGIN || process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const corsOptions = {
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'username', 'password_hash', 'Authorization']
}
app.use(cors(corsOptions))

// Check is Database Connected
initDb();

// Check if the environment is production
const isProduction = process.env.NODE_ENV === 'production'

// Set up HTTPS only in production
if (isProduction && !process.env.NODE_ISLOCAL) {
  const privateKey = fs.readFileSync('./cert/key.pem', 'utf8')
  const certificate = fs.readFileSync('./cert/cert.pem', 'utf8')
  const credentials = { key: privateKey, cert: certificate }

  https.createServer(credentials, app).listen(PORT, () => {
    console.log(`Server is running on https://localhost:${PORT}`)
  })
} else {
  // Run the app with HTTP in non-production environments
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
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

