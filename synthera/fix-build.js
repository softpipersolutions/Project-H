#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to fix critical React hooks issues
const filesToFix = [
  'src/app/library/page.tsx',
  'src/app/profile/edit/page.tsx'
];

function fixHooksInFile(filePath) {
  console.log(`Fixing hooks in ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} not found, skipping...`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the most common hook pattern - move useQuery before conditionals
  content = content.replace(
    /if \(status === 'loading'\) \{[\s\S]*?\}\s*if \(!session\?\.\w+\) \{[\s\S]*?\}\s*(const \{ data: \w+, isLoading \} = useQuery\({[\s\S]*?\}\))/,
    '$1\n\n  if (status === \'loading\') {\n    return (\n      <div className="min-h-screen">\n        <Navbar />\n        <div className="container mx-auto px-4 py-8 flex items-center justify-center">\n          <Loader2 className="w-8 h-8 animate-spin" />\n        </div>\n      </div>\n    )\n  }\n\n  if (!session?.user) {\n    redirect(\'/auth/signin\')\n  }'
  );
  
  // Fix apostrophes
  content = content.replace(/Here's/g, "Here&apos;s");
  content = content.replace(/doesn't/g, "doesn&apos;t");
  content = content.replace(/can't/g, "can&apos;t");
  content = content.replace(/won't/g, "won&apos;t");
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${filePath}`);
}

// Fix files
filesToFix.forEach(fixHooksInFile);

console.log('Build fixes applied!');