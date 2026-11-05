'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const db = require('../server/db');
const stripGo = sql => sql.replace(/^\s*GO\s*$/gmi, '');

(async () => { try {
  const pool = await db.pool();
  const tables = ['Customers','GroupBookings','Sessions','Movies','Reservations','ReservationSeats',
    'FoodOrders','FoodOrderItems','MenuItems'];
  const sets = (await pool.request().query('USE CinemaLabDB;\n'+tables.map(t=>`SELECT * FROM dbo.${t};`).join('\n'))).recordsets;
  const data = Object.fromEntries(tables.map((t,i)=>[t,sets[i]]));
  const byId = (rows,key) => new Map(rows.map(row=>[row[key],row]));
  const customers=byId(data.Customers,'customer_id');
  const sessions=byId(data.Sessions,'session_id');
  const movies=byId(data.Movies,'movie_id');
  const menu=byId(data.MenuItems,'menu_item_id');
  const average=data.Sessions.reduce((sum,s)=>sum+s.base_price,0)/data.Sessions.length;
  const valid=r=>['held','paid'].includes(r.reservation_status);
  const groups=new Map();
  for (const g of data.GroupBookings) {
    const session=sessions.get(g.session_id);
    const reservations=data.Reservations.filter(r=>r.group_id===g.group_id && r.session_id===g.session_id && valid(r));
    const seats=data.ReservationSeats.filter(rs=>rs.session_id===g.session_id && reservations.some(r=>r.reservation_id===rs.reservation_id));
    const members=new Map();
    for (const r of reservations) {
      const count=seats.filter(rs=>rs.reservation_id===r.reservation_id).length;
      if (count) members.set(r.customer_id,(members.get(r.customer_id)||0)+count);
    }
    const orders=data.FoodOrders.filter(fo=>fo.order_status!=='cancelled' && reservations.some(r=>r.reservation_id===fo.reservation_id));
    const food=data.FoodOrderItems.filter(i=>i.quantity>0 && orders.some(fo=>fo.food_order_id===i.food_order_id));
    const popcorn=food.some(i=>{
      const item=menu.get(i.menu_item_id);
      return item.category==='Попкорн' || /попкорн|popcorn/i.test(item.item_name);
    });
    groups.set(g.group_id,{g,session,members,seats,food,popcorn,
      qualifies:session.start_at.getUTCHours()>=18 && session.base_price>average && seats.length>0 && !popcorn});
  }
  const main=fs.readFileSync('sql/07_group_evening_no_popcorn.sql','utf8');
  const result=(await pool.request().query(stripGo(main))).recordset;
  const expected=new Map();
  const memberList=(group,exclude) => [...group.members.keys()].filter(id=>id!==exclude)
    .sort((a,b)=>a-b).map(id=>`${id} — ${customers.get(id).full_name}`).join('; ');
  for (const group of groups.values()) if(group.qualifies) {
    for (const [id,count] of group.members) expected.set(`${group.g.group_id}:${id}`,{group,id,count});
  }
  assert.equal(result.length,expected.size,'Filtered row count');
  const seen=new Set();
  for(const row of result) {
    const key=`${row['Топтық тапсырыс ID']}:${row['Клиент ID']}`;
    assert(!seen.has(key),'One row per customer and group'); seen.add(key);
    const exp=expected.get(key); assert(exp,`Unexpected filtered row ${key}`);
    const {group,id,count}=exp;
    assert.equal(row['Клиенттің аты-жөні'],customers.get(id).full_name);
    assert.equal(row['Топ ұйымдастырушысы'],customers.get(group.g.organizer_customer_id).full_name);
    assert.equal(row['Бірге брондағандар'],memberList(group,id)||'Басқа клиент тіркелмеген');
    assert.equal(row['Клиент брондаған орын саны'],count);
    assert.equal(row['Адам саны'],group.seats.length);
    assert.equal(row['Тапсырыс берген клиент саны'],group.members.size);
    assert.equal(row['Фильм'],movies.get(group.session.movie_id).title);
    assert.equal(row['Сеанс бағасы'],group.session.base_price);
    assert(Math.abs(row['Барлық сеанстың орташа бағасы']-average)<0.01);
  }
  const all=(await pool.request().query(stripGo(fs.readFileSync('sql/11_all_group_bookings.sql','utf8')))).recordset;
  assert.equal(all.length,groups.size);
  for(const row of all) {
    const group=groups.get(row['Топ ID']);
    assert.equal(row['Топтағы барлық клиенттер'],memberList(group,null)||'Қатысушы тіркелмеген');
    assert.equal(row['Ұйымдастырушымен бірге брондағандар'],memberList(group,group.g.organizer_customer_id)||'Басқа клиент тіркелмеген');
    assert.equal(row['Клиент саны'],group.members.size);
    assert.equal(row['Брондалған орын саны'],group.seats.length);
  }
  const strict=main.replace('\nORDER BY s.start_at',`\nAND EXISTS (
    SELECT 1 FROM dbo.Reservations r JOIN dbo.FoodOrders fo ON fo.reservation_id=r.reservation_id
    JOIN dbo.FoodOrderItems foi ON foi.food_order_id=fo.food_order_id
    WHERE r.group_id=gb.group_id AND r.session_id=gb.session_id
      AND r.reservation_status IN ('held','paid') AND fo.order_status<>'cancelled' AND foi.quantity>0
  )\nORDER BY s.start_at`);
  const strictResult=(await pool.request().query(stripGo(strict))).recordset;
  assert.equal(strictResult.length,[...expected.values()].filter(e=>e.group.food.length>0).length);
  const popcornControl=[...groups.values()].find(g=>g.g.invite_code==='DEMO-TEAM-20261105-13');
  const cheapControl=[...groups.values()].find(g=>g.g.invite_code==='DEMO-TEAM-20261105-14');
  assert(popcornControl.popcorn && !popcornControl.qualifies);
  assert(cheapControl.session.base_price<=average && !cheapControl.qualifies);
  const example=result.find(row=>row['Топтық тапсырыс ID']===1 && row['Клиент ID']===34);
  if (example) assert.equal(example['Бірге брондағандар'],
    '1 — Дарханбай Қуаныш; 2 — Данияров Ерасыл; 3 — Меделханов Бағыжан; 4 — Заманбек Аманжол');
  const summary={verified_at:new Date().toISOString(),database:'CinemaLabDB',
    total_groups:groups.size,group_booking_customer_rows:[...groups.values()].reduce((n,g)=>n+g.members.size,0),
    total_group_seats:[...groups.values()].reduce((n,g)=>n+g.seats.length,0),
    total_valid_reserved_seats:data.ReservationSeats.filter(rs=>data.Reservations.some(r=>r.reservation_id===rs.reservation_id && valid(r))).length,
    qualifying_groups:[...groups.values()].filter(g=>g.qualifies).length,
    qualifying_customer_rows:result.length,qualifying_group_seats:[...groups.values()].filter(g=>g.qualifies).reduce((n,g)=>n+g.seats.length,0),
    food_order_required_rows:strictResult.length,popcorn_group_excluded:true,cheap_group_excluded:true,
    independent_counts_and_companions_match:true,example};
  fs.mkdirSync('docs/group-booking-evidence',{recursive:true});
  fs.writeFileSync('docs/group-booking-evidence/query-validation.json',JSON.stringify(summary,null,2));
  console.log(JSON.stringify(summary));
} finally { await db.closePool(); } })().catch(e=>{console.error(e.message);process.exitCode=1;});
