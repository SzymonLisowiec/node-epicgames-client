class Meta {

  constructor() {
    this.schema = {};
  }

  set(prop, value, isRaw) {
    if (isRaw) {
      this.schema[prop] = String(value);
      return this.schema[prop];
    }
    switch (prop.substr(-1)) {
      case 'j':
        this.schema[prop] = JSON.stringify(value);
        break;
      case 'U':
        this.schema[prop] = String(parseInt(value, 10));
        break;
      default:
        this.schema[prop] = String(value);
    }
    return this.schema[prop];
  }

  get(prop, raw) {
    if (raw) return this.schema[prop];
    switch (prop.substr(-1)) {
      case 'b':
        if (typeof this.schema[prop] === 'undefined') return false;
        return !!(this.schema[prop] === 'true' || !!this.schema[prop] === true);
      case 'j':
        return typeof this.schema[prop] !== 'undefined' ? JSON.parse(this.schema[prop]) : {};
      case 'U':
        return typeof this.schema[prop] !== 'undefined' ? parseInt(this.schema[prop], 10) : {};
      default:
        return typeof this.schema[prop] !== 'undefined' ? String(this.schema[prop]) : '';
    }
  }

  update(schema, isRaw) {
    Object.keys(schema).forEach((prop) => {
      this.set(prop, schema[prop], isRaw);
    });
  }

  remove(schema) {
    schema.forEach((key) => {
      delete this.schema[key];
    });
  }

}

module.exports = Meta;
