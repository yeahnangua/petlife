import { createApp } from './app.js'
import { loadEnv } from './config/env.js'

const config = loadEnv()
const app = createApp(config)

app.listen(config.port, () => {
  console.log(`PetLife backend listening on http://127.0.0.1:${config.port}`)
})
