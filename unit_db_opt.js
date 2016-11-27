/*global describe*/
/*global it*/
'use strict';
let assert = require('assert');

let db = require('../index.js');
let $ = require('meeko');
let co = require('co');
var mysql = require('../models/mysql_zc_test');

co(function*(){
console.log(yield db.test)
})

describe('mongoDB转MySQL增删改查基础的单元测试',function(){
	before(function*() { yield $.tools.wait(1000); });
	it('1.find&findone测试',function*(){		
		assert.deepEqual(db.test.find().get(),'select * from test;');
		assert.deepEqual(db.test.R().get(),'select * from test;');
		assert.deepEqual(db.test.select().get(),'select * from test;');
		assert.deepEqual(db.test.find({'time': {'>=':123,'<':1000}}).get(),'select * from test where time>=123 and time<1000;');
		assert.deepEqual(db.test.find({},{cell: 1,'min(id)': 1 }).get(),'select cell,min(id) from test;');
		assert.deepEqual(db.test.find({},{},{a: 1,b: -1}).get(),'select * from test order by a asc, b desc;');
		assert.deepEqual(db.test.find({},{},{},5).get(),'select * from test limit 5;');
		assert.deepEqual(db.test.findOne().get(),'select * from test limit 1;');
		assert.deepEqual(db.test.R({cell:'13052000000'}).get(),"select * from test where cell='13052000000';",db.test.R({cell:'13052000000'}).get());
		assert.deepEqual(db.test.R({cell:true}).get(),'select * from test where cell=true;');
	});
	

	it('2.remove测试',function*(){

		assert.deepEqual(db.test.remove().get(),'[Empty!!]');
		assert.deepEqual(db.test.remove({},1).get(),'delete from test;');
		assert.deepEqual(db.test.D({},1).get(),'delete from test;');
		assert.deepEqual(db.test.delete({},1).get(),'delete from test;');
		assert.deepEqual(db.test.remove({'time': {'>=':123,'<':1000}}).get(),'delete from test where time>=123 and time<1000;');
	});


	it('3.update测试',function*(){
		assert.deepEqual(db.test.U({id:11}).get(),'[Empty!!]');
		assert.deepEqual(db.test.update().get(),'[Empty!!]');
		assert.deepEqual(db.test.update({},{cell: 1,'min(id)': 1 }).get(),'[Empty!!]');
		assert.deepEqual(db.test.update({},{cell: 1,'min(id)': 1 },1).get(),'update test set cell=1,min(id)=1;');
		assert.deepEqual(db.test.U({},{cell: 1,'min(id)': 1 },1).get(),'update test set cell=1,min(id)=1;');
		assert.deepEqual(db.test.update({'time': {'>=':123,'<':1000}},{cell: 1,'min(id)': 1 }).get(),'update test set cell=1,min(id)=1 where time>=123 and time<1000;');
	});

	it('4.insert测试',function*(){
		assert.deepEqual(db.test.insert().get(),'[Empty!!]');
		assert.deepEqual(db.test.insert({cell: 1,'min(id)': 1 }).get(),'insert into test (cell,min(id)) values (1,1);');
		assert.deepEqual(db.test.C({cell: 1,'min(id)': 1 }).get(),'insert into test (cell,min(id)) values (1,1);');
	});
	it('5.cmd测试',function*(){
		assert.deepEqual(db.test.cmd('show databases;').get(),'show databases;');
		assert.deepEqual(db.test.cmd('show databases').get(),'show databases;');
	});
	it('6.特殊类型函数条件测试',function*(){
		assert.deepEqual(db.test.R({'ax(id)':1}).get(),'select * from test where ax(id)=1;');
		assert.deepEqual(db.test.R({'md5':'}}md5(id){{'}).get(),'select * from test where md5=md5(id);');
		assert.deepEqual(db.test.R({'md5':null}).get(),'select * from test where md5 is NULL;');
		assert.deepEqual(db.test.R({'time':new Date('2016-01-01 12:12:13')}).get(),"select * from test where time='2016-01-01 12:12:13';");
		assert.deepEqual(db.test.R({'name':/%kong/g}).get(),"select * from test where name like '%kong';");
		assert.deepEqual(db.test.R({'name':/kong%/g}).get(),"select * from test where name like 'kong%';");
		assert.deepEqual(db.test.R({'name':/%kong%/g}).get(),"select * from test where name like '%kong%';");
		assert.deepEqual(db.test.R({'name':[1,'x',3]}).get(),"select * from test where name in (1,'x',3);",db.test.R({'name':[1,'x',3]}).get());
	});
	it('7.exec测试',function*(){
		let rs = yield mysql.query('select id from test limit 1;');
		let obj = yield db.test.R({id:rs[0].id},{},{},1).exec();
		assert.deepEqual(obj[0].id,rs[0].id);
		obj = yield db.test.R({idx:1001},{},{},1).exec();
		assert.deepEqual(obj,-1);
		obj = yield db.test.R({id:rs[0].id},{},{},1).exec(true);
		assert.deepEqual(obj[1][0].id,rs[0].id);
		obj = yield db.test.R({idx:1001},{},{},1).exec(true);
		assert.deepEqual(obj,-1);
	});

	
});


