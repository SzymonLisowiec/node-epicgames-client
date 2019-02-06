const User = require('../User');

class Status {

	constructor (communicator, data) {
		
		this.communicator = communicator;

		this.sender = new User(this.communicator.getClient(), data);

		this.state = data.state;

		this.app = data.app;
		this.in_game = data.app; // backward compatibility

		this.status = data.status.Status || null;
		this.is_playing = data.status.bIsPlaying || false;
		this.is_joinable = data.status.bIsJoinable || false;
		this.has_voice_support =  data.status.bHasVoiceSupport || false;
		this.session_id = data.status.SessionId || null;
		this.properties  = data.status.Properties || null;
		
		this.time = new Date();
		
	}

}

module.exports = Status;