#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const srcDir = path.join(__dirname, 'docs-example/src/assets')
const publicDir = path.join(__dirname, 'docs-example/public/assets')

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return
  
  fs.mkdirSync(dest, { recursive: true })
  
  const entries = fs.readdirSync(src, { withFileTypes: true })
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

console.log('Copying assets to public directory...')
copyDir(srcDir, publicDir)
console.log('Assets copied successfully!')
