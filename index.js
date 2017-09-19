process.stdin.resume();

/* Basic Requires */
const axios = require('axios')
var async = require("async");

/* Custom Requires */
var GlobalObject = require("./utility/global");
var Global = new GlobalObject();

/* Objects */
var User = require('./objects/user');
var Guild = require('./objects/guild');
var Player = require('./objects/player');

/* Console */
var ConsoleLib = require("./utility/consolelib");
var NConsole = new ConsoleLib();

/* Main Program */

NConsole.writeLine("===================");
NConsole.writeLine("Server Starting");
Global.setupServer();

var answerCallbacks = [];
var debug = false
global.notifyChannelID = -1001119220057;

if (!debug) {
	NConsole.writeLine("Setting up AutoSave.");
	async.forever(
		function(next) {
			setTimeout(function() {
				if(global.NeedSave) {
					NConsole.writeLine("Do not Exit. Saving...");
					Global.Database.saveData();
				} else { NConsole.writeLine("Skiping save, nothing changed.");}
				next();
			}, 1800000)
		},
		function(err) {
			NConsole.writeLine(`Save loop ended! ${err}`);
		}
	);
	NConsole.writeLine("Set up AutoSave.");
}



Global.Bot.on('message', msg => {
	//NConsole.writeLine(msg);
	
	let callback = answerCallbacks[msg.chat.id];
	if (callback) {
		delete answerCallbacks[msg.chat.id];
		callback(msg);
	}
})

Global.Bot.onText(/^(\/load|\/load@Lucifer2Bot)/, (msg, match) => {
	var chatId = msg.chat.id;
	var UserID = msg.from.id;
	var Username = msg.from.username;
	
	if (getUser(UserID).isDev()) {
		Global.Bot.sendMessage(chatId, "Forcing load.")
		Global.Database.loadData();
	}
});

Global.Bot.onText(/^(\/save|\/save@Lucifer2Bot)/, (msg, match) => {
	
	var chatId = msg.chat.id;
	var UserID = msg.from.id;
	var Username = msg.from.username;
	
	if (getUser(UserID).isDev()) {
		Global.Bot.sendMessage(chatId, "Forcing save.")
		Global.Database.saveData();
	} else
		Global.Bot.sendMessage(chatId, "Invaild Permissions!")
});

Global.Bot.onText(/^(\/uid|\/uid@Lucifer2Bot)/, (msg, match) => {
	var chatId = msg.chat.id;
	var UserID = msg.from.id;
	var Username = msg.from.username;

	Global.Bot.sendMessage(chatId, `${JSON.stringify(msg)}`);
});

Global.Bot.onText(/^(\/donate|\/donate@Lucifer2Bot)/, (msg, match) => {
	var chatId = msg.chat.id;
	var UserID = msg.from.id;
	var Username = msg.from.username;

	Global.Bot.sendMessage(chatId, "https://www.paypal.me/lexthegreat\nThanks!")
});

Global.Bot.onText(/^(\/help|\/help@Lucifer2Bot)/, (msg, match) => {
	var chatId = msg.chat.id;
	var UserID = msg.from.id;
	var Username = msg.from.username;

	Global.Bot.sendMessage(chatId, '= HELP =\n() = Optional in any order\n | = Information\n /donate - > https://www.paypal.me/lexthegreat\n \n = /user =\n /user register\n /user getAccess <name>\n /user setAccess <name> <access>\n \n = /player =\n /player add <Username> (<Rep> <Ip>)\n /player edit <Username> (<Rep> Ip>)\n /player info <Username> | Return information and command for guild lookup.\n /player search min-max\n \n = /guild =\n /guild info <guild>\n /guild add <guild>\n /guild del <guild>\n /guild setOwner <guild> <player>\n /guild setCo <guild> <player>\n /guild setData <guild> <player>\n /guild setKey <guild> <player>\n /guild addMember <guild> <player>\n /guild delMember <guild> <player>\n /guild clearembers <guild> <player>');
});

