const fs = require("fs");
const path = require("path");

module.exports = fs
  .readFileSync(path.join(__dirname, "../../richter_256_colors.txt"), "utf8")
  .trim()
  .split("\n")
  .map((c) => c.trim());
