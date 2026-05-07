import { describe, expect, it } from 'vitest';

import { escapeCardText } from '../src/utils/CardUtils';

describe('escapeCardText', () => {
  it('escapes HTML-sensitive characters for card text', () => {
    expect(escapeCardText(`A&B <tag attr="value">'`)).toBe(
      'A&amp;B &lt;tag attr=&quot;value&quot;&gt;&#39;'
    );
  });
});
