import fs from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Teams will only load a tab over HTTPS, so in local debug we serve with the
 * dev certificate the Agents Toolkit generates and trusts (the "devCert"
 * prerequisite in .vscode/tasks.json). It writes SSL_CRT_FILE / SSL_KEY_FILE
 * into .localConfigs, which `npm run dev:teamsfx` loads.
 *
 * Without those vars we fall back to plain HTTP so `npm run dev` still works
 * in a normal browser outside Teams.
 */
const crt = process.env.SSL_CRT_FILE
const key = process.env.SSL_KEY_FILE
const https =
  crt && key && fs.existsSync(crt) && fs.existsSync(key)
    ? { cert: fs.readFileSync(crt), key: fs.readFileSync(key) }
    : undefined

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Must match TAB_ENDPOINT in m365agents.local.yml and the port list in
    // the "Validate prerequisites" task.
    port: 53000,
    strictPort: true,
    https,
  },
})
