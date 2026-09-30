export const name='Clash 中文下载站';
export const base=import.meta.env.BASE_URL.replace(/\/$/,'');
export const href=(p:string)=>base+p;
export const indexable=Boolean(process.env.SITE_URL)&&process.env.ALLOW_INDEX!=='false';
export const site=process.env.SITE_URL?new URL(process.env.SITE_URL).origin:'http://localhost:4202';
export const full=(p:string)=>site+href(p);
