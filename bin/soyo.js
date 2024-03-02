#!/usr/bin/env node

const path = require('path')
const fs = require('fs')

const entryPath = path.join(__dirname, '../dist/index.js')
const entryPath2 = path.join(__dirname, '../dist/dist/index.js')
const script = fs.existsSync(entryPath) ? entryPath : entryPath2

require(script)
  .main()
  .catch((err) => {
    console.log(err)
  })
