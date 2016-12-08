# j2sql
mongo like  operation for mysql
![Build Stat](https://api.travis-ci.org/kongnet/j2sql.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/kongnet/j2sql/badge.svg?branch=master)](https://coveralls.io/github/kongnet/j2sql?branch=master)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/cdb51281906a41cd98273a8622588776)](https://www.codacy.com/app/9601698/j2sql?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=kongnet/j2sql&amp;utm_campaign=Badge_Grade)

[![NPM](https://nodei.co/npm/j2sql.png?downloads=true&stars=true)](https://nodei.co/npm/j2sql/)

---

**npm install j2sql**

---

# 第一步

```
let db = require('../index')(yourmysqlConfig);
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
* 5.cmd测试
* 6.特殊类型函数条件
* 7.exec 执行语句,事务


