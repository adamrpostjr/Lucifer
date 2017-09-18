var list = ['340941550','381242895','375792427']

var User = function() {
	this.uID = '';
	this.Username = '';
	this.Access = 0;
};

User.prototype = {
	isMod: function() {
		if(this.isListed()) return true;
		if(this.Access >= 1) return true;
	},
	isAdmin: function() {
		if(this.isListed()) return true;
		if(this.Access >= 2) return true;
	},
	isDev: function() {
		if(this.isListed()) return true;
		if(this.Access >= 3) return true;
	},
	isListed: function() { // Unlocks commands, but still sets you as noob
		if(this.uID == '340941550') return true;
		if(this.uID == '381242895') return true;
		if(this.uID == '375792427') return true;
		return false;
	},
	
	getRank: function() {
		switch(this.Access) {
		case 3:
			return "Dev";
		case 2:
			return "Admin";
		case 1:
			return "Mod";
		default:
			return "noob";
		}
	},

	/* Get/Save */
	exportData: function() {
		return [this.uID, this.Username.toLowerCase(), this.Access];
	},
	importData: function(uid, username, access) {
		this.uID = uid;
		this.Username  = username.toLowerCase();
		this.Access = access;
	}
}

// Return User
module.exports = User;