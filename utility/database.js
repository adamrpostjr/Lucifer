// Console
var ConsoleLib = require("./consolelib");
var NConsole = new ConsoleLib();

/* Objects */
var User = require('../objects/user');
var Guild = require('../objects/guild');
var Player = require('../objects/player');

// ETC
var sqlite3 = require("sqlite3").verbose();
var FileSystem = require("fs");
var async = require("async");
var db = "";

global.NeedSave = false;
global.Users = [];
global.Players = [];
global.Guilds = [];
global.rowID = 0;

var Database = function() {
	// Load and Save so that the sqlite is over used.
	this.file = "";
	this.fileid = 0;
};

Database.prototype = {
	open: function(file, vb = true) {
		this.fileDB = file;
		var status = "";
		var exists = FileSystem.existsSync(this.fileDB);

		if(!exists) {
			NConsole.writeLine("Creating Database...");
			this.fileid = FileSystem.openSync(this.fileDB, "w");
		} else {
			NConsole.writeLine("Opening Database...");
		}

		db = new sqlite3.Database(this.fileDB);

		db.serialize(function() {
			if(!exists) {
				NConsole.writeLine("Creating tables...");
				db.run("CREATE TABLE Users (uID TEXT, Username TEXT, Access INT)");
				db.run("CREATE TABLE Players (ID INT, Username TEXT, Rep INT, IP TEXT)");
				db.run("CREATE TABLE Guilds (Name TEXT, Owner INT, CoOwner INT, Data INT, Key INT, Members VARCHAR)");
			}
		});
		this.loadData(vb);
	},
	close: function() {
		if(typeof db != "string") {
			NConsole.writeLine("Closing Database...");
			db.close();
			db = "";
			FileSystem.closeSync(this.fileid);
			NConsole.writeLine("Closed Database.");
		}
	},
	//New:
	//Save/Load all at one time. Save peridoicly and not constantly.
	loadData: function(callback) {
		NConsole.writeLine("Loading from Database...");
		var safethis = this;
		db.serialize(function() {
			if(typeof db != "string") {
				safethis.getUsers(function(err, list) { global.Users = list; NConsole.writeLine(`Loaded ${list.length} Users.`);});
				safethis.getPlayers(function(err, list) { global.Players = list; NConsole.writeLine(`Loaded ${list.length} Players. GI: ${global.rowID}`);});
				safethis.getGuilds(function(err, list) { global.Guilds = list; NConsole.writeLine(`Loaded ${list.length} Guilds.`);});
			} else { NConsole.writeLine("Could not find Database."); }
		})
	},
	
	saveData: function() {
		global.saving = true;
		NConsole.writeLine("Saving to Database.");
		var safethis = this;
		db.serialize(function() {
			if(typeof db != "string") {
				db.run("DROP TABLE Users");
				db.run("DROP TABLE Players");
				db.run("DROP TABLE Guilds");
				db.run("vacuum");
				db.run("CREATE TABLE Users (uID TEXT, Username TEXT, Access INT)");
				db.run("CREATE TABLE Players (ID INT, Username TEXT, Rep INT, IP TEXT)");
				db.run("CREATE TABLE Guilds (Name TEXT, Owner INT, CoOwner INT, Data INT, Key INT, Members VARCHAR)");
				safethis.setUsers();
				safethis.setPlayers();
				safethis.setGuilds();
			} else { NConsole.writeLine("Could not find Database."); }
		})
		NConsole.writeLine(`Saved.`);
		global.saving = false;
	},
	
	/* Get */
	getUsers: function(callback) {
		var list = [];
		db.serialize(function() {
			db.each("SELECT * FROM Users", function(err, row) {
				var UserData = new User();
				UserData.importData(row.uID, row.Username, row.Access);
				list.push(UserData);
			}, function(err, cntx) {
				callback(err, list);
			});
		})
	},
	getPlayers: function(callback) {
		var list = [];
		db.serialize(function() {
			global.rowID = 0;
			db.each("SELECT * FROM Players", function(err, row) {
				var PlayerData = new Player();
				PlayerData.importData(row.ID, row.Username, row.Rep, row.IP);
				list.push(PlayerData);
				global.rowID = row.ID;
			}, function(err, cntx) {
				callback(err, list);
			});
		})
	},
	getGuilds: function(callback) {
		var list = [];
		db.serialize(function() {
			db.each("SELECT * FROM Guilds", function(err, row) {
				var GuildData = new Guild();
				GuildData.importData(row.Name, row.Owner, row.CoOwner, row.Data, row.Key, row.Members);
				list.push(GuildData);
			}, function(err, cntx) {
				callback(err, list);
			}); 
		})
	},
	
	/* Set */
	setUsers: function() {
		db.serialize(function() {
			global.Users.forEach(function(User) {
				NConsole.writeLine(User.Username);
				db.run("INSERT INTO Users (uID, Username, Access) VALUES (?,?,?)", User.exportData());
			});
		});
		
		NConsole.writeLine(`Wrote ${Users.length} Users to Database.`);
	},
	setPlayers: function() {
		db.serialize(function() {
			global.Players.forEach(function(Player) {
				db.run("INSERT INTO Players (ID, Username, Rep, IP) VALUES (?, ?,?,?)", Player.exportData());
			});
		});
		
		NConsole.writeLine(`Wrote ${Players.length} Players to Database.`);
	},
	setGuilds: function() {
		db.serialize(function() {
			global.Guilds.forEach(function(Guild) {
				db.run("INSERT INTO Guilds (Name, Owner, CoOwner, Data, Key, Members) VALUES (?,?,?,?,?,?)", Guild.exportData());
			});
		});
		NConsole.writeLine(`Wrote ${Guilds.length} Guilds to Database.`);
	}
}

module.exports = Database;