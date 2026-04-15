const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walkDir(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walkDir('src/app');

// We want to replace specific background classes on the main wrappers
// Look for min-h-screen followed/preceded by bg-* 
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace all those specific hardcoded backgrounds with bg-slate-50
    // only if they are near min-h-screen to avoid replacing button colors
    content = content.replace(/(class.*min-h-screen.*?)(?:bg-white|bg-\[#fafaf9\]|bg-\[#f8f9fa\]|bg-gray-50|bg-\[#f3f4f6\])/g, '$1bg-slate-50');
    // For backgrounds coming before min-h-screen
    content = content.replace(/(class.*?)(?:bg-white|bg-\[#fafaf9\]|bg-\[#f8f9fa\]|bg-gray-50|bg-\[#f3f4f6\])(.*?min-h-screen)/g, '$1bg-slate-50$2');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