//Matches "/user <command> [<data>]"
Global.Bot.onText(/^(\/user (.*)|\/user@Lucifer2Bot (.*))/, (msg, match) => {
	var chatId = msg.chat.id;
	var UserID = msg.from.id;
	var Username = msg.from.username;
	
	var args = match[2].toLowerCase().split(" ");
	
	switch(args[0]) {
		case "register":
			// args[1] should be a name
			if(args.length == 1) {
				if (!containsUser(UserID)) {
					var UserData = new User();
					UserData.importData(UserID, Username, 0);
					global.Users.push(UserData); NConsole.writeLine(`Added user ${Username} (${UserID})`);
					Global.Bot.sendMessage(chatId, `Added ${Username}.`);
					global.NeedSave = true;
				} else { Global.Bot.sendMessage(chatId, "You are already inside the database!"); };
			} else {
				Global.Bot.sendMessage(chatId, `Invaild Arguments! ${args.length} != 1`);
				return;
			}
			break;
		case "getaccess":
			if (getUser(UserID).isMod()) {
				if(args.length == 2) {
					Global.Bot.sendMessage(chatId, `@${Username}, I'm loading this request!`).then(function(response) {
						var msgID = response.message_id;
						var safename = args[1].replace("@", "");
						var rank = getUser(null, safename).getRank();

						Global.Bot.editMessageText(`${safename} rank is ${rank}!`, { chat_id: chatId, message_id: msgID });
					});
				} else {
					Global.Bot.sendMessage(chatId, `Invaild Arguments! ${args.length} != 2`);
				}
			}
			break;
		case "setaccess":
			if (getUser(UserID).isAdmin()) {
				if(args.length == 3) {
					var safename = args[1].replace("@", "")
					var access = isTrueNumber(args[2]);
					if (access == NaN) {
						Global.Bot.sendMessage(chatId, "Wrong usage! Access is not a number.");
						return;
					}
					
					var tuser = getUser(null, safename);
					
					if (tuser.uID != "") {
						tuser.Access = access;
						Global.Bot.sendMessage(chatId, `${safename}'s access set to ${access}!`)
					} else {
						Global.Bot.sendMessage(chatId, `${safename}'s doesn't exist. Have them /user register`);
					}
					
				} else {
					Global.Bot.sendMessage(chatId, `Invaild Arguments! ${args.length} != 3`);
				}
			}
			break;
		default:
			Global.Bot.sendMessage(chatId, `Invaild Arguments! ${args.length} == 3`);
	}
});

