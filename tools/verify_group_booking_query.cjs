'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const db = require('../server/db');
const stripGo = sql => sql.replace(/^\s*GO\s*$/gmi, '');

(async () => { try {
  const pool = await db.pool();
  const tables = ['Customers','GroupBookings','Sessions','Movies','Reservations','ReservationSeats',
    'FoodOrders','FoodOrderItems','MenuItems','Payments'];
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
    const seatedReservations=reservations.filter(r=>seats.some(rs=>rs.reservation_id===r.reservation_id));
    const paidReservations=seatedReservations.filter(r=>data.Payments.some(p=>p.reservation_id===r.reservation_id&&p.payment_status==='demo_paid'));
    groups.set(g.group_id,{g,session,members,seats,orders,food,popcorn,seatedReservations,paidReservations,
      qualifies:session.start_at.getUTCHours()>=18 && session.base_price>average && seats.length>0 && !popcorn});
  }
  const main=fs.readFileSync('sql/07_group_evening_no_popcorn.sql','utf8');
  const detail=fs.readFileSync('sql/14_group_members_and_food.sql','utf8');
  const allSql=fs.readFileSync('sql/11_all_group_bookings.sql','utf8');
  const paymentSql=fs.readFileSync('sql/15_group_payment_details.sql','utf8');
  const foodSql=fs.readFileSync('sql/16_group_food_orders.sql','utf8');
  assert(!/\b(COALESCE|ISNULL|STRING_AGG|CONCAT|APPLY|ROW_NUMBER)\s*\(/i.test(main+detail+allSql+paymentSql+foodSql),
    'Student queries must use the requested basic SQL approach');
  const result=(await pool.request().query(stripGo(main))).recordset;
  const expected=new Map();
  const qualifying=[...groups.values()].filter(g=>g.qualifies).sort((a,b)=>
    a.session.start_at-b.session.start_at || a.g.group_id-b.g.group_id);
  for (const group of qualifying.slice(0,6)) expected.set(group.g.group_id,group);
  assert.equal(result.length,expected.size,'Filtered row count');
  const seen=new Set();
  for(const row of result) {
    const key=row['Топ ID'];
    assert(!seen.has(key),'One row per group'); seen.add(key);
    const group=expected.get(key); assert(group,`Unexpected filtered group ${key}`);
    assert.equal(row['Ұйымдастырушы ID'],group.g.organizer_customer_id);
    assert.equal(row['Топ ұйымдастырушысы'],customers.get(group.g.organizer_customer_id).full_name);
    const popcornOrders=new Set(group.food.filter(i=>{
      const item=menu.get(i.menu_item_id);
      return item.category==='Попкорн' || /попкорн|popcorn/i.test(item.item_name);
    }).map(i=>i.food_order_id));
    assert.equal(row['Попкорны бар тапсырыс саны'],popcornOrders.size);
    assert.equal(row['Попкорны бар тапсырыс саны'],0);
    assert.equal(row['Брондалған орын саны'],group.seats.length);
    assert.equal(row['Брондаған клиент саны'],group.members.size);
    assert.equal(row['Төленген бронь саны'],group.paidReservations.length);
    assert.equal(row['Төленбеген бронь саны'],group.seatedReservations.length-group.paidReservations.length);
    assert.equal(row['Фильм'],movies.get(group.session.movie_id).title);
    assert.equal(row['Сеанс бағасы'],group.session.base_price);
    assert(Math.abs(row['Орташа баға']-average)<0.01);
  }
  assert.equal(new Set(result.map(r=>r['Ұйымдастырушы ID'])).size,result.length,'Different organizers in compact result');
  assert.equal(new Set(data.GroupBookings.map(g=>g.organizer_customer_id)).size,groups.size,'Different organizers in all demo groups');
  const all=(await pool.request().query(stripGo(allSql))).recordset;
  assert.equal(all.length,groups.size);
  for(const row of all) {
    const group=groups.get(row['Топ ID']);
    assert.equal(row['Ұйымдастырушы ID'],group.g.organizer_customer_id);
    assert.equal(row['Ұйымдастырушы'],customers.get(group.g.organizer_customer_id).full_name);
    assert.equal(row['Клиент саны'],group.members.size);
    assert.equal(row['Брондалған орын саны'],group.seats.length);
    assert.equal(row['Төленген бронь саны'],group.paidReservations.length);
    assert.equal(row['Төленбеген бронь саны'],group.seatedReservations.length-group.paidReservations.length);
  }
  const details=(await pool.request().query(stripGo(detail))).recordsets;
  assert.equal(details.length,2);
  const detailGroup=groups.get(1);
  assert.equal(detailGroup.members.size,5,'Teacher requirement: five customers');
  assert.equal(detailGroup.seats.length,5,'Teacher requirement: five seats');
  assert([...detailGroup.members.values()].every(count=>count===1),'One seat per customer in the first group');
  const expectedMembers=[...detailGroup.members]
    .sort((a,b)=>a[0]-b[0]).map(([id,count])=>({
      'Топ ID':1,'Клиент ID':id,'Брондаған клиент':customers.get(id).full_name,'Брондаған орын саны':count
    }));
  assert.deepEqual(details[0],expectedMembers);
  const expectedFood=detailGroup.food.slice().sort((a,b)=>a.food_order_id-b.food_order_id||a.menu_item_id-b.menu_item_id)
    .map(i=>({'Тағам тапсырыс ID':i.food_order_id,'Мәзір ID':i.menu_item_id,
      'Тағам':menu.get(i.menu_item_id).item_name,'Санат':menu.get(i.menu_item_id).category,'Саны':i.quantity}));
  assert.deepEqual(details[1],expectedFood);
  const paymentResults=(await pool.request().query(stripGo(paymentSql))).recordsets;
  assert.equal(paymentResults.length,2);
  const expectedPaid=detailGroup.paidReservations.filter(r=>r.reservation_status==='paid')
    .sort((a,b)=>a.customer_id-b.customer_id).map(r=>{
      const p=data.Payments.find(p=>p.reservation_id===r.reservation_id&&p.payment_status==='demo_paid');
      const seats=detailGroup.seats.filter(rs=>rs.reservation_id===r.reservation_id);
      const total=seats.reduce((n,rs)=>n+rs.seat_price,0);
      assert.equal(p.amount,total,'Group payment equals booked seat prices');
      return {'Топ ID':1,'Клиент ID':r.customer_id,'Төлеген клиент':customers.get(r.customer_id).full_name,
        'Брондаған орын саны':seats.length,'Броньдағы билеттер құны':total,'Төлеген сомасы':p.amount,
        'Төлем ID':p.payment_id,'Төлем мәртебесі':p.payment_status,'Төлем уақыты':p.paid_at};
    });
  assert.deepEqual(paymentResults[0],expectedPaid);
  const expectedUnpaid=data.Reservations.filter(r=>valid(r)
    && !data.Payments.some(p=>p.reservation_id===r.reservation_id&&p.payment_status==='demo_paid')
    && data.ReservationSeats.some(rs=>rs.reservation_id===r.reservation_id&&rs.session_id===r.session_id));
  assert.equal(paymentResults[1].length,expectedUnpaid.length);
  for(const row of paymentResults[1]){
    const r=expectedUnpaid.find(r=>r.reservation_id===row['Бронь ID']); assert(r);
    const seats=data.ReservationSeats.filter(rs=>rs.reservation_id===r.reservation_id&&rs.session_id===r.session_id);
    assert.equal(row['Клиент ID'],r.customer_id);
    assert.equal(row['Төлемі тіркелмеген клиент'],customers.get(r.customer_id).full_name);
    assert.equal(row['Орын саны'],seats.length);
    assert.equal(row['Броньдағы билеттер құны'],seats.reduce((n,rs)=>n+rs.seat_price,0));
  }
  const foodRows=(await pool.request().query(stripGo(foodSql))).recordset;
  const expectedFoodDetails=detailGroup.food.slice().sort((a,b)=>a.food_order_id-b.food_order_id||a.menu_item_id-b.menu_item_id)
    .map(i=>{
      const order=detailGroup.orders.find(o=>o.food_order_id===i.food_order_id);
      const r=data.Reservations.find(r=>r.reservation_id===order.reservation_id);
      return {'Топ ID':1,'Клиент ID':r.customer_id,'Тағамға тапсырыс берген клиент':customers.get(r.customer_id).full_name,
        'Тағам тапсырыс ID':order.food_order_id,'Тағам':menu.get(i.menu_item_id).item_name,'Санат':menu.get(i.menu_item_id).category,
        'Саны':i.quantity,'Бір данасының бағасы':i.unit_price,'Тағам құны':i.quantity*i.unit_price,'Тапсырыс күйі':order.order_status};
    });
  assert.deepEqual(foodRows,expectedFoodDetails);
  const strict=main.replace('\nGROUP BY gb.group_id',`\nAND EXISTS (
    SELECT 1 FROM dbo.Reservations r JOIN dbo.FoodOrders fo ON fo.reservation_id=r.reservation_id
    JOIN dbo.FoodOrderItems foi ON foi.food_order_id=fo.food_order_id
    WHERE r.group_id=gb.group_id AND r.session_id=gb.session_id
      AND r.reservation_status IN ('held','paid') AND fo.order_status<>'cancelled' AND foi.quantity>0
  )\nGROUP BY gb.group_id`);
  const strictResult=(await pool.request().query(stripGo(strict))).recordset;
  assert.equal(strictResult.length,qualifying.filter(g=>g.food.length>0).slice(0,6).length);
  const popcornControl=[...groups.values()].find(g=>g.g.invite_code==='DEMO-TEAM-20261105-13');
  const cheapControl=[...groups.values()].find(g=>g.g.invite_code==='DEMO-TEAM-20261105-14');
  assert(popcornControl.popcorn && !popcornControl.qualifies);
  const controlQuery=main.slice(0,main.indexOf('\nWHERE r.reservation_status'))
    +`\nWHERE gb.group_id=${popcornControl.g.group_id}`
    +main.slice(main.indexOf('\nGROUP BY gb.group_id'),main.indexOf('\nORDER BY s.start_at'))+';';
  const controlRow=(await pool.request().query(stripGo(controlQuery))).recordset[0];
  const expectedPopcorn=new Set(popcornControl.food.filter(i=>{
    const item=menu.get(i.menu_item_id);
    return item.category==='Попкорн' || /попкорн|popcorn/i.test(item.item_name);
  }).map(i=>i.food_order_id)).size;
  assert(expectedPopcorn>0);
  assert.equal(controlRow['Попкорны бар тапсырыс саны'],expectedPopcorn,'Computed count detects popcorn orders in a control group');
  assert(cheapControl.session.base_price<=average && !cheapControl.qualifies);
  const example=result.find(row=>row['Топ ID']===1 && row['Ұйымдастырушы ID']===34);
  const summary={verified_at:new Date().toISOString(),database:'CinemaLabDB',
    total_groups:groups.size,group_booking_customer_rows:[...groups.values()].reduce((n,g)=>n+g.members.size,0),
    total_group_seats:[...groups.values()].reduce((n,g)=>n+g.seats.length,0),
    total_valid_reserved_seats:data.ReservationSeats.filter(rs=>data.Reservations.some(r=>r.reservation_id===rs.reservation_id && valid(r))).length,
    qualifying_groups:[...groups.values()].filter(g=>g.qualifies).length,
    displayed_groups:result.length,display_limit:6,
    qualifying_customer_pairs:qualifying.reduce((n,g)=>n+g.members.size,0),
    qualifying_group_seats:qualifying.reduce((n,g)=>n+g.seats.length,0),
    all_organizers_distinct:true,
    popcorn_order_counts_and_food_rows_match_source:true,popcorn_control_order_count:expectedPopcorn,
    basic_sql_functions_only:true,detail_group_id:1,detail_companion_rows:details[0].length,detail_food_rows:details[1].length,
    paid_group_booking_rows:paymentResults[0].length,unpaid_booking_rows_all_database:paymentResults[1].length,
    group_payment_amounts_match_seats:true,food_order_owner_and_amounts_match:true,
    group_paid_seats:expectedPaid.reduce((n,r)=>n+r['Брондаған орын саны'],0),
    group_ticket_payments:expectedPaid.reduce((n,r)=>n+r['Төлеген сомасы'],0),
    food_order_required_rows:strictResult.length,popcorn_group_excluded:true,cheap_group_excluded:true,
    independent_counts_and_companions_match:true,example};
  fs.mkdirSync('docs/group-booking-evidence',{recursive:true});
  fs.writeFileSync('docs/group-booking-evidence/query-validation.json',JSON.stringify(summary,null,2));
  console.log(JSON.stringify(summary));
} finally { await db.closePool(); } })().catch(e=>{console.error(e.message);process.exitCode=1;});
