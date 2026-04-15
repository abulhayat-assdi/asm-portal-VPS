const fs = require('fs');
const glob = require('child_process').execSync('ls src/components/ui/*.tsx').toString().trim().split('\n');

glob.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace py-[5px] with py-[15px]
    content = content.replace(/py-\[5px\]/g, 'py-[15px]');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated sections in ${file}`);
    }
});
