class WaitingRoom {

  constructor(client, url) {

    this.client = client;
    this.url = url;
    this.http = this.client.http;
    this.MPCVersion = null;

  }

  async needWait() {

    return new Promise((resolve, reject) => {

      this.http.request({

        url: this.url,

        headers: {
          Accept: '*/*',
          'User-Agent': this.http.getUserAgent('launcher-service'),
        },

        json: true,

      }, (err, response, body) => {

        if (err) {

          reject(err);

        } else {

          this.MPCVersion = response.headers['x-epicgames-mcpversion'];

          if (body) {

            resolve({
              ticketId: body.ticketId,
              expectedWait: body.expectedWait,
              retryTime: body.retryTime,
            });
            
          } else resolve(false);
          
        }

      });

    });
    
  }

}

module.exports = WaitingRoom;
