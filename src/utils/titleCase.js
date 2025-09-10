export function titleCase(str, lowerWords = ['and', 'of']) {
  const lowerSet = new Set(lowerWords.map(w => w.toLowerCase()));

  // 1) Lowercase everything, then capitalize word starts (not after an apostrophe)
  let out = str.toLowerCase().replace(/(^|[^A-Za-z'])([a-z])([a-z']*)/g,
    (match, sep, first, rest) => {
      // For the lowercase-word check, ignore trailing possessives 's or s'
      const wordForCheck = (first + rest).replace(/'s$|s'$/i, '');
      if (lowerSet.has(wordForCheck)) return sep + first + rest; // keep as lowercase
      return sep + first.toUpperCase() + rest;
    }
  );

  // 2) Surname prefixes: capitalize after apostrophe when it’s not a possessive
  //    e.g., O'neill -> O'Neill, D'artagnan -> D'Artagnan, but Madam's stays Madam's
  out = out.replace(/\b([A-Za-z])'([a-z])(?!s\b)/g, (m, a, b) => a + "'" + b.toUpperCase());

  return out;
}