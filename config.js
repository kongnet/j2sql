/*
dev or undefined 本地调试环境
test 测试环境
TODO:
production 生产环境
*/
var configObj = {
  dev: {
    zc: {
      inHost: '127.0.0.1',
      port: 13100,
      mysql: {
        host: '172.16.2.174',
        port: 3306,
        pool: 1000,
        timeout: 500000,
        user: 'zc_test',
        password: 'zc_test2016',
        database: 'zc_test',
        multipleStatements: true
      }
    }
  },
  test: {
    zc: {
      inHost: '127.0.0.1',
      port: 13010,
      mysql: {
        host: '127.0.0.1',
        port: 3306,
        pool: 1000,
        timeout: 500000,
        user: 'root',
        password: '',
        database: 'test',
        multipleStatements: true
      }
    }
  }
}
configObj[undefined] = configObj['dev']

module.exports = configObj[process.env.NODE_ENV]
