/* deploy-command.js
* @fileoverview This file contains the command to deploy the bot.
*/

/* Required modules */
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const { clientId, guildId, token } = require('./config.json');
const { display_header, displayBlueMessage, displayCommands, display_error_message } = require('./src/helper/terminal_enhancement');

/* Array to store the commands */
const commands = [];
const commandFiles = fs.readdirSync('./src/Commands').filter(file => file.endsWith('.js'));

/* Loop through the command files */
for (const file of commandFiles) {
    const command = require(`./src/Commands/${file}`);
    commands.push(command.data.toJSON());
}

/* Create a new REST client */
const rest = new REST({ version: '10' }).setToken(token);

/* Refresh the application commands */
(async () => {
    try {
        display_header();
        displayCommands("deploy-command", "System", 0);
        displayBlueMessage("\n\nRefreshing application (/) commands...\n\n", "", "");

        for (const command of commands) {
            displayBlueMessage("Command: ", command.name, "\n");
        }

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );

        displayBlueMessage("Successfully reloaded application (/) commands.\n\n", "", "");
    } catch (error) {
        display_error_message("Error reloading commands", error);
        console.error(error);
    }
})();
