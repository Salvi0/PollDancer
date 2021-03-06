const Poll = require('./Poll');

const util = require('util');
const Discord = require('discord.js');

module.exports =
class PollDancer {
	constructor() {
		this.polls = [];
		this.reactionCollectors = {};
		
		this.bot = new Discord.Client();
		
		this.bot.on('message', this.onMessage.bind(this));
		this.bot.on('messageReactionAdd', this.onReactionAdd.bind(this));
		this.bot.on('messageReactionRemove', this.onReactionRemove.bind(this));
		this.bot.on('ready', this.ready.bind(this));
		
		this.bot.login(process.env.TOKEN);
	}

	ready() {
		const bot = this.bot
		bot.user.setActivity('eryn.io/PollDancer')
		setInterval(() => bot.user.setActivity('eryn.io/PollDancer'), 1000000)
	}
	
	createPoll(question, discordInfo) {
		let poll = new Poll(question, discordInfo);
		this.polls.push(poll);
		return poll;
	}
	
	registerReactionCollector(message, poll) {
		this.reactionCollectors[message.id] = poll;
	}
	
	unregisterReactionCollector(message) {
		delete this.reactionCollectors[message.id];
	}
	
	getPoll(id) {
		for (let poll of this.polls) {
			if (poll._id === id) {
				return poll;
			}
		}
		
		return false;
	}
	
	gatherDiscordInfo(message) {
		let discordInfo = {
			channels: [],
			roles: [],
			guild: message.guild,
			member: message.member,
			defaultChannel: ''
		};
		
		for (let channel of discordInfo.guild.channels.array()) {
			if (channel.type === 'text' && channel.permissionsFor(this.bot.user).has('SEND_MESSAGES')) {
				discordInfo.channels.push(channel.name);
				
				if (channel.name === message.channel.name) {
					discordInfo.defaultChannel = channel.name;
				}
			} 
		}
		
		if (!discordInfo.defaultChannel) discordInfo.defaultChannel = discordInfo.channels[0];
		
		for (let role of discordInfo.guild.roles.array()) {
			if (role.mentionable) {
				discordInfo.roles.push(role.name);
			}
		}
		
		return discordInfo;
	}
	
	onReactionAdd(messageReaction, user) {
		let poll = this.reactionCollectors[messageReaction.message.id];
		if (poll) {
			poll.update.apply(poll, [messageReaction, user]);
		}
	}
	
	onReactionRemove(messageReaction) {
		let poll = this.reactionCollectors[messageReaction.message.id];
		if (poll) {
			poll.update.apply(poll);
		}
	}
	
	onMessage(message) {
		if (message.author.id === this.bot.user.id) return;
		
		if (!message.guild) return message.reply("I only talk to people in guilds. :wave: ");
		
		if (message.cleanContent.toLowerCase() === '!poll' || message.cleanContent.toLowerCase().startsWith('!poll ')) {
			if (!message.member.hasPermission('MANAGE_MESSAGES')) {
				return message.reply("You do not have permission to use this command.");
			}
			
			let text = message.cleanContent.replace(/!poll\s?/i, '');
			
			message.author.send("Use this link to create your poll: " + this.createPoll(text, this.gatherDiscordInfo(message)).getLink()).then(() => {
				message.reply("Messaged you a link to create your poll.");
			}).catch(() => {
				message.reply("Use this link to create your poll: " + this.createPoll(text, this.gatherDiscordInfo(message)).getLink());
			});
		} 
	}
}
