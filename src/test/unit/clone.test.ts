import * as assert from 'assert';
import { clone } from '../../utils/clone';

describe('clone', () => {
  it('deep-copies nested objects and arrays', () => {
    const original = { a: 1, nested: { b: [1, 2, { c: 3 }] } };
    const copy = clone(original);
    assert.deepStrictEqual(copy, original);
    assert.notStrictEqual(copy, original);
    assert.notStrictEqual(copy.nested, original.nested);
    assert.notStrictEqual(copy.nested.b, original.nested.b);
  });

  it('mutating the copy does not affect the original', () => {
    const original = { list: [1, 2, 3] };
    const copy = clone(original);
    copy.list.push(4);
    assert.deepStrictEqual(original.list, [1, 2, 3]);
  });
});
