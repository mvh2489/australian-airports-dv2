// Run from the repository root: node qa/validate.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const root=process.cwd();
const output=path.join(root,'qa/rendered');fs.mkdirSync(output,{recursive:true});
const require=createRequire(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'__airports_qa.cjs'));
const sharp=require('sharp');
const ctx=vm.createContext({structuredClone,setTimeout,clearTimeout,console,performance,URL,URLSearchParams,fetch,TextEncoder,TextDecoder});
for(const f of ['vega.min.js','vega-lite.min.js'])vm.runInContext(fs.readFileSync(path.join(root,'vendor',f),'utf8'),ctx);
const vega=ctx.vega,vl=ctx.vegaLite,warnings=[];
const logger={level(){return this;},warn(...a){warnings.push(a.join(' '));},error(...a){throw Error(a.join(' '));},info(){},debug(){}};
const json=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
function hydrate(node){
  if(!node||typeof node!=='object')return;
  if(Array.isArray(node)){node.forEach(hydrate);return;}
  if(node.data&&!Array.isArray(node.data)&&node.data.url){
    const raw=json(node.data.url);node.data.values=node.data.format?.property?raw[node.data.format.property]:raw;
    delete node.data.url;delete node.data.format;
  }
  if(node.$schema?.includes('/vega/v5.json')&&Array.isArray(node.data))for(const item of node.data)if(item.url){
    const raw=json(item.url);item.values=item.format?.property?raw[item.format.property]:raw;delete item.url;delete item.format;
  }
  Object.values(node).forEach(hydrate);
}
const files=fs.readdirSync(path.join(root,'js')).filter(x=>x.endsWith('.vg.json')).sort();
assert.equal(files.length,13);
for(const file of files){
  for(const width of [900,380]){
    const spec=json('js/'+file);hydrate(spec);spec.width=width;
    if(/airport-map|flow-map|choropleth/.test(file))spec.height=Math.max(330,Math.round(width*.66));
    const compiled=spec.$schema.includes('vega-lite')?vl.compile(spec,{logger}).spec:spec;
    const view=new vega.View(vega.parse(compiled),{renderer:'none',logger}).initialize();
    await view.runAsync();
    const svg=await view.toSVG();assert(svg.includes('<svg'));assert(!svg.includes('NaN'),file+' has invalid geometry');
    const suffix=width===380?'-narrow':'';
    fs.writeFileSync(path.join(output,file.replace('.vg.json',suffix+'.svg')),svg);
    await sharp(Buffer.from(svg)).flatten({background:'#fff'}).png().toFile(path.join(output,file.replace('.vg.json',suffix+'.png')));
    if(file.startsWith('08-')){
      assert.equal(view.data('visible').length,15);assert.equal(view.data('arrows').length,30);
      assert(view.data('arrows').every(d=>Number.isFinite(d.angle)&&Number.isFinite(d.px)&&Number.isFinite(d.py)));
      view.signal('Hub','Perth').signal('RouteLimit',62);await view.runAsync();
      const perth=view.data('visible');assert(perth.length>0&&perth.length<62);
      assert(perth.every(d=>d.origin==='Perth'||d.destination==='Perth'));
      assert.equal(view.data('arrows').length,perth.length*2);
      view.signal('ShowArrows',false);await view.runAsync();assert.equal(view.signal('ShowArrows'),false);
    }
    if(file.startsWith('13-')){view.signal('RankAirport','Brisbane');await view.runAsync();assert.equal(view.signal('RankAirport'),'Brisbane');}
    view.finalize();
  }
  console.log('PASS',file);
}
const airports=json('data/airports.json'),routes=json('data/routes.json'),states=json('data/state_traffic.json'),history=json('data/airport_history.json');
assert.equal(airports.length,116);assert.equal(routes.length,124);assert.equal(history.length,121);assert.equal(states.length,8);
assert.equal(new Set(airports.map(d=>d.airport)).size,58);
assert.equal(new Set(airports.map(d=>d.iata+'-'+d.year)).size,116);
assert.equal(new Set(routes.map(d=>d.route+'-'+d.year)).size,124);
assert.equal(states.reduce((s,d)=>s+d.passengers,0),119231300);
assert.equal(json('data/waterfall.json').at(-1).end,2593700);
assert(routes.every(d=>d.seats>=d.passengers&&d.load_factor>=0&&d.load_factor<=1));
assert.equal(routes.filter(d=>Math.abs(d.passengers/d.seats-d.load_factor)>=.001).length,1);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(!html.includes('<!-- <section'),'story section is commented out');
for(const anchor of ['network','recovery','regions','routes'])assert(html.includes(`id="${anchor}"`)&&html.includes(`href="#${anchor}"`));
for(const [,file] of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(!/^(https?:|data:)/.test(file))assert(fs.existsSync(path.join(root,file)),file);
const standalone=fs.readFileSync(path.join(root,'START_HERE.html'),'utf8');
assert.equal(standalone.match(/data:font\/ttf;base64,/g).length,2);
assert(standalone.includes('data:image/svg+xml;base64,'));
assert(!standalone.match(/<script[^>]+src=/));
for(const [,script] of standalone.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(script);
console.log('PASS source reconciliation, routes, anchors, assets, embedded fonts/image and standalone scripts');
console.log('WARNINGS',JSON.stringify([...new Set(warnings)]));
assert.equal(warnings.length,0,'Vega warnings require review');
