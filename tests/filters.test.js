const test=require('node:test');
const assert=require('node:assert/strict');
const {chooseSort}=require('../server/filters');
test('уақыт өсу ретімен',()=>assert.match(chooseSort('time_asc'),/start_at ASC/));
test('уақыт кему ретімен',()=>assert.match(chooseSort('time_desc'),/start_at DESC/));
test('арзан билеттер жоғарыда',()=>assert.match(chooseSort('price_asc'),/price ASC/));
test('қымбат билеттер жоғарыда',()=>assert.match(chooseSort('price_desc'),/price DESC/));
test('белгісіз sort енгізсе, қауіпсіз стандартты сұрыптау',()=>assert.equal(chooseSort('DROP TABLE Movies'),chooseSort('time_asc')));
