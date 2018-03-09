/* global describe */
/* global it */
'use strict'
describe(`结束`, function () {
  it(`结束`, function () {
    setTimeout(() => {
      process.exit(0)
    }, 1500)
  })
})
