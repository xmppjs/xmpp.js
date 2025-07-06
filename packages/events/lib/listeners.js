export default function listeners(events) {
  return {
    subscribe(target) {
      for (const [event, handler] of Object.entries(events)) {
        target.addListener(event, handler);
      }
    },
    unsubscribe(target) {
      for (const [event, handler] of Object.entries(events)) {
        target.removeListener(event, handler);
      }
    },
  };
}
