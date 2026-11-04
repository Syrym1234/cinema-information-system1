/* Capture live HTTP evidence and real application screens for the Lab 10 report.
   The HTTP client below is a small local test viewer, not the Postman interface.
   Each response is obtained by fetch; fixtures are deleted in finally.
*/
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname,'..');
const folder = path.join(root,'docs/lab10/evidence/screenshots');
const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css = `*{box-sizing:border-box}body{margin:0;font-family:'Segoe UI',Arial,sans-serif;background:#edf2f7;color:#152a40}header{background:#12283e;color:white;padding:26px 38px;display:flex;justify-content:space-between;align-items:center}.brand{font-size:23px;letter-spacing:.05em;font-weight:800}.brand span{color:#f4c77a}.tag{font-size:12px;letter-spacing:.18em;color:#bbcadd}main{padding:28px 38px}.eyebrow{font-size:11px;letter-spacing:.18em;color:#927034;font-weight:bold}h1{font-size:29px;margin:8px 0 12px}.url{display:flex;align-items:center;gap:16px;background:white;border:1px solid #d2dce6;border-radius:10px;padding:16px 20px;margin:20px 0}.method{font-size:16px;font-weight:800;color:#146b57}.endpoint{font:17px Consolas,monospace;flex:1}.status{padding:7px 13px;border-radius:6px;background:#dcf5e9;color:#10623c;font-weight:800}.status.bad{background:#fff0d9;color:#8b5400}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.panel{background:white;border:1px solid #d2dce6;border-radius:12px;overflow:hidden}.panel h2{margin:0;padding:15px 20px;border-bottom:1px solid #d2dce6;font-size:15px}.panel pre{white-space:pre-wrap;overflow-wrap:anywhere;font:20px/1.55 Consolas,monospace;margin:0;padding:22px;color:#17314c}.small{font-size:12px;color:#62758a;margin-top:18px;line-height:1.6}.meta{font-size:12px;color:#62758a}.stats{display:flex;gap:14px;margin:24px 0}.stat{flex:1;background:white;border:1px solid #d2dce6;border-radius:10px;padding:16px 20px}.stat strong{display:block;font-size:29px;color:#163e5c}.stat span{font-size:12px;color:#62758a}table{width:100%;border-collapse:collapse;font-size:12px}td,th{padding:7px 12px;text-align:left;border-bottom:1px solid #dce4ec}th{background:#17314b;color:white}.pass{color:#126947;font-weight:bold}`;
const shell = (title,body) => `<!doctype html><html lang="kk"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${css}</style></head><body><header><div class="brand">CIN<span>É</span>MA <span>LAB 10</span></div><div class="tag">HTTP REST API · НАҚТЫ ТЕКСЕРУ</div></header><main>${body}</main></body></html>`;
(async()=>{
  fs.mkdirSync(folder,{recursive:true});
  const browser = await chromium.launch({channel:'msedge',headless:true});
  const page = await browser.newPage({viewport:{width:1280,height:880},deviceScaleFactor:1.5});
  const fixtureIds = new Set();
  const captures = [];
  const errors = [];
  page.on('pageerror',e=>errors.push(e.message));
  async function api(method,url,body) {
    return page.evaluate(async ({method,url,body})=>{
      const start=performance.now();
      const response=await fetch(url,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
      const text=await response.text();
      return {method,url,status:response.status,statusText:response.statusText,location:response.headers.get('location'),
        contentType:response.headers.get('content-type'),elapsedMs:Math.round(performance.now()-start),body:JSON.parse(text)};
    },{method,url,body});
  }
  async function httpShot(filename,title,result,requestBody) {
    const headers = `${result.contentType}${result.location?'\nLocation: '+result.location:''}`;
    await page.setContent(shell(title,`<div class="eyebrow">HTTP ТЕСТ КЛИЕНТІ / LIVE FETCH</div><h1>${esc(title)}</h1><div class="meta">CinemaSchoolDB · Microsoft SQL Server · 04.11.2026</div><div class="url"><span class="method">${esc(result.method)}</span><span class="endpoint">${esc(result.url)}</span><span class="status ${result.status>=400?'bad':''}">${result.status} ${esc(result.statusText)}</span></div><div class="grid"><section class="panel"><h2>Сұраныс / Request</h2><pre>${esc(requestBody?JSON.stringify(requestBody,null,2):'Body жіберілмейді.\n\nAccept: application/json')}</pre></section><section class="panel"><h2>Жауап / Response · ${result.elapsedMs} ms</h2><pre>${esc(JSON.stringify(result.body,null,2))}</pre></section></div><p class="small">${esc(headers)}<br>Нәтиже нақты жергілікті API-ге жіберілген fetch сұранысынан алынды. Бұл - есепке арналған HTTP клиенті.</p>`));
    await page.screenshot({path:path.join(folder,filename)});
    captures.push({file:filename,title,requestBody:requestBody||null,...result});
  }
  try{
    await page.goto(base+'/catalog.html');
    await page.waitForSelector('.catalog-film');
    const initial=await api('GET','/api/movies');
    const meta=await api('GET','/api/metadata');
    const health=await api('GET','/api/health');
    assert.equal(health.status,200);
    await httpShot('01-health.png','Сервердің деректер қорына қосылуы',health);
    const movie={title:'Жаңа көкжиек | Lab 10',genre_id:meta.body.genres[0].genre_id,duration_min:110,age_rating:12,release_year:2026,rating:8.5,description:'Кинотеатр каталогына REST API арқылы қосылған оқу фильмі.'};
    const created=await api('POST','/api/movies',movie);assert.equal(created.status,201);
    fixtureIds.add(created.body.movie_id);
    await httpShot('02-create-201.png','CREATE · жаңа фильмді қосу',created,movie);
    const id=created.body.movie_id;
    const read=await api('GET',`/api/movies/${id}`);assert.equal(read.status,200);
    await httpShot('03-read-200.png','READ · фильмді ID бойынша оқу',read);
    const changed={...movie,title:'Жаңа көкжиек | Жаңартылды',rating:9.1};
    const updated=await api('PUT',`/api/movies/${id}`,changed);assert.equal(updated.body.rating,9.1);
    await httpShot('04-update-200.png','UPDATE · фильм мәліметтерін өзгерту',updated,changed);
    const deleted=await api('DELETE',`/api/movies/${id}`);assert.equal(deleted.status,200);fixtureIds.delete(id);
    await httpShot('05-delete-200.png','DELETE · тест фильмін жою',deleted);
    const missing=await api('GET',`/api/movies/${id}`);assert.equal(missing.status,404);
    await httpShot('06-not-found-404.png','Жойылған фильм: 404 Not Found',missing);
    const invalid=await api('POST','/api/movies',{...movie,rating:10.5});assert.equal(invalid.status,400);
    await httpShot('07-validation-400.png','Валидация: қате рейтинг қабылданбайды',invalid,{...movie,rating:10.5});
    const sessions=await api('GET','/api/sessions');
    const protectedResult=await api('DELETE',`/api/movies/${sessions.body[0].movie_id}`);assert.equal(protectedResult.status,409);
    await httpShot('08-conflict-409.png','Деректер тұтастығы: сеансы бар фильм',protectedResult);

    // Actual application screenshots: no replacement UI or fabricated messages.
    await page.setViewportSize({width:1366,height:1050});
    await page.goto(base+'/catalog.html');await page.waitForSelector('.catalog-film');
    await page.screenshot({path:path.join(folder,'09-catalog.png')});
    const uiTitle='Көкжиекке жол | Скриншот';
    await page.getByLabel('Фильм атауы',{exact:true}).fill(uiTitle);
    await page.getByLabel('Сипаттамасы').fill('Каталог формасы арқылы қосылған уақытша оқу фильмі.');
    await page.getByRole('button',{name:'Фильмді қосу',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('қосылды'));
    const all=await api('GET','/api/movies');const uiMovie=all.body.find(m=>m.title===uiTitle);assert.ok(uiMovie);fixtureIds.add(uiMovie.movie_id);
    await page.locator('#catalog-search').fill(uiTitle);
    await page.screenshot({path:path.join(folder,'10-ui-created.png')});
    await page.getByRole('button',{name:'Өзгерту',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('#editor-title').textContent.includes('өзгерту'));
    await page.getByLabel('Рейтинг, 0–10').fill('9.4');
    await page.screenshot({path:path.join(folder,'11-ui-edit.png')});
    await page.getByRole('button',{name:'Өзгерістерді сақтау',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('жаңартылды'));
    await page.getByRole('button',{name:'Жою',exact:true}).click();
    await page.screenshot({path:path.join(folder,'12-ui-delete-dialog.png')});
    await page.locator('#delete-dialog').screenshot({path:path.join(folder,'17-delete-dialog-detail.png')});
    await page.locator('#delete-confirm').click();
    await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('жойылды'));fixtureIds.delete(uiMovie.movie_id);
    await page.locator('#catalog-search').fill('');
    await page.locator('[data-delete]').first().click();await page.locator('#delete-confirm').click();
    await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('сеанстар'));
    await page.screenshot({path:path.join(folder,'13-ui-protected.png')});
    await page.reload();await page.waitForSelector('.catalog-film');
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:path.join(folder,'14-mobile.png'),fullPage:false});
    await page.setViewportSize({width:1366,height:950});
    await page.goto(base);await page.waitForSelector('.card');
    await page.locator('[data-tab="report"]').click();await page.waitForSelector('#report-table tr');
    // Capture the report section itself so the screenshot is legible on paper.
    await page.locator('#report-view').screenshot({path:path.join(folder,'15-statistics.png')});

    // A transparent visual summary of the saved Newman log, explicitly labeled.
    const run=JSON.parse(fs.readFileSync(path.join(root,'docs/lab10/evidence/newman-results.json'),'utf8'));
    await page.setViewportSize({width:1280,height:1110});
    const rows=run.run.executions.map((e,i)=>`<tr><td>${i+1}</td><td>${esc(e.request.method)}</td><td>${esc(e.item.name.split('|').slice(1).join('|').trim())}</td><td>${e.response.code}</td><td class="pass">${e.assertions.every(a=>!a.error)?'PASS':'FAIL'}</td></tr>`).join('');
    await page.setContent(shell('Newman нәтижелерінің шолуы',`<div class="eyebrow">POSTMAN COLLECTION / NEWMAN JSON ЖУРНАЛЫ</div><h1>Интеграциялық тест нәтижелері</h1><div class="meta">CinemaLab10.postman_collection.json · Сақталған нақты орындалу журналы</div><div class="stats"><div class="stat"><strong>${run.run.stats.requests.total}</strong><span>HTTP сұранысы</span></div><div class="stat"><strong>${run.run.stats.assertions.total}</strong><span>Assertion</span></div><div class="stat"><strong>${run.run.stats.assertions.failed}</strong><span>Сәтсіз assertion</span></div></div><section class="panel"><table><thead><tr><th>№</th><th>Әдіс</th><th>Сценарий</th><th>HTTP</th><th>Нәтиже</th></tr></thead><tbody>${rows}</tbody></table></section><p class="small">Дереккөз: docs/lab10/evidence/newman-results.json. Бұл - JSON журналының көрнекі шолуы; Postman қолданбасының терезесі емес.</p>`));
    await page.screenshot({path:path.join(folder,'16-newman-summary.png'),fullPage:true});
    assert.deepEqual(errors,[]);
    const final=await api('GET','/api/movies');assert.equal(final.body.length,initial.body.length);
    fs.writeFileSync(path.join(folder,'capture-manifest.json'),JSON.stringify({capturedAt:new Date().toISOString(),dateLocal:'2026-11-04',baseUrl:base,
      provenance:'01-08: live fetch in a purpose-built HTTP test viewer. 09-15 and 17: actual web application. 16: visual rendering of saved Newman JSON, not Postman UI.',
      initialMovies:initial.body.length,finalMovies:final.body.length,fixtureCleanup:true,browserErrors:errors,httpCaptures:captures},null,2)+'\n');
    console.log('Captured 17 screenshots; live CRUD verified; temporary fixtures removed.');
  }finally{
    for(const id of fixtureIds)await page.request.delete(base+`/api/movies/${id}`);
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
