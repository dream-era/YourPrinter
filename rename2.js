const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (f === 'node_modules' || f === '.git' || f === '.next') return;
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDirs = [
  './src',
  './docs',
  './desktop-agent',
  './printq-print-agent',
  './printq-backend',
  './drizzle'
];

targetDirs.forEach(dir => {
  walkDir(dir, function(filePath) {
    if (!filePath.match(/\.(ts|tsx|md|json|toml|sql|js)$/)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // UI specifics that might be missed
    content = content.replace(/Find my printer/ig, 'Find YourPrinter');
    content = content.replace(/MY PRINTER/g, 'YOURPRINTER');
    
    content = content.replace(/PrintQ Student/g, 'YourPrinter Student');
    content = content.replace(/PrintQ Hub/g, 'YourPrinter Hub');
    content = content.replace(/Partner with PrintQ/g, 'Partner with YourPrinter');
    content = content.replace(/About PrintQ/g, 'About YourPrinter');
    
    content = content.replace(/\| PrintQ Business/g, '| YourPrinter Shop');
    content = content.replace(/\| PrintQ/g, '| YourPrinter');
    content = content.replace(/PrintQ Business/g, 'YourPrinter Shop');
    
    // Standalone PrintQ
    content = content.replace(/(?<![@\/\-])\bPrintQ\b(?![\_\:\.\-])/g, 'YourPrinter');
    
    // My Printer / MyPrinter
    content = content.replace(/My Printer/g, 'YourPrinter');
    content = content.replace(/(?<!\@)\bMyPrinter\b/g, 'YourPrinter');
    
    // Domains
    content = content.replace(/printq\.com/g, 'yourprinter.in');
    content = content.replace(/myprinter\.com/g, 'yourprinter.in');
    
    if (original !== content) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated: ' + filePath);
    }
  });
});
