import {defineCollection,z} from 'astro:content';
import {glob} from 'astro/loaders';
const schema=z.object({title:z.string(),description:z.string(),date:z.string(),updated:z.string(),category:z.string().default('教程'),tags:z.array(z.string()).default([]),author:z.string().default('编辑部'),draft:z.boolean().default(false)});
export const collections={blog:defineCollection({loader:glob({pattern:'**/*.md',base:'./src/content/blog'}),schema}),pages:defineCollection({loader:glob({pattern:'**/*.md',base:'./src/content/pages'}),schema})};
