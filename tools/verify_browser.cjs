/* Browser QA: actual HTTP + SQL Server, with reversible fixtures. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const browser = await chromium.launch({ channel:'msedge', headless:true });
  const page = await browser.newPage({ viewport:{width:1440,height:1080}, deviceScaleFactor:1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
  const folder = path.resolve(__dirname,'../docs/lab10/evidence');
  fs.mkdirSync(folder,{recursive:true});
  const title = `Browser QA ${Date.now()}`;
  let fixtureId;
  try {
    await page.goto(`${base}/catalog.html`);
    await page.waitForSelector('.catalog-film');
    assert.match(await page.locator('#count').innerText(), /24 \/ 24/);
    await page.screenshot({path:path.join(folder,'catalog-desktop.png')});
    await page.getByLabel('Фильм атауы', {exact:true}).fill(title);
    await page.getByLabel('Сипаттамасы').fill('Браузер арқылы CRUD тексеру. Уақытша тест жазбасы.');
    await page.getByRole('button',{name:'Фильмді қосу',exact:true}).click();
    await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('қосылды'));
    const response = await page.request.get(`${base}/api/movies`);
    const fixture = (await response.json()).find(movie => movie.title === title);
    assert.ok(fixture); fixtureId = fixture.movie_id;
    await page.locator('#catalog-search').fill(title);
    await page.getByRole('button',{name:'Өзгерту',exact:true}).click();
    await page.waitForFunction(() => document.querySelector('#editor-title').textContent.includes('өзгерту'));
    await page.getByLabel('Рейтинг, 0–10').fill('9.4');
    await page.getByRole('button',{name:'Өзгерістерді сақтау',exact:true}).click();
    await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('жаңартылды'));
    assert.equal((await (await page.request.get(`${base}/api/movies/${fixtureId}`)).json()).rating, 9.4);
    await page.getByRole('button',{name:'Жою',exact:true}).click();
    await page.locator('#delete-confirm').click();
    await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('жойылды'));
    assert.equal((await page.request.get(`${base}/api/movies/${fixtureId}`)).status(),404);
    fixtureId = null;
    await page.locator('#catalog-search').fill('');
    await page.locator('[data-delete]').first().click();
    await page.locator('#delete-confirm').click();
    await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('сеанстар'));
    assert.ok(await page.locator('.message:not(.ok)').isVisible());
    await page.reload(); await page.waitForSelector('.catalog-film');
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false);
    await page.screenshot({path:path.join(folder,'catalog-mobile.png')});
    await page.setViewportSize({width:1440,height:1080});
    await page.goto(base); await page.waitForSelector('.card');
    await page.locator('[data-tab="movies"]').click(); await page.waitForSelector('.movie');
    await page.locator('[data-tab="report"]').click(); await page.waitForSelector('#report-table tr');
    await page.screenshot({path:path.join(folder,'report-desktop.png')});
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(folder,'browser-results.json'), JSON.stringify({date:'2026-11-04',baseUrl:base,
      browser:'Microsoft Edge (Playwright)',viewportDesktop:'1440x1080',viewportMobile:'390x844',
      checks:['Catalog loads 24 movies','Create via form','Read created SQL row','Edit persists rating 9.4','Delete via confirmation','GET deleted row = 404','Referenced movie deletion blocked','Mobile: no horizontal overflow','Existing movie view loads','Existing report loads','No uncaught browser errors'],
      passed:11,failed:0,errors},null,2)+'\n');
    console.log('Browser QA: 11 checks passed; SQL fixtures cleaned.');
  } finally {
    if(fixtureId) await page.request.delete(`${base}/api/movies/${fixtureId}`);
    // Also clean a fixture if UI failed before its ID could be captured.
    const response = await page.request.get(`${base}/api/movies`);
    for(const movie of await response.json()) if(movie.title === title) await page.request.delete(`${base}/api/movies/${movie.movie_id}`);
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode=1; });
