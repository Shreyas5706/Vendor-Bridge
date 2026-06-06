const fs = require('fs');
const path = require('path');
const glob = require('glob');

const files = glob.sync('src/**/*.{js,jsx}');
let updatedCount = 0;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let originalContent = content;

  // Replace 'http://localhost:3000/api
  content = content.replace(
    /'http:\/\/localhost:3000\/api/g,
    "`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api"
  );

  // Replace `http://localhost:3000/api
  content = content.replace(
    /`http:\/\/localhost:3000\/api/g,
    "`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api"
  );

  if (content !== originalContent) {
    fs.writeFileSync(f, content);
    console.log(`Updated ${f}`);
    updatedCount++;
  }
});

console.log(`Done. Updated ${updatedCount} files.`);
