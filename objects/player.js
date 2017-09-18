var Player = function() {
	this.ID = 1;
	this.Username = '';
	this.Rep = 0;
	this.IP = '';
	
};

Player.prototype = {
	changeUsername: function(username) {
		this.Username = username; // TODO Notifi 
	},
	
	updateIP: function(ip) {
		this.IP = ip; // TODO Notifi 
	},
	
	updateRep: function(rep) {
		this.Rep = rep;
	},
	
	/* Get/Save */
	exportData: function() {
		return [this.ID, this.Username.toLowerCase(), this.Rep, this.IP];
	},
	importData: function(id, username, rep, ip) {
		this.ID = id;
		this.Username  = username.toLowerCase();
		this.Rep = rep;
		this.IP = ip;
	}
}

// Return User
module.exports = Player;