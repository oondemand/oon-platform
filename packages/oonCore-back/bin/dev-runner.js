#!/usr/bin/env node
// Bootstrap usado por `oonCore-back dev` sob `node --watch`.
const { start } = require("../src");

start({ cwd: process.cwd() }).catch((err) => {
  console.error(err);
  process.exit(1);
});
