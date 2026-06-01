// Safely trims testimonial cards by removing specific card divs.
// Strategy: find each card's precise start/end, remove only the unwanted ones.
// Does NOT split the whole file — preserves everything outside the card divs.
const fs = require('fs');

const CARD_OPEN = '<div class="testimonial-card">';

const targets = [
  {
    path: 'pages/sub-zero-appliance-repair-orange-county.html',
    drop: ['Naoki MacInnes', 'Susan Gerakos']
  },
  {
    path: 'pages/wolf-appliance-repair-orange-county.html',
    drop: ['Dana McNeill', 'Andrea Walter']
  },
  {
    path: 'pages/miele-appliance-repair-orange-county.html',
    drop: ['Michele Ohanian', 'Susie Arii']
  },
  {
    path: 'pages/viking-appliance-repair-orange-county.html',
    drop: ['Chi Wright', 'Diane Tweedy']
  },
  {
    path: 'pages/thermador-appliance-repair-orange-county.html',
    drop: ['Elvin Mammadov', 'Laurie Summers']
  }
];

targets.forEach(({ path, drop }) => {
  let c = fs.readFileSync(path, 'utf8');
  const beforeCards = (c.match(/class="testimonial-card"/g) || []).length;

  // Locate each card: find its open position and its matching close position.
  // Each card is: <div class="testimonial-card">...</div>
  // The card's closing div is at the same nesting depth as CARD_OPEN.
  const cardRanges = [];
  let searchFrom = 0;
  while (true) {
    const start = c.indexOf(CARD_OPEN, searchFrom);
    if (start === -1) break;

    // Walk forward counting div depth to find the matching closing div
    let depth = 0;
    let pos = start;
    let end = -1;
    while (pos < c.length) {
      const nextOpen = c.indexOf('<div', pos);
      const nextClose = c.indexOf('</div>', pos);
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        pos = nextOpen + 4;
      } else if (nextClose !== -1) {
        depth--;
        pos = nextClose + 6;
        if (depth === 0) {
          end = nextClose + 6; // position just after </div>
          break;
        }
      } else {
        break;
      }
    }

    if (end === -1) break;

    // Get the card's content to check which reviewer it belongs to
    const cardContent = c.slice(start, end);
    cardRanges.push({ start, end, content: cardContent });
    searchFrom = end;
  }

  // Find cards to remove (those containing a dropped name)
  const toRemove = cardRanges.filter(({ content }) =>
    drop.some(name => content.includes(name))
  );

  // Remove cards in reverse order (so positions stay valid)
  toRemove.sort((a, b) => b.start - a.start);
  toRemove.forEach(({ start, end }) => {
    // Also eat surrounding whitespace (the blank line between cards)
    let removeStart = start;
    while (removeStart > 0 && /[\r\n ]/.test(c[removeStart - 1])) removeStart--;
    // Restore one newline so the remaining cards stay properly separated
    c = c.slice(0, removeStart) + '\n' + c.slice(end);
  });

  // Remove JSON-LD Review schema entries for dropped names
  drop.forEach(name => {
    // Find the Review block containing this author name
    let searchPos = 0;
    while (true) {
      const reviewIdx = c.indexOf('"@type": "Review"', searchPos);
      if (reviewIdx === -1) break;

      // Find the opening brace of this Review object
      const braceStart = c.lastIndexOf('{', reviewIdx);
      // Walk forward counting braces to find the closing brace
      let depth = 0;
      let braceEnd = -1;
      for (let i = braceStart; i < c.length; i++) {
        if (c[i] === '{') depth++;
        else if (c[i] === '}') {
          depth--;
          if (depth === 0) { braceEnd = i; break; }
        }
      }
      if (braceEnd === -1) break;

      const reviewBlock = c.slice(braceStart, braceEnd + 1);
      if (reviewBlock.includes('"name": "' + name + '"')) {
        // Remove the block plus surrounding whitespace and trailing comma
        let removeStart = braceStart;
        while (removeStart > 0 && /[\r\n ,]/.test(c[removeStart - 1])) removeStart--;
        let removeEnd = braceEnd + 1;
        // Eat trailing comma if present (handling both ,\n and ,\r\n)
        const after = c.slice(removeEnd);
        const trailingComma = after.match(/^\s*,/);
        if (trailingComma) removeEnd += trailingComma[0].length;

        c = c.slice(0, removeStart) + '\n      ' + c.slice(removeEnd);
        break;
      }
      searchPos = braceEnd + 1;
    }
  });

  // Clean up dangling commas before closing ] in JSON
  c = c.replace(/,(\s*\r?\n\s*\])/g, '$1');

  fs.writeFileSync(path, c, 'utf8');

  const afterCards = (c.match(/class="testimonial-card"/g) || []).length;
  const afterSchema = (c.match(/"@type": "Review"/g) || []).length;

  // Verify footer is still present
  const hasFooter = c.includes('<footer class="footer">');
  const hasCta = c.includes('class="cta-box"');
  const hasLuxury = c.includes('luxury-brands-grid');

  console.log(`${path}:`);
  console.log(`  cards: ${beforeCards} -> ${afterCards}, schema reviews: ${afterSchema}`);
  console.log(`  footer: ${hasFooter}, CTA: ${hasCta}, luxury-cross-links: ${hasLuxury}`);
});
