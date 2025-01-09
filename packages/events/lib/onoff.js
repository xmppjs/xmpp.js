const map = new WeakMap();

export default function onoff(target) {
  let m = map.get(target);

  if (!m) {
    const on = (target.addListener ?? target.addEventListener).bind(target);
    const off = (target.removeListener ?? target.removeEventListener).bind(
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