//Matches "/player <command> [<data>]"
Global.Bot.onText(/^(\/player (.*)|\/player@Lucifer2Bot (.*))/, (msg, match) => {
	var chatId = msg.chat.id;
	var UserID = msg.from.id;
	var Username = msg.from.username;
	
	var args = match[2].toLowerCase().split(" ");
	
	switch(args[0]) {
		case "add":
			if (args.length < 1) {
				Global.Bot.sendMessage(chatId, "Invaild username!");
				return;
			}
			
			
		
			if(isVaildName(args[1])) {
				var tplayer = getPlayer(args[1]);
				if(tplayer.ID != 0) {
					Global.Bot.sendMessage(chatId, `Player already exists!`);
					return;
				}
				
				if(args.length == 4) {
					var two = 0;
					var thre = 0;
					if(isIP(args[2])) {
						two = 1;
					} else {
						if(isTrueNumber(args[2])) {
							two = 2;
						} else {
							Global.Bot.sendMessage(chatId, `Number & IP required, got string!`);
							return;
						}
					}
					
					if(isIP(args[3])) {
						thre = 1;
					} else {
						if(isTrueNumber(args[3])) {
							thre = 2;
						} else {
							Global.Bot.sendMessage(chatId, `Number & IP required, got string!`);
							return;
						}
					}
					// 0 = add 1 = username 2 = op 3 = po
					if ((two+thre)==3) {
						var PlayerData = new Player();
						if (two == 1) {
							PlayerData.importData(global.rowID++, args[1], args[3], args[2]);
							NConsole.writeLine(`Added ${args[1]} with IP:${args[2]} Rep:${args[3]}.`);
							Global.Bot.sendMessage(chatId, `Updated ${args[1]} with Rep:${args[3]} at IP:${args[2]}.`);
						} else {
							PlayerData.importData(global.rowID++, args[1], args[2], args[3]);
							NConsole.writeLine(`Added ${args[1]} with IP:${args[3]} Rep:${args[2]}.`);
							Global.Bot.sendMessage(chatId, `Updated ${args[1]} with Rep:${args[2]} at IP:${args[3]}.`);
						}
						global.Players.push(PlayerData); NConsole.writeLine(`Added ${args[1]} with ${args[2]} ${args[3]}. ${global.rowID}`);
						global.NeedSave = true;
					}
					return;
				}
				if(args.length == 3) {
					if(isIP(args[2])) {
						var PlayerData = new Player();
						PlayerData.importData(global.rowID++, args[1], 0, args[2]);
						global.Players.push(PlayerData); NConsole.writeLine(`Added ${args[1]} with ${args[2]}. ${global.rowID}`);
						Global.Bot.sendMessage(chatId, `Added ${args[1]} at IP:${args[2]}.`);
						global.NeedSave = true;
					} else {
						if(isTrueNumber(args[2])) {
							var PlayerData = new Player();
							PlayerData.importData(global.rowID++, args[1], isTrueNumber(args[2]), "0.0.0.0");
							global.Players.push(PlayerData); NConsole.writeLine(`Added ${args[1]} with ${args[2]}. ${global.rowID} ${isTrueNumber(args[2])}`);
							Global.Bot.sendMessage(chatId, `Added ${args[1]} with Rep:${args[2]}.`);
							global.NeedSave = true;
						} else {
							Global.Bot.sendMessage(chatId, `Number/IP required, got string!`);
						}
					}
					return;
				}

				if(args.length == 2) {
					var PlayerData = new Player();
					PlayerData.importData(global.rowID++, args[1], 0, "0.0.0.0");
					global.Players.push(PlayerData); NConsole.writeLine(`Added user ${args[1]} ${global.rowID}`);
					Global.Bot.sendMessage(chatId, `Added ${args[1]}.`);
					global.NeedSave = true;
				} else {
					Global.Bot.sendMessage(chatId, `Invaild Arguments! ${args.length} != 2`);
				}
			} else {
				Global.Bot.sendMessage(chatId, "Invaild username!");
			}
			break;
		case "edit":
			if (args.length < 1) {
				Global.Bot.sendMessage(chatId, "Invaild username!");
				return;
			}
		
			if(isVaildName(args[1])) {
				var tplayer = getPlayer(args[1]);
				
				if(tplayer.ID == 0) {
					askCreatePlayer(msg, () => {
						answerCallbacks[chatId] = function(msg) {
							var msgID = msg.message_id;var chatId = msg.chat.id;
							if (msg.text == "Yes.") {
								var PlayerData = new Player();
								PlayerData.importData(global.rowID+++1, args[2], 0, "0.0.0.0");
								global.Players.push(PlayerData); NConsole.writeLine(`Added user ${args[1]} ${global.rowID}`);
								Global.Bot.sendMessage(chatId, `Done.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
								global.NeedSave = true;
							} else {
								Global.Bot.sendMessage(chatId, `OK.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							}
						}
					})
					return;
				}
				
				if(args.length == 4) {
					var two = 0;
					var thre = 0
					if(isIP(args[2])) {
						two = 1;
					} else {
						if(isTrueNumber(args[2])) {
							two = 2;
						} else {
							Global.Bot.sendMessage(chatId, `Number/IP required, got string!`);
							return;
						}
					}
					
					if(isIP(args[3])) {
						thre = 1;
					} else {
						if(isTrueNumber(args[3])) {
							thre = 2;
						} else {
							Global.Bot.sendMessage(chatId, `Number/IP required, got string!`);
							return;
						}
					}
					// 0 = add 1 = username 2 = op 3 = po
					if ((two+thre)==3) {
						if (two == 1) {
							tplayer.IP = args[2]; tplayer.Rep = args[3];
							NConsole.writeLine(`Updated ${args[1]} with IP:${args[2]} Rep:${args[3]}.`);
							Global.Bot.sendMessage(chatId, `Updated ${args[1]} with Rep:${args[3]} at IP:${args[2]}.`);
						} else {
							tplayer.IP = args[3]; tplayer.Rep = args[2];
							NConsole.writeLine(`Updated ${args[1]} with IP:${args[3]} Rep:${args[2]}.`);
							Global.Bot.sendMessage(chatId, `Updated ${args[1]} with Rep:${args[2]} at IP:${args[3]}.`);
						}
					} else {
						Global.Bot.sendMessage(chatId, `Number & IP required, got string!`);
					}
					return;
				}
				if(args.length == 3) {
					if(isIP(args[2])) {
						tplayer.IP = args[2];
						NConsole.writeLine(`Updated ${args[1]} with ${args[2]}. ${global.rowID}`);
						Global.Bot.sendMessage(chatId, `Updated ${args[1]} at IP:${args[2]}.`);
					} else {
						if(isTrueNumber(args[2])) {
							tplayer.Rep = args[2];
							NConsole.writeLine(`Updated ${args[1]} with ${args[2]}. ${global.rowID}`);
							Global.Bot.sendMessage(chatId, `Updated ${args[1]} with Rep:${args[2]}.`);
						} else {
							if(isVaildName(args[2])) {
								var nplayer = getPlayer(args[2]);
								if(nplayer.ID == 0) {
									tplayer.Username = args[2].toLowerCase();
									NConsole.writeLine(`Updated ${args[1]} with ${args[2]}. ${global.rowID}`);
									Global.Bot.sendMessage(chatId, `Updated ${args[1]} with Username:${args[2]}.`);
								} else { Global.Bot.sendMessage(chatId, `That name already exists in the database!`); }
							} else {
								Global.Bot.sendMessage(chatId, `Invaild Arguments!`);
							}
						}
					}
					return;
				}

				if(args.length == 2) {
					const opts = {
						reply_to_message_id: msg.message_id,
						reply_markup: JSON.stringify({
							keyboard: [
								['Yes.'],
								['No.']
							]
						})
					};
					Global.Bot.sendMessage(chatId, `Are you sure you want to clear ${args[1]}'s data?`, opts).then(() => {
						answerCallbacks[chatId] = function(msg) {
							var msgID = msg.message_id;var chatId = msg.chat.id;
							if (msg.text == "Yes.") {
								Global.Bot.sendMessage(chatId, `${args[1]}'s data has been cleared.`);
								tplayer.Rep = 0;
								tplayer.IP = "0.0.0.0"
							} else {
								Global.Bot.sendMessage(chatId, `OK.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							}
						}
					});
				} else {
					Global.Bot.sendMessage(chatId, `Invaild Arguments! ${args.length} != 2`);
				}
			} else {
				Global.Bot.sendMessage(chatId, "Invaild username!");
			}
			break;
		case "info":
			if (args.length < 1) {
				Global.Bot.sendMessage(chatId, "Invaild username!");
				return;
			}
		
			if(isVaildName(args[1])) {
				var tplayer = getPlayer(args[1]);
				
				if(tplayer.ID == 0) {
					askCreatePlayer(msg, () => {
						answerCallbacks[chatId] = function(msg) {
							var msgID = msg.message_id;var chatId = msg.chat.id;
							if (msg.text == "Yes.") {
								var PlayerData = new Player();
								PlayerData.importData(global.rowID+++1, args[1], 0, "0.0.0.0");
								global.Players.push(PlayerData); NConsole.writeLine(`Added user ${args[1]} ${global.rowID}`);
								Global.Bot.sendMessage(chatId, `Done.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
								global.NeedSave = true;
							} else {
								Global.Bot.sendMessage(chatId, `OK.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							}
						}
					})
					return;
				}
				
				Global.Bot.sendMessage(chatId, `*ID*:\n\`${tplayer.ID}\`\n*Username*:\n\`${tplayer.Username}\`\n*Rep*:\n\`${tplayer.Rep}\`\n*IP*:\n\`${tplayer.IP}\``, {parse_mode: "Markdown"});
			} else {
				Global.Bot.sendMessage(chatId, "Invaild username!");
			}
			break;
		case "search":
			if (args.length < 1) {
				Global.Bot.sendMessage(chatId, "Invaild search!");
				return;
			}
			
			if (isVaildSearch(args[1])) {
				var minMax = args[1].split("-");
				
				if (!parseInt(minMax[0]) && !parseInt(minMax[1])) {
					return;
				}
				
				if (minMax[0] <= minMax[1]) {
					var tmpList = global.Players;
					tmpList.sort(function(a, b) {
						return b.Rep - a.Rep;
					});
					
					// List each 
					var regEX = /.{1,2000}(?=([\s\-:]|$))/g

					var fullMessage = "";
					tmpList.forEach(function(player) {
						if(player.Rep >= minMax[0] && player.Rep <= minMax[1])
							fullMessage = fullMessage + `Username: \`${player.Username}\` Rep: \`${player.Rep}\` @\`${player.IP}\`/n`;
					})
					var matches = fullMessage.match(regEX)
					NConsole.writeLine(matches);
					
					if (matches != null) {
						matches.forEach(function(msg) {
							Global.Bot.sendMessage(chatId, msg.replace(/\/n/g,"\n"),{parse_mode: "Markdown"});
						})
					} else { Global.Bot.sendMessage(chatId, "No Players found!"); }
				} else { Global.Bot.sendMessage(chatId, "Invaild Search! Min-Max"); }
			} else {
				Global.Bot.sendMessage(chatId, "Invaild Search!");
			}
			break;
		default:
			Global.Bot.sendMessage(chatId, "Wrong usage!");
	}
});

//Matches "/guild <command> [<data>]"
Global.Bot.onText(/^(\/guild (.*)|\/guild@Lucifer2Bot (.*))/, (msg, match) => {
	var chatId = msg.chat.id;
	var UserID = msg.from.id;
	var Username = msg.from.username;
	
	var args = match[2].toLowerCase().split(" ");
	switch(args[0]) {
		case "add":
			if (args.length != 2) {
				Global.Bot.sendMessage(chatId, `Invaild Arguments! ${args.length} != 2`);
				return;
			}
		
			if (!containsGuild(args[1])) {
				var guild = new Guild();
				guild.importData(args[1]);
				global.Guilds.push(guild);
				global.NeedSave = true;
				Global.Bot.sendMessage(chatId, `Guild ${args[1]} added!`);
			} else {
				askCreateGuild(msg, () => {
					answerCallbacks[chatId] = function(msg) {
						var msgID = msg.message_id;var chatId = msg.chat.id;
						if (msg.text == "Yes.") {
							var GuildData = new Guild();
							GuildData.importData(args[1]);
							global.Guilds.push(GuildData);
							global.NeedSave = true;
							Global.Bot.sendMessage(chatId, `Done.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
						} else {
							Global.Bot.sendMessage(chatId, `OK.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
						}
					}
				})
				return;
			}
			break;
		case "del":
			if (getUser(UserID).isAdmin()) {
				if (args.length != 2) {
					Global.Bot.sendMessage(chatId, `Invaild Guild Name!`);
					return;
				}
				
				if (containsGuild(args[1])) {
					delGuild(args[1]);
					Global.Bot.sendMessage(chatId, `Guild ${args[1]} removed!`);
				} else {
					askCreateGuild(msg, () => {
						answerCallbacks[chatId] = function(msg) {
							var msgID = msg.message_id;var chatId = msg.chat.id;
							if (msg.text == "Yes.") {
								var GuildData = new Guild();
								GuildData.importData(args[1]);
								global.Guilds.push(GuildData);
								global.NeedSave = true;
								Global.Bot.sendMessage(chatId, `Done.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							} else {
								Global.Bot.sendMessage(chatId, `OK.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							}
						}
					})
					return;
				}
			}
			break;
		case "setowner":
			if (args.length != 3) {
				Global.Bot.sendMessage(chatId, `Invaild Arguments! ${args.length} != 3`);
				return;
			}
			
			if(args[2].match(/^\w+$/) != null) {
				var tplayer = getPlayer(args[2]);
				
				if(tplayer.ID == 0) {
					askCreatePlayer(msg, () => {
						answerCallbacks[chatId] = function(msg) {
							var msgID = msg.message_id;var chatId = msg.chat.id;
							if (msg.text == "Yes.") {
								var PlayerData = new Player();
								PlayerData.importData(global.rowID+++1, args[2], 0, "0.0.0.0");
								global.Players.push(PlayerData); NConsole.writeLine(`Added user ${args[1]} ${global.rowID}`);
								global.NeedSave = true;
								Global.Bot.sendMessage(chatId, `Done.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							} else {
								Global.Bot.sendMessage(chatId, `OK.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							}
						}
					})
					return;
				}
				
				if (containsGuild(args[1])) {
					if(args[2] == 0) {
						Global.Bot.sendMessage(chatId, `Guild ${args[1]} owner reset.`);
						getGuild(args[1]).Owner = 0;
						return;
					}
					getGuild(args[1]).Owner = tplayer.ID;
					Global.Bot.sendMessage(chatId, `Guild ${args[1]} owner set to ${tplayer.Username}!`);
				} else {
					askCreateGuild(msg, () => {
						answerCallbacks[chatId] = function(msg) {
							var msgID = msg.message_id;var chatId = msg.chat.id;
							if (msg.text == "Yes.") {
								var GuildData = new Guild();
								GuildData.importData(args[1]);
								global.Guilds.push(GuildData);
								global.NeedSave = true;
								Global.Bot.sendMessage(chatId, `Done.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							} else {
								Global.Bot.sendMessage(chatId, `OK.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							}
						}
					})
					return;
				}
			} else { Global.Bot.sendMessage(chatId, `Invaild Username!`); }
			break;
		case "setdata":
			if (args.length != 3) {
				Global.Bot.sendMessage(chatId, "Invaild!");
				return;
			}
			
			if(args[2].match(/^\w+$/) != null) {
				var tplayer = getPlayer(args[2]);
				
				if(tplayer.ID == 0) {
					askCreatePlayer(msg, () => {
						answerCallbacks[chatId] = function(msg) {
							var msgID = msg.message_id;var chatId = msg.chat.id;
							if (msg.text == "Yes.") {
								var PlayerData = new Player();
								PlayerData.importData(global.rowID+++1, args[2], 0, "0.0.0.0");
								global.Players.push(PlayerData); NConsole.writeLine(`Added user ${args[1]} ${global.rowID}`);
								global.NeedSave = true;
								Global.Bot.sendMessage(chatId, `Done.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							} else {
								Global.Bot.sendMessage(chatId, `OK.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							}
						}
					})
					return;
				}
				
				if (containsGuild(args[1])) {
					if(args[2] == 0) {
						Global.Bot.sendMessage(chatId, `Guild ${args[1]} data reset.`);
						getGuild(args[1]).Data = 0;
						return;
					}
					getGuild(args[1]).Data = tplayer.ID;
					Global.Bot.sendMessage(chatId, `Guild ${args[1]} data set to ${tplayer.Username}!`);
				} else {
					askCreateGuild(msg, () => {
						answerCallbacks[chatId] = function(msg) {
							var msgID = msg.message_id;var chatId = msg.chat.id;
							if (msg.text == "Yes.") {
								var GuildData = new Guild();
								GuildData.importData(args[1]);
								global.Guilds.push(GuildData);
								global.NeedSave = true;
								Global.Bot.sendMessage(chatId, `Done.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							} else {
								Global.Bot.sendMessage(chatId, `OK.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							}
						}
					})
					return;
				}
			} else { Global.Bot.sendMessage(chatId, "Invaild Username!"); }
			break;
		case "setkey":
			if (args.length != 3) {
				Global.Bot.sendMessage(chatId, "Invaild Arguments!");
				return;
			}
			
			if(args[2].match(/^\w+$/) != null) {
				var tplayer = getPlayer(args[2]);
				
				if(tplayer.ID == 0) {
					askCreatePlayer(msg, () => {
						answerCallbacks[chatId] = function(msg) {
							var msgID = msg.message_id;var chatId = msg.chat.id;
							if (msg.text == "Yes.") {
								var PlayerData = new Player();
								PlayerData.importData(global.rowID+++1, args[2], 0, "0.0.0.0");
								global.Players.push(PlayerData); NConsole.writeLine(`Added user ${args[1]} ${global.rowID}`);
								global.NeedSave = true;
								Global.Bot.sendMessage(chatId, `Done.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							} else {
								Global.Bot.sendMessage(chatId, `OK.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							}
						}
					})
					return;
				}
				
				if (containsGuild(args[1])) {
					if(args[2] == 0) {
						Global.Bot.sendMessage(chatId, `Guild ${args[1]} key reset.`);
						getGuild(args[1]).Key = 0;
						return;
					}
					getGuild(args[1]).Key = tplayer.ID;
					Global.Bot.sendMessage(chatId, `Guild ${args[1]} key set to ${tplayer.Username}!`);
				} else {
					askCreateGuild(msg, () => {
						answerCallbacks[chatId] = function(msg) {
							var msgID = msg.message_id;var chatId = msg.chat.id;
							if (msg.text == "Yes.") {
								var GuildData = new Guild();
								GuildData.importData(args[1]);
								global.Guilds.push(GuildData);
								global.NeedSave = true;
								Global.Bot.sendMessage(chatId, `Done.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							} else {
								Global.Bot.sendMessage(chatId, `OK.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							}
						}
					})
					return;
				}
			} else { Global.Bot.sendMessage(chatId, `Invaild Username!`); }
			break;
		case "setco":
			if (args.length != 3) {
				Global.Bot.sendMessage(chatId, "Invaild!");
				return;
			}
		
			if(args[2].match(/^\w+$/) != null) {
				var tplayer = getPlayer(args[2]);
				
				if(tplayer.ID == 0) {
					askCreatePlayer(msg, () => {
						answerCallbacks[chatId] = function(msg) {
							var msgID = msg.message_id;var chatId = msg.chat.id;
							if (msg.text == "Yes.") {
								var PlayerData = new Player();
								PlayerData.importData(global.rowID+++1, args[2], 0, "0.0.0.0");
								global.Players.push(PlayerData); NConsole.writeLine(`Added user ${args[2]} ${global.rowID}`);
								global.NeedSave = true;
								Global.Bot.sendMessage(chatId, `Done.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							} else {
								Global.Bot.sendMessage(chatId, `OK.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							}
						}
					})
					return;
				}
				
				if (containsGuild(args[1])) {
					if(args[2] == 0) {
						Global.Bot.sendMessage(chatId, `Guild ${args[1]} coowner reset.`);
						getGuild(args[1]).CoOwner = 0;
						return;
					}
					getGuild(args[1]).CoOwner = tplayer.ID;
					Global.Bot.sendMessage(chatId, `Guild ${args[1]} coowner set to ${tplayer.Username}!`);
				} else {
					askCreateGuild(msg, () => {
						answerCallbacks[chatId] = function(msg) {
							var msgID = msg.message_id;var chatId = msg.chat.id;
							if (msg.text == "Yes.") {
								var GuildData = new Guild();
								GuildData.importData(args[1]);
								global.Guilds.push(GuildData);
								global.NeedSave = true;
								Global.Bot.sendMessage(chatId, `Done.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							} else {
								Global.Bot.sendMessage(chatId, `OK.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							}
						}
					})
					return;
				}
			} else { Global.Bot.sendMessage(chatId, "Invaild Username!"); }
			break;
		case "addmember":
			if (args.length != 3) {
				Global.Bot.sendMessage(chatId, "Invaild!");
				return;
			}
		
			if(args[2].match(/^\w+$/) != null) {
				var tplayer = getPlayer(args[2]);
				
				if(tplayer.ID == 0) {
					askCreatePlayer(msg, () => {
						answerCallbacks[chatId] = function(msg) {
							var msgID = msg.message_id;var chatId = msg.chat.id;
							if (msg.text == "Yes.") {
								var PlayerData = new Player();
								PlayerData.importData(global.rowID+++1, args[2], 0, "0.0.0.0");
								global.Players.push(PlayerData); NConsole.writeLine(`Added user ${args[1]} ${global.rowID}`);
								global.NeedSave = true;
								Global.Bot.sendMessage(chatId, `Done.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							} else {
								Global.Bot.sendMessage(chatId, `OK.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							}
						}
					})
					return;
				}
				
				if (containsGuild(args[1])) {
					var guild = getGuild(args[1]);
					if (guild.addMember(tplayer.ID)) {
						Global.Bot.sendMessage(chatId, "Player added to guild!");
					} else { Global.Bot.sendMessage(chatId, "Player already in this guild!") };
				} else {
					askCreateGuild(msg, () => {
						answerCallbacks[chatId] = function(msg) {
							var msgID = msg.message_id;var chatId = msg.chat.id;
							if (msg.text == "Yes.") {
								var GuildData = new Guild();
								GuildData.importData(args[1]);
								global.Guilds.push(GuildData);
								Global.Bot.sendMessage(chatId, `Done.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							} else {
								Global.Bot.sendMessage(chatId, `OK.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
							}
						}
					})
					return;
				}
			} else { Global.Bot.sendMessage(chatId, "Invaild Username!"); }
			break;
		case "delmember":
			if (getUser(UserID).isMod()) {
				if (args.length != 3) {
					Global.Bot.sendMessage(chatId, "Invaild!");
					return;
				}
			
				if(args[2].match(/^\w+$/) != null) {
					var tplayer = getPlayer(args[2]);
					
					if(tplayer.ID == 0) {
						askCreatePlayer(msg, () => {
							answerCallbacks[chatId] = function(msg) {
								var msgID = msg.message_id;var chatId = msg.chat.id;
								if (msg.text == "Yes.") {
									var PlayerData = new Player();
									PlayerData.importData(global.rowID+++1, args[2], 0, "0.0.0.0");
									global.Players.push(PlayerData); NConsole.writeLine(`Added user ${args[1]} ${global.rowID}`);
									global.NeedSave = true;
									Global.Bot.sendMessage(chatId, `Done.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
								} else {
									Global.Bot.sendMessage(chatId, `OK.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
								}
							}
						})
						return;
					}
					
					if (containsGuild(args[1])) {
						var guild = getGuild(args[1]);
						if (guild.removeMember(tplayer.ID)) {
							Global.Bot.sendMessage(chatId, "Player removed from guild!");
						} else { Global.Bot.sendMessage(chatId, "Player is not in this guild!") };
					} else {
						askCreateGuild(msg, () => {
							answerCallbacks[chatId] = function(msg) {
								var msgID = msg.message_id;var chatId = msg.chat.id;
								if (msg.text == "Yes.") {
									var GuildData = new Guild();
									GuildData.importData(args[1]);
									global.Guilds.push(GuildData);
									global.NeedSave = true;
									Global.Bot.sendMessage(chatId, `Done.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
								} else {
									Global.Bot.sendMessage(chatId, `OK.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
								}
							}
						})
						return;
					}
				} else { Global.Bot.sendMessage(chatId, "Invaild Username!"); }
			}
			break;
		case "clearmembers":
			if (getUser(UserID).isAdmin()) {
				if (args.length != 2) {
					Global.Bot.sendMessage(chatId, "Invaild!");
					return;
				}
				
				if (containsGuild(args[1])) {
					var guild = getGuild(args[1]);
					guild.Members = [];
					Global.Bot.sendMessage(chatId, "Guild members whiped!");
				} else { Global.Bot.sendMessage(chatId, "Guild doesn't exists!"); };
			}
		case "info":
			if (args.length != 2) {
				Global.Bot.sendMessage(chatId, "Invaild!");
				return;
			}
			
			if (containsGuild(args[1])) {
				console.log("test");
				var guild = getGuild(args[1]);
				var Owner = getPlayer(null,null,guild.Owner).Username;
				var CoOwner = getPlayer(null,null,guild.CoOwner).Username;
				var Data = getPlayer(null,null,guild.Data).Username;
				var Key = getPlayer(null,null,guild.Key).Username;
				var IMembers = guild.Members
				var Members = []
				
				IMembers.forEach(function(id) {
					Members.push(getPlayer(null,null,id).Username);
				})
				var message = "= " + args[1] + " =\n Owner: \`" + Owner + "\`\n CoOwn: \`" + CoOwner + "\`\n Data: \`" + Data + "\`\n Key: \`" + Key + "\`\n Members:\n \`" + Members + "\`";
				Global.Bot.sendMessage(chatId, message, {parse_mode: "Markdown"});
			} else {
				askCreateGuild(msg, () => {
					answerCallbacks[chatId] = function(msg) {
						var msgID = msg.message_id;var chatId = msg.chat.id;
						if (msg.text == "Yes.") {
							var GuildData = new Guild();
							GuildData.importData(args[1]);
							global.Guilds.push(GuildData);
							global.NeedSave = true;
							Global.Bot.sendMessage(chatId, `Done.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
						} else {
							Global.Bot.sendMessage(chatId, `OK.`, {reply_markup: JSON.stringify({remove_keyboard: true,selective: false})});
						}
					}
				})
				return;
			}
			break;
		case "list":
			if (global.Guilds.length == 0) {
				Global.Bot.sendMessage(chatId, "There are no guilds!");
			}
			
			// List each 
			var regEX = /.{1,2000}(?=([\s\-:]|$))/g

			var fullMessage = "";
			global.Guilds.forEach(function(guild) {
				// guild.Name, guild.Data, guild.Key
				var Data = getPlayer(null,null,guild.Data).Username;
				var Key = getPlayer(null,null,guild.Key).Username;
				fullMessage = fullMessage + `Name: \`${guild.Name}\` Data: \`${Data}\` Key: \`${Key}\`/n`;
			})
			var matches = fullMessage.match(regEX)
			NConsole.writeLine(matches);
			if (matches != null) {
				matches.forEach(function(msg) {
					Global.Bot.sendMessage(chatId, msg.replace(/\/n/g,"\n"),{parse_mode: "Markdown"});
				})
			} else { Global.Bot.sendMessage(chatId, "No Guilds found!"); }
			break;
		default:
			Global.Bot.sendMessage(chatId, "Wrong usage!");
	}
});

function getUser(UserID, Username = false) {
	var ret = new User();
	if (Username != false) {
		global.Users.forEach(function(User) {
			if (Username == User.Username) {
				ret = User;
			}
		})
	}
	
	global.Users.forEach(function(User) {
		if (UserID == User.uID) {
			ret = User;
		}
	})
	return ret;
}

function containsUser(uID, Username = false) {
	var ret = false;
	if (Username != false) {
		global.Users.forEach(function(User) {
			if (Username == User.Username) {
				ret = true;
			}
		})
	}
	
	global.Users.forEach(function(User) {
		if (uID == User.uID) {
			ret = true;
		}
	})
	return ret;
}

function getPlayer(Username, IP = false, ID = false) {
	var ret = new Player();
	ret.ID = 0;
	if (ID != false) {
		if (ID != 0) {
			if(global.Players[ID-1]) {
				return global.Players[ID-1];
			} else { return ret; }
		} else { return ret; }
	}
	
	if (IP != false) {
		global.Players.forEach(function(Player) {
			if (IP == Player.IP) {
				ret = Player;
			}
		})
	}
	
	global.Players.forEach(function(Player) {
		if (Username == Player.Username) {
			ret = Player;
		}
	})
	return ret;
}

function containsPlayer(Username, IP = false, ID = false) {
	var ret = false;
	if (ID != false) {
		if (ID != 0) {
			if(global.Players[ID-1])
				return true;
		} else { return false }
	}
	
	if (IP != false) {
		global.Players.forEach(function(Player) {
			if (IP == Player.IP) {
				ret = true
			}
		})
	}
	
	global.Players.forEach(function(Player) {
		if (Username == Player.Username) {
			ret = true
		}
	})
	return ret;
}

function getGuild(Name) {
	var ret = new Guild();
	global.Guilds.forEach(function(Guild) {
		if (Name == Guild.Name) {
			ret = Guild;
		}
	})
	return ret;
}

function containsGuild(Name) {
	var ret = false
	global.Guilds.forEach(function(Guild) {
		if (Name == Guild.Name) {
			ret = true;
		}
	})
	return ret;
}

function delGuild(Name) {
	var index = false;
	for(var i = 0; i < global.Guilds.length; i++) {
		if (global.Guilds[i].Name = Name) {
			index = i; break;
		}
	}
	if (index) {
		global.Guilds.splice(index, 1);
		return true
	}
	return false;
}

function isIP(ip) {
	var re = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
	var found = ip.match(re);
	
	if (found != null)
		return true
	return false;
}

function isTrueNumber(num) {
	return num.match(/^[0-9]+$/)
}

function isVaildName(name) {
	return name.match(/^[a-zA-Z0-9-_]+$/);
}

function isVaildSearch(search) {
	return search.match(/\d+-\d+/);
}


// ==
	
function askCreatePlayer(msg, callback) {
	var chatId = msg.chat.id;
	const opts = {
		reply_to_message_id: msg.message_id,
		reply_markup: JSON.stringify({
			selective: true,
			keyboard: [
				['Yes.'],
				['No.']
			]
		})
	};
	Global.Bot.sendMessage(chatId, `Invaild player. Would you like to create it?`, opts).then(callback);
}

function askCreateGuild(msg, callback) {
	var chatId = msg.chat.id;
	const opts = {
		reply_to_message_id: msg.message_id,
		reply_markup: JSON.stringify({
			selective: true,
			keyboard: [
				['Yes.'],
				['No.']
			]
		})
	};
	Global.Bot.sendMessage(chatId, `Invaild guild. Would you like to create it?`, opts).then(callback);
}

// ========== Work on crash handle

/*function exitHandler(options, err) {
	//Global.Database.saveData();
	
    //if (options.cleanup);
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));*/

NConsole.writeLine("Server Setup");
NConsole.writeLine("===================");



function sortLeaderBoardObject(a,b) {
  if (a.Score < b.Score)
    return 1;
  if (a.Score > b.Score)
    return -1;
  return 0;
}