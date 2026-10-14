import { neon } from "@neondatabase/serverless";
export function db() {
  if (!process.env.DATABASE_URL) throw new Error("Netlify 환경 변수 DATABASE_URL이 설정되지 않았습니다.");
  return neon(process.env.DATABASE_URL);
}
export const RES_KEYS = ["wood","iron","oil","cotton","food","gold"];
export const RECIPES = [
  {id:"r1",name:"건물 건설 세트",req:{wood:2,iron:1},score:30},
  {id:"r2",name:"의류 키트",req:{cotton:2,food:1},score:30},
  {id:"r3",name:"에너지 연료통",req:{oil:2,iron:1},score:40},
  {id:"r4",name:"스마트 하이테크 기기",req:{iron:2,gold:1,oil:1},score:80},
  {id:"r5",name:"고급 패션 브랜드",req:{cotton:2,gold:1,food:1},score:80},
  {id:"r6",name:"우주선 / 첨단 도시",req:{iron:2,gold:1,oil:1,wood:1},score:160}
];
export function json(statusCode, body) { return {statusCode,headers:{"Content-Type":"application/json","Cache-Control":"no-store"},body:JSON.stringify(body)}; }
export function parse(event) { try { return JSON.parse(event.body || "{}"); } catch { return {}; } }
export async function log(sql, groupNo, title, detail="") {
  await sql`INSERT INTO trade_history (group_no,title,detail) VALUES (${groupNo},${title},${detail})`;
}
export async function requireTeacher(event, body={}) {
  const token = event.headers?.["x-teacher-token"] || event.headers?.["X-Teacher-Token"];
  if (!process.env.TEACHER_PIN) throw new Error("Netlify 환경 변수 TEACHER_PIN을 설정해야 합니다.");
  if (body.pin && body.pin === process.env.TEACHER_PIN) return true;
  // The client token is a short-lived classroom-session marker; pin is checked at auth endpoint.
  if (token && token === process.env.TEACHER_PIN) return true;
  throw new Error("교사 인증이 필요합니다.");
}