/*global describe*/
/*global it*/
'use strict';
let assert = require('assert');

//let db = require('../index.js');
let $ = require('meeko');
let co = require('co');
let Config = require('../config.js');

let mysqlWrapper = require('co-mysql'),
	Mysql = require('mysql');
let pool = Mysql.createPool(Config.zc.mysql),
	mysql = mysqlWrapper(pool);
co(function*(){
	yield mysql.query('select 1;');
})
pool.on('connection', function() {
	console.log(`<-- Mysql [${$.c.green}${Config.zc.mysql.host} : ${Config.zc.mysql.port}${$.c.none}] pool connect!`);
});
pool.on('enqueue', function() {
	console.log('<-- mysql pool enqueue!');
});

module.exports = mysql;



