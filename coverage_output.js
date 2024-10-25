const fs = require('fs');
const path = require('path');

const rootPath = 'coverage/';

let data = fs.readFileSync(
  path.resolve('./coverage/coverage-summary.json'),
  'utf8'
);

data = JSON.parse(data).total;
let output = {
  coverage_pct: data.lines.pct,
  lines_total: data.lines.total,
  lines_covered: data.lines.covered,
  branch_pct: data.branches.pct,
  branches_covered: data.branches.covered,
  branches_total: data.branches.total,
};

console.log('Coverage Output : ', output);
output = JSON.stringify(output, null, 2);
fs.writeFileSync(path.join(rootPath, 'coverage_output.json'), output, 'utf8');
console.log('dumped coverage_output.json');
