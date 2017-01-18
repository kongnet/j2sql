# j2sql
mongo like  operation for mysql
![Build Stat](https://api.travis-ci.org/kongnet/j2sql.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/kongnet/j2sql/badge.svg?branch=master)](https://coveralls.io/github/kongnet/j2sql?branch=master)

[![NPM](https://nodei.co/npm/j2sql.png?downloads=true&stars=true)](https://nodei.co/npm/j2sql/)

[![Standard - JavaScript Style Guide](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/kongnet/j2sql)

---

**npm install j2sql**

---

# 第一步

```
let db = require('j2sql')(yourmysqlConfig);
```

### yourmysqlConfig

```
mysql: {
				host: '127.0.0.1', //ip或者域名
				port: 3306,
				pool: 1000,
				timeout: 500000,
				user: 'zc_test',
				password: 'zc_test2016',
				database: 'zc_test',
				multipleStatements: true //允许多行运行
			}
```

# 第二步
#### 1-6为生成SQL语句
* 1.find&findone
* 2.remove
* 3.update
* 4.insert
* 4-1.不重复insert
* 5.cmd测试
* 6.特殊类型函数条件
* 7.exec 执行语句,事务
* 8.json column ready :>

####具体用法都在测试文档中 
Enjoy :)


