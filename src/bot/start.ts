// Standalone bot runner script
// Run with: npx tsx src/bot/start.ts

import 'dotenv/config'
import { startBot } from './index'

startBot().catch(console.error)
