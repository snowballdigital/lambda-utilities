/* eslint-env mocha */

import { expect } from 'chai'

import * as lib from '../src'

describe('new library', () => {
  it('is very useful', () => {
    expect(lib.isUseful()).to.equal(true)
  })
})
