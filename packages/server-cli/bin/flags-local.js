#!/usr/bin/env node
const { createFlagsServer } = require('../dist/server');

const args = process.argv.slice(2);
let port = 4040;
let file = undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' || args[i] === '-p') {
    port = parseInt(args[i + 1], 10) || 4040;
    i++;
  } else if (args[i] === '--file' || args[i] === '-f') {
    file = args[i + 1];
    i++;
  }
}

const app = createFlagsServer({ port, storePath: file });
app.start();
