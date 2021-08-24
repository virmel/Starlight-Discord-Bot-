const Discord = require("discord.js");
const ytdl = require("ytdl-core");
require('dotenv').config();
const PREFIX = "_";
const YouTube = require("simple-youtube-api");
const youtube = new YouTube(process.env.YOUTUBE_API_KEY); //grab API key
const bot = new Discord.Client({ disableEveryone: true });
const queue = new Map();
const token = process.env.DISCORD_API_KEY;
const musicChannel = "music-commands";

//Soft reset temp 

const commands =
  [`**${PREFIX}p *keywords to YouTube video OR direct link*** -- to play audio`,
  `**${PREFIX}stop** -- to stop the current audio`,
  `**${PREFIX}skip** -- to skip the current audio and play the audio next in queue`,
  `**${PREFIX}queue** -- to see the remaining videos/songs in queue`,
  `**${PREFIX}pause -- to pause the current audio`,
  `**${PREFIX}resume -- to resume the paused audio`,
  `**${PREFIX}commands** -- to view this list of bot commands`];




bot.on("ready", () => {
  console.log("This bot is online!");
});



bot.on("message", async (message) => {
  if (message.author.bot) return; //If the message sent was sent by a bot, ignore. 
  if (!message.content.startsWith(PREFIX)) return; //If the message was sent WITHOUT the keyword prefix, ignore 
  if (message.content.length == 1) return; //This edge case was regarding the situation in which the message was just composed of "!"
  message.content = message.content.toLowerCase(); //This is needed so that any capitalized commands can still be used
  console.log(message.content);

  const args = message.content.substring(PREFIX.length).split(" ");
  const searchString = args.slice(1).join(" ");

  const serverQueue = queue.get(message.guild.id);
  const voiceChannel = message.member.voice.channel;
  const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : ''


  //---------------------------------------------------------------------------------------------------------


  if (message.content.startsWith(`${PREFIX}p`) && !message.content.startsWith(`${PREFIX}pause`)) {

    if (!voiceChannel) return message.channel.send("You need to be in a voice channel to play music");
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT")) return message.channel.send("I don't have permissions to connect to the voice channel");
    if (!permissions.has("SPEAK")) return message.channel.send("I don't have permissions to speak in the channel");

    var echoMessage = url;

    return message.channel.send("!p " + echoMessage);


    /*
    var video, videos;

    try {
      video = await youtube.getVideoByID(url);
    } catch {
      try {
        videos = await youtube.searchVideos(searchString, 1);
        video = await youtube.getVideoByID(videos[0].id);
      } catch {
        return message.channel.send("I couldn\'t find any search results");
      }
    };

    const song = {

      id: video.id,
      title: video.title,
      url: `https://www.youtube.com/watch?v=${video.id}`
    };

    if (!serverQueue) { //Creating a queue data structure to hold future songs
      const queueConstructor = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true,
      };

      queue.set(message.guild.id, queueConstructor);
      queueConstructor.songs.push(song);


      try {
        var connection = await voiceChannel.join();
        queueConstructor.connection = connection;
        play(message.guild, queueConstructor.songs[0]);
      } catch (error) {
        console.log(`There was an error connecting to the voice channel: ${error}`);
        queue.delete(message.guild.id);  //If I remove this, but still have the error, the bot doesn't leave randomly
        return message.channel.send(`There was an error connecting to the voice channel: ${error}`);
      }
    }
    
    else { //There is an existing queue the user can add songs to.

      serverQueue.songs.push(song);
      return message.channel.send(`**${song.title}** has been added to the queue`);
    }

    */

  }
  //---------------------------------------------------------------------------------------------------------
  else if (message.content.startsWith(`${PREFIX}stop`)) {

    if (!message.member.voice.channel) return message.channel.send("You need to be in a voice channel");
    if (!serverQueue) return message.channel.send("No song is playing atm");

    var grabbedQueue = queue.get(message.guild.id);
    var song = grabbedQueue.songs[0];

    serverQueue.textChannel.send(`**${song.title}** has been stopped by ` + "<@" + message.author + ">"); //Problem stems from this line
    serverQueue.songs = []
    serverQueue.connection.dispatcher.end()
  }
  //---------------------------------------------------------------------------------------------------------------
  else if ((message.content.startsWith(`${PREFIX}skip`) || message.content.startsWith(`${PREFIX}s`))) {

    if (!message.member.voice.channel) return message.channel.send("You need to be in a voice channel to use that command");
    if (!serverQueue) return message.channel.send("No song is playing atm");

    var grabbedQueue = queue.get(message.guild.id);

    if (!grabbedQueue.songs[1]) { //If the song that is playing is the last song in the queue, just skip (aka stop, in this case) the current playing song
      console.log("Skipping current song to go to next queued up song");
      message.channel.send(`**${serverQueue.songs[0].title}** has been skipped by ` + "<@" + message.author + ">");
      serverQueue.songs = [];
      serverQueue.connection.dispatcher.end();
    }
    else {
      message.channel.send(`**${serverQueue.songs[0].title}** has been skipped by ` + "<@" + message.author + ">");
      serverQueue.connection.dispatcher.end();  //TypeError was thrown here when current song was glitched and I tried to skip
    }

  }
  //-------------------------------------------------------------------------------------------------------------
  else if (message.content.startsWith(`${PREFIX}commands`)) {
    message.channel.send("____________________________________________");
    message.channel.send("Here is a list of available bot commands...");

    commands.forEach(command => {
      message.channel.send(command);
    });
    message.channel.send("____________________________________________");

    //Future: Maybe to clean up this code in the future, have it so that we build a massive message as one string then send in that string once everything has been added to it. 
  }
  //-----------------------------------------------------------------------------------------------------------------------
  else if (message.content.startsWith(`${PREFIX}queue`)) {
    if (!serverQueue) return message.channel.send("Nothing is queued up atm");
    serverQueue.textChannel.send("**Here is the queue...**");

    serverQueue.songs.forEach(song => {
      serverQueue.textChannel.send("**" + song.title + "**");
    });
  }
  //-------------------------------------------------------------------------------------------------------------
  else if (message.content.startsWith(`${PREFIX}pause`)) {
    if (!message.member.voice.channel) return message.channel.send("You need to be in a voice channel to use that command");
    if (!serverQueue) return message.channel.send("No song is playing atm");
    if (!serverQueue.playing) return message.channel.send("Audio has already been paused");
    serverQueue.playing = false;
    serverQueue.connection.dispatcher.pause();
    message.channel.send("<@" + message.author + "> has paused the audio");
  }
  //------------------------------------------------------------------------------------------------------------
  else if (message.content.startsWith(`${PREFIX}resume`)) {
    if (!message.member.voice.channel) return message.channel.send("You need to be in a voice channel to use that command");
    if (!serverQueue) return message.channel.send("No song is playing atm");
    if (serverQueue.playing) return message.channel.send("Audio is already playing..");
    serverQueue.playing = true;
    serverQueue.connection.dispatcher.resume();
    message.channel.send("<@" + message.author + "> has resumed the audio");
  }

  //--------------------------------------------------------------------------------------------------------------


  else if (message.content.startsWith(`${PREFIX}test`)) {

  }



  return undefined;

});

