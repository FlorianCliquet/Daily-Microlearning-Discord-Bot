/** src/helper/terminal_enhancement.js
 * @fileoverview This file contains the functions that are used to display the commands used by the user
 * and the messages that are displayed to the user in the terminal.
 */

/**
 * displayCommands
 * @param {string} commands_Name - The name of the command used by the user.
 * @param {string} user - The user who used the command.
 * @param {number} type - The type of the demand. (0) if the command is used by the user, (1) if the command is used by the bot.
 */

async function displayCommands(commands_Name, user='none', type=1) {
    const { bgGreen, black, white, blue } = (await import('chalk')).default;
    const commandLine = `${bgGreen.black.bold(`🤖 Command used : ${white.bold(commands_Name)} 🤖`)}`;
    const userLine = type === 0 ? `Used by: ${blue.bold(user)}` : '';
    console.log(commandLine);
    if (userLine) {
        console.log(userLine);
    }    
}

/**
 * displayBlueMessage
 * @param {string} before - The message to display before the blue message.
 * @param {string} message - The blue message to display.
 * @param {string} after - The message to display after the blue message.
 */
async function displayBlueMessage(before="", message="", after="") {
    const { blue } = (await import('chalk')).default;
    console.log(
        before + 
        blue.bold(message)
        + after
    );
}

/**
 * display_error_message
 * @param {string} post - The message to be displayed before the error message.
 * @param {string} error - The error message to be displayed.
 */

async function display_error_message(post , error) {
    const { red } = (await import('chalk')).default;
    console.log(
        red.bold('⚠️🚨 Error ! 🚨⚠️')
    );
    console.error(post + error);
}

/**
 * display_header
 * This function is used to display the header of the application.
 */

async function display_header() {
    console.log('                                                                                ');
    console.log('                                                                                ');
    console.log('░▒▓███████▓▒░░▒▓████████▓▒░░▒▓██████▓▒░░▒▓███████▓▒░       ░▒▓█▓▒░▒▓████████▓▒░ ');
    console.log('░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░      ░▒▓█▓▒░  ░▒▓█▓▒░     ');
    console.log('░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░      ░▒▓█▓▒░  ░▒▓█▓▒░     ');
    console.log('░▒▓███████▓▒░░▒▓██████▓▒░ ░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░      ░▒▓█▓▒░  ░▒▓█▓▒░     ');
    console.log('░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░      ░▒▓█▓▒░  ░▒▓█▓▒░     ');
    console.log('░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░      ░▒▓█▓▒░  ░▒▓█▓▒░     ');
    console.log('░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓███████▓▒░       ░▒▓█▓▒░  ░▒▓█▓▒░     ');
    console.log('                                                                                ');
    console.log('                                                                                ');
}

/**
 * displayConnectionStatus
 * This function is used to display the connection status of the bot.
 * @param {Client} client - The Discord client.
 */

async function displayConnectionStatus(client) {
    const chalk = (await import('chalk')).default;
    console.log(
        chalk.bgGreen.black.bold(`🤖 Bot Connected 🤖\n`) +
        `Connected as: ${chalk.blue.bold(client.user.tag)}`
    );
    console.log('                                                                                ');
    console.log('                                                                                ');
}

module.exports = {
    displayCommands,
    displayBlueMessage,
    display_error_message,
    display_header,
    displayConnectionStatus
};