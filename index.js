'use strict';
var Config = require('../config');
var $ = require('meeko');
var mysql = require('./mysql');
var co = require('co');

let dbName = Config.zc.mysql.database || 'test';

let dbOpt = function(tbName) {
  let me = this;
  let sql = '';
  let _name = tbName;
  me.get = function() {
    //返回生成的sql
    let s = sql;
    sql = '';
    return s;
  };
  me.cmd = function(s) {
    let _tail = (~s.indexOf(';')) ? '' : ';';
    sql += s + _tail;
    return me;
  };
  me.exec = function*(ifTrans) {
    let sql = me.get();
    let r;
    if (ifTrans) {
      try {
        sql = `begin;${sql}commit;`;
        r = yield mysql.query(sql);
        return r;
      } catch (e) {
        yield mysql.query(`rollback;`);
        let err = e.toString();
        /'(.+)'/gm.test(err);
        let light = RegExp.$1;
        //NOTICE:不要使用ctrl+alt+F 格式化代码
        $.log(sql.replace(light, `${$.c.red}${light}${$.c.none}`), `\n${err.replace(/('.+')/gm,`${$.c.yellow}$1${$.c.none}`)}`);
        $.log(`${$.c.green}Rollback${$.c.none}`);
        return -1;
      }
    } else {
      try {
        return yield mysql.query(sql);
      } catch (e) {
        let err = e.toString();
        /'([^']+)'/gm.test(err);
        let light = RegExp.$1;
        //NOTICE:不要使用ctrl+alt+F 格式化代码
        $.log(sql.replace(light, `${$.c.red}${light}${$.c.none}`), `\n${err.replace(/('[^']+')/gm,`${$.c.yellow}$1${$.c.none}`)}`);
        return -1;
      }
    }
  };
  me.where = function(o, type) {
    let _item;
    let a = [];
    for (let i in o) {
      switch (typeof o[i]) {
        case 'string':
        {
          let _preStr = `'`;
          /^}}(.+){{$/g.test(o[i]) && (_preStr = '');
          _item = `${i}=${_preStr}${_preStr ? o[i] : RegExp.$1}${_preStr}`;
          break;
        }
        case 'number':
          _item = `${i}=${o[i]}`;
          break;
        case 'boolean':
          _item = `${i}=${o[i]}`;
          break;
        case 'object':
          {
            let _joinStr = 'is';
            if (type === 'update') {
              _joinStr = '=';
            }
            if (o[i] == undefined) {
              _item = `${i} ${_joinStr} NULL`;
              break;
            }
            if (o[i] instanceof Date) {
              _item = `${i}='${o[i].date2Str()}'`;
              break;
            }
            if (o[i] instanceof Array) {
              _item = `${i} in ${JSON.stringify(o[i]).replaceAll('[','(').replaceAll(']',')').replaceAll('"','\'')}`;
              break;
            }
            if (o[i] instanceof RegExp) {
              _item = `${i} like '${o[i].toString().replaceAll('/g','').replaceAll('/','')}'`;
              break;
            }
            let _objAry = [];
            for (let i2 in o[i]) {
              _objAry.push(`${i}${i2}${o[i][i2]}`);
            }
            _item = _objAry.join(' and ');
            break;
          }
        default:
          _item = `${i}=${o[i]}`;
          break;
      }
      //$.log(typeof o[i],o[i] instanceof RegExp)
      a.push(_item);
    }
    return a;
  };
  me.find = function(a, b, c, d) {
    /*
      a where
      b col
      c order by
      d limit
    */
    let cols = [];
    let colsStr = '';
    let whereStr = '';
    let order = [];
    let orderStr = '';
    let limitStr = +d;
    for (let i in c) {
      order.push(i + ` ${(+c[i]) == -1 ? 'desc' : 'asc'}`);
    }
    orderStr = order.join(', ');
    for (let i in b) {
      cols.push(i);
    }
    colsStr = cols.join(',');
    whereStr = me.where(a).join(' and ');
    sql += `select ${colsStr || '*'} from ${_name}${whereStr ? ' where ' + whereStr : ''}${orderStr ? ' order by ' + orderStr : ''}${limitStr ? (' limit ' + limitStr) : ''};`;
    return me;
  };
  me.findOne = function(a, b, c) {

    return me.find(a, b, c, 1);
  };
  me.remove = function(a, ifEmpty) {
    let whereStr = me.where(a).join(' and ');
    if (whereStr || (ifEmpty && !whereStr)) {
      sql += `delete from ${_name}${whereStr ? ' where ' + whereStr : ''};`;
      return me;
    } else {
      sql += '[Empty!!]';
      return me;
    }
  };
  me.update = function(a, b, ifEmpty) {
    let whereStr = me.where(a).join(' and ');
    let colsStr = me.where(b, 'update').join(',');
    if(!colsStr) {
      sql += '[Empty!!]';
      return me;
    }
    if (whereStr || (ifEmpty && !whereStr)) {
      sql += `update ${_name} set ${colsStr}${whereStr ? ' where ' + whereStr : ''};`;
      return me;
    } else {
      sql += '[Empty!!]';
      return me;
    }
  };
  me.insert = function(a, uniqCol) {
    let cols = [];
    let values = [];
    let vals = [];
    let colsStr = '';
    let valuesStr = '';
    for (let i in a) {
      cols.push(i);
      values.push(a[i]);
    }
    colsStr = cols.join(',');
    values = me.where(a, 'update');
    for (let i = 0; i < values.length; i++) {
      vals.push(values[i].split('=')[1]);
    }
    valuesStr = vals.join(',');
    if(!colsStr && !valuesStr) {
      sql += '[Empty!!]';
    }else {
      if(!uniqCol){
        sql += `insert into ${_name} (${colsStr}) values (${valuesStr});`;
      }else{
        sql += `insert into ${_name} (${colsStr}) select ${valuesStr} from ${_name} WHERE NOT EXISTS(SELECT ${uniqCol} FROM ${_name} WHERE ${uniqCol} = '${a[uniqCol]}') limit 1`;
      }
    }
    return me;
  };
  me.C = function(a, uniqCol) {

    return me.insert(a, uniqCol);
  };
  me.R = function(a, b, c, d) {

    return me.find(a, b, c, d);
  };
  me.U = function(a, b, ifEmpty) {

    return me.update(a, b, ifEmpty);
  };
  me.D = function(a, ifEmpty) {

    return me.remove(a, ifEmpty);
  };
  me.select = function(a, b, c, d) {

    return me.find(a, b, c, d);
  };
  me.delete = function(a, ifEmpty) {

    return me.remove(a, ifEmpty);
  };
  return me;
};

