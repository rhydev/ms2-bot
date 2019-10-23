// Import modules
const { promisify } = require('util')
const { config } = require('dotenv')
const { Client, Collection } = require('discord.js')
const readdir = promisify(require('fs').readdir)

// Env file path
config({ path: `${__dirname}/.env` })

// Initialize bot client
const client = new Client({ disableEveryone: true })
client.config = require('./config')
client.logger = require('./logger')
client.commands = new Collection()

const init = async () => {
  // Load commands
  const cmdFiles = await readdir('./commands')
  client.logger.log(`Loading a total of ${cmdFiles.length} commands.`)
  cmdFiles.forEach(file => {
    try {
      if (!file.endsWith('.js')) return
      client.logger.log(`Loading command ${file}`)
      const cmd = require(`./commands/${file}`)
      client.commands.set(cmd.help.name, cmd)
    } catch (e) {
      client.logger.error(`Unable to load command ${file}: ${e}`)
    }
  })

  // Ready event, required for bot to work
  client.on('ready', () => {
    client.logger.log(`Logged in as ${client.user.tag}!`, 'ready')
    client.user.setPresence({
      game: {
        name: 'Joddy die',
        type: 'WATCHING'
      }
    })
  })

  // Event listener for msgs
  client.on('message', msg => {
    // Ignore messages from bots
    if (msg.author.bot) return
    // Ignore messages that do not start with the prefix or bot mention
    if (msg.content.indexOf(client.config.prefix) !== 0 && (!msg.mentions.users.first() || (msg.mentions.users.first() && msg.mentions.users.first().id !== client.user.id))) return
    if (msg.mentions.users.first() && msg.mentions.users.first().id === client.user.id) {
      // Ignores the mention, then splits msg by spaces
      const args = msg.content.slice(msg.mentions.users.first().id.length + 3).trim().split(/ +/g)
      // Separates command from arguments
      const command = args.shift().toLowerCase()
      // Get and run the command
      const cmd = client.commands.get(command)
      cmd.run(client, msg, args)
      // Log the command
      client.logger.cmd(`${msg.author.username} (${msg.author.id}) ran command ${cmd.help.name}`)
    } else if (msg.content.startsWith(client.config.prefix)) {
      // Ignores the prefix, then splits msg by spaces
      const args = msg.content.slice(client.config.prefix.length).trim().split(/ +/g)
      // Separates command from arguments
      const command = args.shift().toLowerCase()
      // Get and run the command
      const cmd = client.commands.get(command)
      cmd.run(client, msg, args)
      // Log the command
      client.logger.cmd(`${msg.author.tag} (${msg.author.id}) ran command ${cmd.help.name}`)
    }
  })

  // Log the bot in
  client.login(process.env.TOKEN)
}

init()
