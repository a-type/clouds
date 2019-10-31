declare module '*.worker' {
  class CustomWorker extends Worker {
    constructor();
  }

  export default CustomWorker;
}

declare module 'tumult' {
  export default any;
}
