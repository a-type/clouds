declare module '*.worker' {
  class CustomWorker extends Worker {
    constructor();
  }

  export default CustomWorker;
}
