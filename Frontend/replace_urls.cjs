const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else if (name.endsWith('.js') || name.endsWith('.jsx')) {
      files.push(name);
    }
  }
  return files;
}

const files = getFiles(path.join(__dirname, 'src'));
let updatedCount = 0;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let originalContent = content;

  content = content.replace(
    /'http:\/\/localhost:3000\/api/g,
    "`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api"
  );

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
