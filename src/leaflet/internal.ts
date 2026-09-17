// Small shared helper used when building a Leaflet options object out of
// component props.
//
// Leaflet merges options via a plain `for (var i in src) dest[i] = src[i]`
// (see Util.setOptions/Util.extend), which - unlike e.g. `??` - copies over
// an explicitly-present `key: undefined` and clobbers that class's default
// option value with `undefined`. That's silently wrong in most cases and
// outright broken for options Leaflet branches on with a strict
// `typeof x === "string"` check rather than a truthiness check - e.g.
// GridLayer/TileLayer's `pane` option: `getPane(pane)` returns `pane` as-is
// whenever it isn't a string, so an explicit `{ pane: undefined }` resolves
// to `undefined` instead of falling back to the class default `"tilePane"`,
// and the subsequent `appendChild` on that `undefined` pane throws.
//
// So: never pass `{ key: possiblyUndefinedValue, ...otherKeys }` straight
// into a Leaflet constructor. Build the options object, then strip
// undefined-valued keys with this helper first.
export function omitUndefined<T extends object>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}
