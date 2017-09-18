var Guild = function() {
	this.Name = '';
	this.Owner = 0;
	this.CoOwner = 0;
	this.Data = 0;
	this.Key = 0;
	this.Members = []; // Full of id's of players
	
};

Guild.prototype = {
	/* Check */
	isOwner: function(id) {
		if(this.Owner == id) return true;
	},
	
	isCoOwner: function(id) {
		if(this.CoOwner == id) return true;
	},
	
	isMember: function(id) {
		if (this.Members.indexOf(id) > -1 ) {
			return true;
		}
		return false;
	},
	
	/* Mod */
	addMember: function(id) { // True = Did Add, False = Exists already
		if(!this.isMember(id)) {
			this.Members.push(id);
			return true;
		}
		return false;
	},
	
	removeMember: function(id) { // True = Did Remove, False = Doesn't Exist
		var i = this.Members.indexOf(id);
		if(i != -1) {
			this.Members.splice(i, 1);
			return true
		}
		return false;
	},
	
	
	/* Get/Save */
	exportData: function() {
		return [this.Name.toLowerCase(), this.Owner, this.CoOwner, this.Data, this.Key, JSON.stringify(this.Members)];
	},
	importData: function(name, owner = 0, coowner = 0, data = 0, key = 0, members = JSON.stringify([]) ) {
		this.Name = name.toLowerCase();
		this.Owner  = owner;
		this.CoOwner = coowner;
		this.Data = data;
		this.Key = key;
		this.Members = JSON.parse(members);
	}
}

module.exports = Guild;