const Client = require('./Client');


class WaitingRoom {

	/**
	 * EpicGames use the waiting room to optymalization traffic.
	 * @param {string} url - The launcher and every game have separate waiting room's domain.
	 * @param {Client} launcher
	 */
	constructor (url, http) {

		this.url = url;
		this.http = http;
		this.mcp_version = null; // I don't know, what is "mcp".

	}

	/**
	 * @return Do We need to wait before next step?
	 */
	async needWait () {

		return new Promise((resolve, reject) => {

			this.http.request({

				url: this.url,

				headers: {
					'Accept': '*/*',
					'User-Agent': this.http.getUserAgent('launcher-service')
				},

				json: true

			}, (err, response, body) => {

				if(err){

					reject(err);

				}else{

					this.mcp_version = response.headers['x-epicgames-mcpversion'];

					if(body) //TODO: Check `body` response while problems with EpicGames servers.
						resolve(true);
					else resolve(false);
					
				}

			});

		}).catch(err => {

			console.log('Error while sending query to the waiting room.');
			console.log(err);

		});
		
	}

}

module.exports = WaitingRoom;