//------------------------------------------------------------------------------------------------------------------------------


function play(guild, song) {

  const serverQueue = queue.get(guild.id); //We receive the server's queueConstructed object here

  if (!song) { //If there is no song prepped up in the queue

    console.log("Now entering no song available conditional");
    /*

    var finishWhileLoop = false;

    let countdown = setTimeout(function () {
      serverQueue.textChannel.send("Inside of the countdown function");
      serverQueue.voiceChannel.leave()
      queue.delete(guild.id); //Do I actually need this since this bot will only be on Glitter?
      serverQueue.textChannel.send("bye");
      console.log("My work as a bot is finished ... for now")
    }, 180000); //Leave the voice channel after 3 minutes have gone by 

    while (!finishWhileLoop) {

      console.log("still looking for a song...");
      //Keep checking if there is a song queued up. 
      if (serverQueue.songs[0]) {
        //We found a new song. Let's cancel the shutdown
        clearTimeout(countdown);
        finishWhileLoop = true;
        console.log("Found a song! Hopefully will cancel shutdown");
      }
    };
    */

    serverQueue.textChannel.send("bye");
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    console.log("My work as a bot is finished ... for now");

    return;
  };

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url, {
      quality: 'highestaudio',
      highWaterMark: 1 << 25  //Combats error 416
    }))
    .on("finish", () => {
      serverQueue.songs.shift() //Song that was just playing is now finished, should be removed now 
      play(guild, serverQueue.songs[0]);
    })
    .on("error", (error) => {
      console.log(error);
    });
  //message.channel.send(song.title + " is playing"); //Check if this works
  serverQueue.textChannel.send("**" + song.title + "**");
  serverQueue.textChannel.send(song.url);
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
};


bot.login(token);

