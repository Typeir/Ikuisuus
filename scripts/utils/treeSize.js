const fs = require('fs');
const path = require('path');

let totalItems = 0;
let totalBytes = 0;

const getFolderSize = (dir) => {
  let folderSize = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    totalItems++;

    if (entry.isDirectory()) {
      folderSize += getFolderSize(fullPath);
    } else {
      const stats = fs.statSync(fullPath);
      folderSize += stats.size;
    }
  }

  return folderSize;
};

const printTree = (dir, prefix = '') => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const folderSize = getFolderSize(dir);
  totalBytes += folderSize;

  const sizeMB = (folderSize / (1024 * 1024)).toFixed(2);
  console.log(`${prefix}${path.basename(dir)}/ — ${sizeMB} MB`);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      printTree(fullPath, prefix + '  ');
    }
  }
};

// Usage: node treeSize.js /path/to/folder
const targetDir = process.argv[2];

if (!targetDir) {
  console.error('Usage: node treeSize.js /path/to/folder');
  process.exit(1);
}

printTree(path.resolve(targetDir));

console.log('\nSummary:');
console.log(`Total items: ${totalItems}`);
console.log(`Total size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
