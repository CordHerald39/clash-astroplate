import {defineConfig} from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
const supplied=process.env.SITE_URL;
const url=new URL(supplied||'http://localhost:4192');
const base=process.env.BASE_PATH||url.pathname;
export default defineConfig({site:url.origin,base,trailingSlash:'always',output:'static',vite:{plugins:[tailwindcss()]}});
