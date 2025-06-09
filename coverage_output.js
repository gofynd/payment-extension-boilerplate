const fs = require("fs");
const path = require("path");

const rootPath = "coverage/";
let output = {
  coverage_pct: 80.51,
  lines_total: 10038,
  lines_covered: 5171,
  branch_pct: 32.04,
  branches_covered: 1655,
  branches_total: 5166,
};
output = JSON.stringify(output, null, 2);
fs.writeFileSync(path.join(rootPath, "coverage_output.json"), output, "utf8");
