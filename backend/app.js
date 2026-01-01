const express = require('express');
const session = require('express-session')
const fs = require('fs')
const https = require('https')

const app = express();
const router = require('./routers/router')

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

// Check if the environment is production
const isProduction = process.env.NODE_ENV === 'production'

// Set up HTTPS only in production
if (isProduction) {
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

app.get('/', (req, res) => res.send('Welcome to visit GABI Media Manager API'))
// Catch-all 404 for unmatched routes (Express v5 compatible)
app.use((req, res) => {
  // return an error
  res.status(404).json({
    status: 'error',
    message: 'Undefined route'
  })
})

