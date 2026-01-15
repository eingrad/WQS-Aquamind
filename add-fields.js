const fs = require("fs");
const path = require("path");

const filePath =
  "c:\\Users\\arif\\Downloads\\petronas-monitoring-system-dashboard\\petronas-monitoring-system-dashboard\\src\\data\\validationData.ts";

// Read the file
let content = fs.readFileSync(filePath, "utf8");

// Pattern to match: humidityStatus: "...",\n    radiation:
const pattern = /(humidityStatus: "[^"]+",)\r?\n(\s+)(radiation:)/g;

// Replacement: add pressure and rain fields between humidity and radiation
const replacement = `$1\r\n$2pressure: 1013.25,\r\n$2pressureStatus: "valid",\r\n$2rain: 0.0,\r\n$2rainStatus: "valid",\r\n$2$3`;

// Replace all occurrences
content = content.replace(pattern, replacement);

// Write back
fs.writeFileSync(filePath, content, "utf8");

console.log(
  "Successfully added pressure and rain fields to all remaining rows!"
);