function getDB() {
  $.log(`--> DB Obj Init start...`);
  let _r,n = 0;
  let db = co(function*() {
    _r = yield mysql.query(`use ${dbName};show tables;`);
    _r[1].forEach(function(item){
      let _name = item[`Tables_in_` + dbName];
      db[_name] = {};
      $.ext(db[_name], new dbOpt(_name));
      n++;
    });
  }).then(function(){
    $.log(`<-- DB [${$.c.yellow}${n}${$.c.none} tables] Obj Init finish...`);
  });

  return db;
}
module.exports = getDB();

/* $.log(
   db.test_zc_users.findOne({
     'time': {'>=':123,'<':1000},'count(1)': 2,
     z: /%123/g,y: null,x: 1,'id': true,
     cell: '130',cTime: new Date(),ary: [1, 'x']
   }, {cell: 1,'min(id)': 1 }, {a: 1,b: -1})

   
     select cell,min(id) from test_zc_users 
     where time>=123 and time<1000 and count(1)=2 and z like '%123' 
     and y is NULL and x=1 and id=true and cell='130' 
     and cTime='2016-1-31 3:16:31' and ary in (1,"x") 
     order by a asc ,b desc limit 1;
   
   ,
   db.test_zc_users.find({},{'count(1)':1}),
   db.test_zc_users.remove({
     a: 'dd'
   }),
   db.test_zc_users.update({
     a: 'dd',
     b: null
   }, {
     o: '}}id*6{{',
     x: null,
     y: 'y',
     z: 33
   }),
   db.test_zc_users.insert({
     a: 'x',
     b: 6,
     c: new Date(),
     d: '}}col1+col2{{'
   })
   )*/