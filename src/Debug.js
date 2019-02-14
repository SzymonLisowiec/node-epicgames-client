class Debug {

  constructor(config) {

    this.tool = config.tool;
    delete config.tool;

  }

  print(...args) {
        
    if (this.tool) return this.tool(...args);

    return false;
  }

}

module.exports = Debug;
