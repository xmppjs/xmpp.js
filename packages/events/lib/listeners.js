import onoff from "./onoff.js";

export default function listeners(events) {
  return {
    subscribe(target) {
      const { on } = onoff(target);
      for (const [event, handler] of Object.entries(events)) {
        on(event, handler);
      }
    },
    unsubscribe(target) {
      const { off } = onoff(target);
      for (const [event, handler] of Object.entries(events)) {
        off(event, handler);
      }
    },
  };
}
