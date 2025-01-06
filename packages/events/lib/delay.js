export default function delay(ms) {
  let timeout;
  const promise = new Promise((resolve) => {
    timeout = setTimeout(resolve, ms);
  });
  promise.timeout = timeout;
  return promise;
}
