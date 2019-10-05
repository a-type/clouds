function expensive(time: number) {
  let start = Date.now(),
    count = 0;
  while (Date.now() - start < time) count++;
  self.postMessage(count);
}

self.addEventListener('message', ev => expensive(ev.data));
