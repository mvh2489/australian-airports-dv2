// Create a self-contained preview that opens by double-clicking, without a web server.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// Escape literal closing tags inside vendor templates too: preview servers may
// otherwise inject live-reload JavaScript at a template's </body> string.
const escapeScript=text=>text.replace(/<\/(script|body|head)/gi,'<\\/$1');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
let css=fs.readFileSync(path.join(root,'css/styles.css'),'utf8');
// Embed the licensed local fonts so the double-click preview is self-contained too.
css=css.replace(/url\(['"]?\.\.\/(assets\/fonts\/[^'"\)]+)['"]?\)/g,(_,relative)=>
  `url("data:font/ttf;base64,${fs.readFileSync(path.join(root,relative)).toString('base64')}")`);
html=html.replace('<link rel="stylesheet" href="css/styles.css">',()=>`<style>${css}</style>`);
html=html.replace(/src="(assets\/[^\"]+\.svg)"/g,(_,relative)=>
  `src="data:image/svg+xml;base64,${fs.readFileSync(path.join(root,relative)).toString('base64')}"`);
for(const file of ['vega.min.js','vega-lite.min.js','vega-embed.min.js']){
  html=html.replace(`<script defer src="vendor/${file}"></script>`,()=>`<script>${escapeScript(fs.readFileSync(path.join(root,'vendor',file),'utf8'))}</script>`);
}
html=html.replace('  <script defer src="js/app.js"></script>\n','');
const bundle={};
for(const folder of ['data','js'])for(const file of fs.readdirSync(path.join(root,folder))){
  if(file.endsWith('.json')||file.endsWith('.geojson'))bundle[`${folder}/${file}`]=JSON.parse(fs.readFileSync(path.join(root,folder,file),'utf8'));
}
// Vega-Embed contains a literal </body> in an editor template; insert at the real final body tag.
const bodyEnd=html.lastIndexOf('</body>');
html=html.slice(0,bodyEnd)+`<script>window.__AIRPORT_BUNDLE__=${escapeScript(JSON.stringify(bundle))};</script>\n<script>${escapeScript(fs.readFileSync(path.join(root,'js/app.js'),'utf8'))}</script>\n`+html.slice(bodyEnd);
fs.writeFileSync(path.join(root,'START_HERE.html'),html);
console.log(`Self-contained preview: ${Buffer.byteLength(html)} bytes. No network requests are required for charts.`);
