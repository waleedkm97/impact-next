import type { Category, CategoryQuery } from '@/types/category';
import { DEFAULT_CATEGORIES } from '@/lib/data/seed-data';
import { browserDbGet, browserDbSet, migrateLegacyData } from '@/lib/data/browser-db';

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>; findBySlug(slug: string): Promise<Category | null>; findAll(query?: CategoryQuery): Promise<Category[]>;
  create(category: Omit<Category,'id'|'createdAt'|'updatedAt'>): Promise<Category>; update(id:string, category:Partial<Category>):Promise<Category>; delete(id:string):Promise<void>;
  findChildren(parentId:string):Promise<Category[]>; findRootCategories():Promise<Category[]>; buildTree():Promise<Category[]>;
  findByType(type:'course'|'service'|'training',query?:CategoryQuery):Promise<Category[]>; findActiveCategories(query?:CategoryQuery):Promise<Category[]>; search(query:string,limit?:number):Promise<Category[]>; getCount(filter?:CategoryQuery['filter']):Promise<number>; bulkUpdate(ids:string[],updates:Partial<Category>):Promise<void>; reorder(ids:string[]):Promise<void>;
}

type ExtraCategory = Category & { slug?:string; parentId?:string|null; type?:'course'|'service'|'training'; order?:number };
function slugify(v:string){return v.trim().toLowerCase().replace(/\s+/g,'-').replace(/[^\p{L}\p{N}-]/gu,'').replace(/-+/g,'-');}
let categories: ExtraCategory[] = DEFAULT_CATEGORIES.map((c:any,i:number)=>({...c,id:c.id,name:c.name,description:c.description,published:true,slug:slugify(c.name),order:i,createdAt:new Date('2026-01-01'),updatedAt:new Date('2026-01-01')}));
let hydrated=false; let hydration:Promise<void>|null=null;
async function ensureHydrated(){if(hydrated)return;await migrateLegacyData();if(!hydration){hydration=(async()=>{const saved=await browserDbGet<ExtraCategory[]>('categories');if(saved !== null)categories=saved;hydrated=true;})().catch(()=>{hydrated=true;});}await hydration;}
async function persist(){await browserDbSet('categories',categories);}
function matches(c:ExtraCategory,q?:CategoryQuery){const f=q?.filter;if(!f)return true;if(typeof f.published==='boolean'&&c.published!==f.published)return false;if(f.searchQuery&&!`${c.name} ${c.description??''} ${c.slug??''}`.toLowerCase().includes(f.searchQuery.trim().toLowerCase()))return false;return true;}
export class CategoryRepository implements ICategoryRepository{
 async findById(id:string){await ensureHydrated();return categories.find(c=>c.id===id)??null;} async findBySlug(slug:string){await ensureHydrated();const s=slugify(slug);return categories.find(c=>c.slug===s||slugify(c.name)===s)??null;}
 async findAll(q?:CategoryQuery){await ensureHydrated();let r=categories.filter(c=>matches(c,q));r.sort((a,b)=>a.name.localeCompare(b.name,'ar'));if(q?.order==='desc')r.reverse();const o=q?.offset??0;return typeof q?.limit==='number'?r.slice(o,o+q.limit):r.slice(o);}
 async create(input:any){await ensureHydrated();const now=new Date();const c:ExtraCategory={...input,id:input.id??`category-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,slug:input.slug??slugify(input.name),published:input.published??true,createdAt:now,updatedAt:now,order:categories.length};categories.push(c);await persist();return c;}
 async update(id:string,input:any){await ensureHydrated();const i=categories.findIndex(c=>c.id===id);if(i<0)throw new Error('Category not found');categories[i]={...categories[i],...input,id,slug:input.slug??categories[i].slug??slugify(input.name??categories[i].name),updatedAt:new Date()};await persist();return categories[i];}
 async delete(id:string){await ensureHydrated();categories=categories.filter(c=>c.id!==id);await persist();}
 async findChildren(parentId:string){await ensureHydrated();return categories.filter(c=>c.parentId===parentId);}
 async findRootCategories(){await ensureHydrated();return categories.filter(c=>!c.parentId);}
 async buildTree(){await ensureHydrated();return this.findRootCategories();}
 async findByType(type:any,q?:CategoryQuery){await ensureHydrated();return this.findAll(q).then(r=>r.filter(c=>c.type===type));}
 async findActiveCategories(q?:CategoryQuery){await ensureHydrated();return this.findAll({...q,filter:{...q?.filter,published:true}});}
 async search(q:string,limit=20){await ensureHydrated();return this.findAll({filter:{searchQuery:q},limit});}
 async getCount(filter?:CategoryQuery['filter']){await ensureHydrated();return categories.filter(c=>matches(c,{filter} as any)).length;}
 async bulkUpdate(ids:string[],updates:any){await ensureHydrated();const s=new Set(ids);categories=categories.map(c=>s.has(c.id)?{...c,...updates,updatedAt:new Date()}:c);await persist();}
 async reorder(ids:string[]){await ensureHydrated();ids.forEach((id,i)=>{const c=categories.find(x=>x.id===id);if(c)c.order=i;});categories.sort((a,b)=>(a.order??0)-(b.order??0));await persist();}
}
export const categoryRepository=new CategoryRepository();
