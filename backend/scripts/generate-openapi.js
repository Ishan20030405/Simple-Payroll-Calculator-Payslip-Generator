const fs = require('node:fs');
const path = require('node:path');
const document = require('../src/docs/openapi');
const folder=path.join(__dirname,'../docs');
fs.mkdirSync(folder,{recursive:true});
fs.writeFileSync(path.join(folder,'openapi.json'),JSON.stringify(document,null,2)+'\n');
console.log(`Exported ${Object.values(document.paths).reduce((n,item)=>n+Object.keys(item).length,0)} operations to docs/openapi.json`);
