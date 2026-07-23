import { readFileSync } from "node:fs";
const IMAGE = "https://image.uniqlo.com/UQ/ST3/WesternCommon/imagesgoods/459592/item/goods_56_459592_3x4.jpg";
const MODEL = "Xenova/clip-vit-base-patch32";
const live = JSON.parse(readFileSync("data/products_live.json","utf8")).products;
const outer = live.filter(p=>p.category==="outerwear");
const thumb = u => u.includes("cdn.shopify.com") ? u.split("?")[0]+"?width=224" : u;
const { AutoProcessor, CLIPVisionModelWithProjection, RawImage } = await import("@xenova/transformers");
console.log("loading base…");
const proc = await AutoProcessor.from_pretrained(MODEL);
const vis = await CLIPVisionModelWithProjection.from_pretrained(MODEL,{quantized:true});
const embed = async (url) => { const img=await RawImage.read(url); const inp=await proc(img); const {image_embeds}=await vis(inp); let v=Array.from(image_embeds.data); const n=Math.sqrt(v.reduce((s,x)=>s+x*x,0)); return v.map(x=>x/n); };
const q = await embed(IMAGE);
const dot=(a,b)=>{let s=0;for(let k=0;k<a.length;k++)s+=a[k]*b[k];return s;};
const scored=[];
for(const p of outer){ try{ const v=await embed(thumb(p.image_url)); scored.push({t:p.title,p:p.price,sim:dot(q,v)});}catch{} }
scored.sort((a,b)=>b.sim-a.sim);
console.log("\n=== base CLIP: top 6 outerwear for the olive Uniqlo jacket ===");
scored.slice(0,6).forEach(s=>console.log(`  ${s.sim.toFixed(3)}  ${s.t} £${s.p}`));
