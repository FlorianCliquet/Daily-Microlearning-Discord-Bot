/* src/Commands/show_accounts.js
 * @fileoverview This command is used to show all the LeetCode accounts in the database.
/*

/* Required modules */
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { fetch_leetcode_accounts } = require('../database/mongodb');
const { displayBlueMessage, display_error_message, displayCommands } = require('../helper/terminal_enhancement');

module.exports = {

    /* The data property of the command */
    data: new SlashCommandBuilder()
        .setName('show_leetcode_acc')
        .setDescription('Show all LeetCode accounts in the database'),

    /* The execute property of the command */
    async execute(interaction) {
        try {
            /* Fetch the accounts from the database */
            const accounts = await fetch_leetcode_accounts();

            /* Check if the database is empty */
            if (accounts.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('Database Empty')
                    .setDescription('There are no accounts in the database.')
                    .setThumbnail('https://leetcode.com/static/images/LeetCode_logo_rvs.png');

                /* Log the command usage */
                displayCommands("show_accounts", interaction.user.tag, 0);
                displayBlueMessage("There are no accounts in the database.\n\n");
                await interaction.reply({ embeds: [embed] });
                return;
            }

            /* Group accounts by Discord user */
            const groupedAccounts = accounts.reduce((acc, account) => {
                if (!acc[account.Discord_user]) {
                    acc[account.Discord_user] = []; // Consistent case
                }
                acc[account.Discord_user].push(account.Leetcode_account); // Fixed the key reference
                return acc;
            }, {});

            /* Create the embed */
            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('Accounts in the Database')
                .setThumbnail('https://leetcode.com/static/images/LeetCode_logo_rvs.png');

            Object.entries(groupedAccounts).forEach(([discordUser, leetcodeAccounts]) => {
                embed.addFields({ name: `Discord User: ${discordUser}`, value: leetcodeAccounts.join('\n') });
            });

            /* Log the command usage */
            displayCommands("show_accounts", interaction.user.tag, accounts.length);
            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching LeetCode accounts:', error);
            display_error_message(interaction, 'An error occurred while fetching accounts. Please try again later.');
        }
    }
};
