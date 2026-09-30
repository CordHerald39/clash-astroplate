import {indexable,full} from '../lib/site';export function GET(){return new Response(indexable?'User-agent: *\nAllow: /\nSitemap: '+full('/sitemap.xml')+'\n':'User-agent: *\nDisallow: /\n')}
