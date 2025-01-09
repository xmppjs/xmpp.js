const map = new WeakMap();

export default function onoff(target) {
  let m = map.get(target);

  if (!m) {
    const on = (target.addEventListener ?? target.addListener).bind(target);
    const off = (target.removeEventListener ?? target.removeListener).bind(
      target,
    );
    const once = (
      target.once ??
      ((event, handler) =>
        target.addEventListener(event, handler, { once: true }))
    ).bind(target);
    m = { on, off, once };
    map.set(target, m);
  }

  return m;
}
