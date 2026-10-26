// Verify that the standalone app can load every chart without fetch access.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync('START_HERE.html','utf8');
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
const elements=new Map(),seen=[];
const document={getElementById(id){if(!elements.has(id))elements.set(id,{id,clientWidth:800,innerHTML:'',appendChild(){}});return elements.get(id);},querySelectorAll(){return [];},createElement(){return {appendChild(){}};}};
const ctx=vm.createContext({window:{},document,location:{hash:''},structuredClone,console,
  fetch(){throw Error('Standalone preview attempted a network fetch');},ResizeObserver:class{observe(){}},
  vegaEmbed:async(container,spec)=>{seen.push({id:container.id,spec});return {view:{width(){return this;},height(){return this;},resize(){return this;},runAsync:async()=>{}}};}});
vm.runInContext(scripts.find(x=>x.startsWith('window.__AIRPORT_BUNDLE__=')),ctx);
vm.runInContext(fs.readFileSync('js/app.js','utf8'),ctx);
await ctx.window.__AIRPORT_READY__;
assert.equal(seen.length,13);assert.equal(new Set(seen.map(x=>x.id)).size,13);
function noURL(node){if(!node||typeof node!=='object')return;if(node.data&&!Array.isArray(node.data))assert(!node.data.url);if(Array.isArray(node.data))node.data.forEach(d=>assert(!d.url));Object.values(node).forEach(noURL);}
seen.forEach(x=>noURL(x.spec));
console.log('PASS: all 13 charts load from the standalone bundle with fetch unavailable.');
