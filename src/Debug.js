class Debug {

    constructor (config) {

        this.tool = config.tool;
        delete config.tool;

        /*this.config = Object.assign({
			
			

        }, config || {});*/

    }

    print (...args) {
        
        if(this.tool)
            return this.tool(...args);

        return false;
    }

}

module.exports = Debug;