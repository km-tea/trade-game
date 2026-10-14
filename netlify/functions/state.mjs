import {db,json,RECIPES} from "./_db.mjs";
export default async () => {
 try {
  const sql=db();
  const groups=await sql`SELECT group_no,coins,resources FROM trade_groups ORDER BY group_no`;
  const crafted=await sql`SELECT group_no,recipe_id FROM crafted_items ORDER BY id`;
  const proposals=await sql`SELECT id,from_group,to_group,message,offer,want,status,created_at FROM trade_proposals ORDER BY created_at DESC LIMIT 100`;
  const history=await sql`SELECT id,group_no,title,detail,created_at FROM trade_history ORDER BY created_at DESC LIMIT 30`;
  const gameRows=await sql`SELECT timer_seconds,timer_running FROM game_settings WHERE id=1`;
  const groupsOut=groups.map(g=>{const mine=crafted.filter(c=>c.group_no===g.group_no);return {...g,resources:g.resources||{},crafted_ids:mine.map(x=>x.recipe_id),crafted_names:mine.map(x=>RECIPES.find(r=>r.id===x.recipe_id)?.name||x.recipe_id).join(", "),score:mine.reduce((s,x)=>s+(RECIPES.find(r=>r.id===x.recipe_id)?.score||0),0)}});
  return json(200,{groups:groupsOut,proposals,history,game:gameRows[0]||{timer_seconds:60,timer_running:false}});
 } catch(e){return json(500,{error:e.message||"상태를 불러오지 못했습니다."})}
};