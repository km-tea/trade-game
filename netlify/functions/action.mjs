import {db,json,parse,RECIPES,RES_KEYS,log} from "./_db.mjs";
export default async event => {
 const b=parse(event), a=b.action, sql=db();
 try {
  if(a==="reset"){
   const pin=String(b.pin||"");
   if(!process.env.TEACHER_PIN||pin!==process.env.TEACHER_PIN)return json(401,{error:"교사 인증 번호가 올바르지 않습니다."});
   await sql`BEGIN`;
   await sql`DELETE FROM crafted_items`; await sql`DELETE FROM trade_proposals`; await sql`DELETE FROM trade_history`;
   await sql`UPDATE trade_groups SET coins=10,resources=CASE group_no
    WHEN 1 THEN '{"wood":4,"cotton":4,"iron":1,"oil":0,"food":1,"gold":0}'::jsonb
    WHEN 2 THEN '{"iron":4,"oil":4,"wood":1,"cotton":0,"food":0,"gold":1}'::jsonb
    WHEN 3 THEN '{"oil":4,"food":4,"wood":0,"iron":1,"cotton":1,"gold":0}'::jsonb
    WHEN 4 THEN '{"cotton":4,"food":4,"wood":1,"iron":0,"oil":0,"gold":1}'::jsonb
    WHEN 5 THEN '{"gold":4,"wood":4,"iron":0,"oil":1,"cotton":0,"food":1}'::jsonb
    ELSE '{"iron":4,"gold":4,"wood":0,"oil":1,"cotton":1,"food":0}'::jsonb END`;
   await sql`UPDATE game_settings SET timer_seconds=60,timer_running=false WHERE id=1`;
   return json(200,{ok:true});
  }
  if(a==="timer-toggle"||a==="timer-reset"){
   const pin=String(b.pin||"");
   if(!process.env.TEACHER_PIN||pin!==process.env.TEACHER_PIN)return json(401,{error:"타이머 조작은 교사 인증이 필요합니다. 요청에 pin을 포함해야 합니다."});
   if(a==="timer-reset")await sql`UPDATE game_settings SET timer_seconds=60,timer_running=false WHERE id=1`;
   else await sql`UPDATE game_settings SET timer_running=NOT timer_running WHERE id=1`;
   return json(200,{ok:true});
  }
  const n=Number(b.group_no);
  if(!Number.isInteger(n)||n<1||n>6)return json(400,{error:"올바른 모둠을 선택해 주세요."});
  const rows=await sql`SELECT group_no,coins,resources FROM trade_groups WHERE group_no=${n} FOR UPDATE`;
  if(!rows.length)return json(404,{error:"모둠을 찾을 수 없습니다."});
  let g=rows[0], res={...g.resources};
  if(a==="bank-buy"||a==="bank-sell"){
   const k=b.resource;if(!RES_KEYS.includes(k))return json(400,{error:"올바르지 않은 자원입니다."});
   if(a==="bank-buy"){if(Number(g.coins)<3)return json(400,{error:"코인이 부족합니다."});g.coins=Number(g.coins)-3;res[k]=(res[k]||0)+1;}
   else {if((res[k]||0)<1)return json(400,{error:"판매할 자원이 없습니다."});res[k]--;g.coins=Number(g.coins)+2;}
   await sql`UPDATE trade_groups SET coins=${g.coins},resources=${JSON.stringify(res)}::jsonb WHERE group_no=${n}`;
   await log(sql,n,a==="bank-buy"?"은행 구매":"은행 판매",`${k} ${a==="bank-buy"?"구매":"판매"}`);
  } else if(a==="craft"){
   const r=RECIPES.find(x=>x.id===b.recipe_id);if(!r)return json(400,{error:"조합 공식을 찾을 수 없습니다."});
   for(const [k,v] of Object.entries(r.req))if((res[k]||0)<v)return json(400,{error:"재료가 부족합니다."});
   const exists=await sql`SELECT id FROM crafted_items WHERE group_no=${n} AND recipe_id=${r.id}`;
   if(exists.length)return json(400,{error:"이미 제작한 가공품입니다."});
   for(const [k,v] of Object.entries(r.req))res[k]-=v;
   await sql`UPDATE trade_groups SET resources=${JSON.stringify(res)}::jsonb WHERE group_no=${n}`;
   await sql`INSERT INTO crafted_items(group_no,recipe_id) VALUES(${n},${r.id})`;
   await log(sql,n,"가공품 제작",`${r.name} · ${r.score}점`);
  } else if(a==="proposal"){
   const to=Number(b.to_group),message=String(b.message||"").trim(),offer=String(b.offer||"").trim(),want=String(b.want||"").trim();
   if(!Number.isInteger(to)||to<1||to>6||to===n)return json(400,{error:"상대 모둠을 확인해 주세요."});
   if(!message||!offer||!want||message.length>200||offer.length>100||want.length>100)return json(400,{error:"제안 내용을 확인해 주세요."});
   const p=await sql`INSERT INTO trade_proposals(from_group,to_group,message,offer,want) VALUES(${n},${to},${message},${offer},${want}) RETURNING id`;
   await log(sql,n,"무역 제안 발송",`${to}모둠 · ${message}`);
  } else if(a==="proposal-respond"){
   const id=Number(b.proposal_id),answer=b.answer==="accept"?"accepted":"rejected";
   const p=await sql`UPDATE trade_proposals SET status=${answer},responded_at=NOW() WHERE id=${id} AND to_group=${n} AND status='pending' RETURNING from_group,to_group,message`;
   if(!p.length)return json(400,{error:"이미 처리되었거나 해당 모둠의 제안이 아닙니다."});
   await log(sql,n,answer==="accepted"?"무역 제안 수락":"무역 제안 거절",`${p[0].from_group}모둠 · ${p[0].message}`);
   // 수락은 합의 표시만 기록하며 실제 자원 이동은 별도 교환 기능에서 처리하도록 함.
  } else return json(400,{error:"지원하지 않는 작업입니다."});
  return json(200,{ok:true});
 } catch(e){return json(500,{error:e.message||"작업을 처리하지 못했습니다."})}
};