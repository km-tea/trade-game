import {json,parse} from "./_db.mjs";
export default async event => {
 const b=parse(event);
 if(!process.env.TEACHER_PIN)return json(500,{error:"Netlify 환경 변수 TEACHER_PIN을 설정해야 합니다."});
 if(String(b.pin||"")!==process.env.TEACHER_PIN)return json(401,{error:"인증 번호가 올바르지 않습니다."});
 return json(200,{ok:true,token:process.env.TEACHER_PIN});
};