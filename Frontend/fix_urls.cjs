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

  // We are fixing lines like:
  // const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/auth/company-dashboard', config);
  // to:
  // const response = await axios.get(`${import.meta.env.BACKEND_URL}/api/auth/company-dashboard`, config);

  // Regex to match the broken string structure
  const regex = /\$\{import\.meta\.env\.VITE_BACKEND_URL \|\| 'http:\/\/localhost:3000'\}\/api([^']*)'/g;
  
  content = content.replace(regex, (match, route) => {
    return `\${import.meta.env.BACKEND_URL}/api${route}\``;
  });

  // There are also valid ones that didn't have a trailing single quote, like:
  // `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/auth/quotation/${quotationId}/approve`
  // We should replace those too.
  const regex2 = /\$\{import\.meta\.env\.VITE_BACKEND_URL \|\| 'http:\/\/localhost:3000'\}\/api/g;
  content = content.replace(regex2, '${import.meta.env.BACKEND_URL}/api');

  if (content !== originalContent) {
    fs.writeFileSync(f, content);
    console.log(`Updated ${f}`);
    updatedCount++;
  }
});

console.log(`Done. Updated ${updatedCount} files.`);
