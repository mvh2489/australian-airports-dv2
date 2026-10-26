// Optional local preview build; GitHub Pages can serve index.html directly from main.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'dist');fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out);
for(const relative of ['index.html','START_HERE.html','css','js','data','assets','vendor','documentation'])fs.cpSync(path.join(root,relative),path.join(out,relative),{recursive:true});
console.log('Built dist/ for local preview.');
