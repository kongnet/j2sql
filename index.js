'use strict'
let $ = require('meeko')
let co = require('co')
let pack = require('./package.json')

let DbOpt = function (mysql, tbName, field, exColumn) {
  let me = this
  let sql = ''
  let _name = tbName
  /*
TODO: 列可见性
let ex = exColumn || {'d_flag': 1, 'm_time': 1, 'w_state': 1, 'name': 1}
let tableField = field */
  function _log (sql, ifShowSql) {
    if (ifShowSql) {
      $.option.logTime = false
      $.log(sql)
      $.option.logTime = true
    }
  }
  /*

TODO: 列可见性
function _columnFilter (colObj) {
let o = {}
tableField.map(item => {
if (!ex[item]) o[item] = 1
})
for (let i in colObj) {
if (colObj[i] === 1 && ex[i] === 1) o[i] = 1
}

return o
} */
  me.get = function () {
    // 返回生成的sql
    let s = sql
    sql = ''
    return s
  }
  me.cmd = function (s) {
    let _tail = (~s.indexOf(';')) ? '' : ';'
    sql += s + _tail
    return me
  }
  me.exec = function * (ifTrans, ifShowSql) {
    let sql = me.get()
    let r
    if (ifTrans) {
      try {
        sql = `begin;${sql}commit;`
        _log(sql, ifShowSql)
        r = yield mysql.query(sql)
        return r
      } catch (e) {
        yield mysql.query('rollback;')
        let err = e.toString()
        new RegExp('(.+)', 'gm').test(err)
        let light = RegExp.$1
        // NOTICE:不要使用ctrl+alt+F 格式化代码
        $.log(sql.replace(light, `${$.c.red}${light}${$.c.none}`), `\n${err.replace(/('.+')/gm, `${$.c.yellow}$1${$.c.none}`)}`)
        $.log(`${$.c.green}Rollback${$.c.none}`)
        return -1
      }
    } else {
      try {
        _log(sql, ifShowSql)
        return yield mysql.query(sql)
      } catch (e) {
        let err = e.toString()
        new RegExp('\'([^\']+)\'', 'gm').test(err)
        let light = RegExp.$1
        // NOTICE:不要使用ctrl+alt+F 格式化代码
        $.log(sql.replace(light, `${$.c.red}${light}${$.c.none}`), `\n${err.replace(/('[^']+')/gm, `${$.c.yellow}$1${$.c.none}`)}`)
        return -1
      }
    }
  }
  me.run = co.wrap(function * (ifTrans, ifShowSql) {
    return yield me.exec(ifTrans, ifShowSql)
  })
  me.where = function (o, type) {
    let _item
    let a = []
    for (let i in o) {
      switch (typeof o[i]) {
        case 'string':
        {
          let _preStr = '\''
;/[0-9a-zA-z_]+\(.+\)/g.test(o[i]) && (_preStr = '') // NOTICE: 注意前面的分号
          _item = `\`${i}\`=${_preStr}${o[i]}${_preStr}`
          break
        }
        case 'number':
          _item = `\`${i}\`=${o[i]}`
          break
        case 'boolean':
          _item = `\`${i}\`=${o[i]}`
          break
        case 'object':
        {
          if (type === 'update') {
            let _preStr = o[i] instanceof Date ? '' : '\''
            _item = `\`${i}\` = ${o[i] ? _preStr + (JSON.stringify(o[i]) + _preStr) : 'NULL'}`
            break
          }
          if (!o[i]) {
            // NOTICE: 不能严格等于
            _item = `\`${i}\` is NULL`
            break
          }
          if (o[i] instanceof Date) {
            _item = `\`${i}\`='${o[i].date2Str()}'`
            break
          }
          if (o[i] instanceof Array) {
            _item = `\`${i}\` in ${JSON.stringify(o[i]).replaceAll('[', '(').replaceAll(']', ')').replaceAll('"', '\'')}`
            break
          }
          if (o[i] instanceof RegExp) {
            _item = `\`${i}\` like '${o[i].toString().replaceAll('/g', '').replaceAll('/', '')}'`
            break
          }
          let _objAry = []
          for (let i2 in o[i]) {
            _objAry.push(`\`${i}\`${i2}${o[i][i2]}`)
          }
          _item = _objAry.join(' and ')
          break
        }
        case 'undefined':
          _item = `\`${i}\` = NULL`
          break
        default:
      }
      a.push(_item)
    }
    return a
  }
  me.find = function (a, b, c, d) {
    /*
a where
b col
c order by
d limit
*/
    let cols = []
    let colsStr = ''
    let whereStr = ''
    let order = []
    let orderStr = ''
    let limitStr = +d
    for (let i in c) {
      order.push('`' + i + '`' + ` ${(+c[i]) === -1 ? 'desc' : 'asc'}`)
    }
    orderStr = order.join(', ')
    // if (b === 0) b = _columnFilter(b) //TODO: 列可见性加强
    for (let i in b) {
      cols.push('`' + i + '`')
    }
    colsStr = cols.join(',')
    whereStr = me.where(a).join(' and ')
    sql += `select ${colsStr || '*'} from \`${_name}\`${whereStr ? ' where ' + whereStr : ''}${orderStr ? ' order by ' + orderStr : ''}${limitStr ? (' limit ' + limitStr) : ''};`
    return me
  }
  me.findOne = function (a, b, c) {
    return me.find(a, b, c, 1)
  }
  me.remove = function (a, ifEmpty) {
    let whereStr = me.where(a).join(' and ')
    if (whereStr || (ifEmpty && !whereStr)) {
      sql += `delete from \`${_name}\`${whereStr ? ' where ' + whereStr : ''};`
      return me
    } else {
      sql += '[Empty!!]'
      return me
    }
  }
  me.update = function (a, b, ifEmpty) {
    let whereStr = me.where(a).join(' and ')
    let colsStr = me.where(b, 'update').join(',')
    if (!colsStr) {
      sql += '[Empty!!]'
      return me
    }
    if (whereStr || (ifEmpty && !whereStr)) {
      sql += `update \`${_name}\` set ${colsStr}${whereStr ? ' where ' + whereStr : ''};`
      return me
    } else {
      sql += '[Empty!!]'
      return me
    }
  }
  me.insert = function (a, uniqCol) {
    let cols = []
    let values = []
    let vals = []
    let colsStr = ''
    let valuesStr = ''
    for (let i in a) {
      cols.push('`' + i + '`')
      values.push(a[i])
    }
    colsStr = cols.join(',')
    values = me.where(a, 'update')
    for (let i = 0; i < values.length; i++) {
      let a = values[i].split('=')
      a.shift(0)
      vals.push(a.join('='))
    }
    valuesStr = vals.join(',')
    if (!colsStr && !valuesStr) {
      sql += '[Empty!!]'
    } else {
      if (!uniqCol) {
        sql += `insert into \`${_name}\` (${colsStr}) values (${valuesStr});`
      } else {
        let _v = me.where({
          'c': a[uniqCol]
        })
        let _a = _v[0].split('=')
        _a.shift(0)
        let _c = _a.join('=')
        sql += `insert into \`${_name}\` (${colsStr}) select ${valuesStr} from dual WHERE NOT EXISTS(SELECT \`${uniqCol}\` FROM \`${_name}\` WHERE \`${uniqCol}\` = ${_c}) limit 1;`
      }
    }
    return me
  }
  me.C = function (a, uniqCol) {
    return me.insert(a, uniqCol)
  }
  me.R = function (a, b, c, d) {
    return me.find(a, b, c, d)
  }
  me.U = function (a, b, ifEmpty) {
    return me.update(a, b, ifEmpty)
  }
  me.D = function (a, ifEmpty) {
    return me.remove(a, ifEmpty)
  }
  me.select = function (a, b, c, d) {
    return me.find(a, b, c, d)
  }
  me.delete = function (a, ifEmpty) {
    return me.remove(a, ifEmpty)
  }
  return me
}
function getDB (dbObj) {
  let dbName = dbObj.database || 'test'
  let exColumn = dbObj.exColumn
  let [mysqlWrapper, Mysql] = [require('co-mysql'), require('mysql')]
  let pool = Mysql.createPool(dbObj)
  let mysql = mysqlWrapper(pool)
  $.option.logTime = false
  pool.on('connection', function () {
    // $.log(`<-- J2sql (${pack.version}) [${$.c.yellow}${dbObj.host} : ${dbObj.port}${$.c.none}] pool connect!`)
  })
  pool.on('enqueue', function () {
    // $.log('<-- J2sql pool enqueue!')
  })
  // $.log('--> J2sql Obj Init start...')
  function finishLoadDB (n, mysql, _name, _field, exColumn) {
    $.log($.c.g('✔'), `J2sql (${pack.version}) [${$.c.yellow}${n}${$.c.none} tables]`)
    db['_mysql'] = mysql
    db['cmd'] = new DbOpt(mysql, _name, _field, exColumn).cmd
    $.option.logTime = true
  }
  let [_r, n] = [0, 0]
  let db = {}
  co(function * () {
    _r = yield mysql.query(`use ${dbName};show tables;`)
    let tableSize = _r[1].length
    let unLoadTable = tableSize
    if (tableSize === 0) {
      $.log($.c.r('✘'), `J2sql (${pack.version}) [${$.c.yellow}${0}${$.c.none} tables]`)
      return
    }
    _r[1].forEach(function (item) {
      let _name = item['Tables_in_' + dbName]
      db[_name] = {}
      co(function * () {
        let _field = (yield mysql.query(`desc \`${_name}\`;`)).map(item => {
          return item['Field']
        })
        $.ext(db[_name], new DbOpt(mysql, _name, _field, exColumn))
        db[_name].field = _field
        unLoadTable--
        db['_nowPercent'] = ~~((tableSize - unLoadTable) / tableSize * 100)
        // $.log('DB Obj loading =>', db['_nowPercent'], '%')
        if (unLoadTable <= 0) {
          finishLoadDB(n, mysql, _name, _field, exColumn)
        } else {

        }
      })
      n++
    })
  }).then(function () {

  }).catch(function (e) {
    $.log($.c.r('✘'), `Mysql: ${e.message}`)
  })
  return db
}
module.exports = getDB
