    /* src/Commands/delete_leetcode_acc.js
    * @fileoverview This file contains the command to delete a leetcode account from the database.
    */

    /* Required modules */
    const { SlashCommandBuilder } = require('@discordjs/builders');
    const { EmbedBuilder } = require('discord.js');
    const { delete_leetcode_account, fetch_leetcode_accounts } = require('../database/mongodb');
    const { displayCommands, displayBlueMessage, display_error_message } = require('../helper/terminal_enhancement');

    module.exports = {
        
        /* The data property of the command */
        data: new SlashCommandBuilder()
            .setName('delete_account')
            .setDescription('Delete a leetcode account from the database')
            .addStringOption(option =>
                option.setName('account')
                    .setDescription('The leetcode account name to delete')
                    .setRequired(true)
                    .setAutocomplete(true)),
                
        // Auto-complete logic for account name
        async autocomplete(interaction) {
            console.log('Autocomplete triggered');
            const focusedOption = interaction.options.getFocused(true);
        
            // Check if the autocomplete is for 'account_name'
            if (focusedOption.name === 'account') {
                try {
                    const accounts = await fetch_leetcode_accounts();
    
                    if (!accounts || accounts.length === 0) {
                        // No accounts found, respond with an empty array
                        await interaction.respond([]);
                        return;
                    }
        
                    // Respond with filtered results based on input value
                    const filtered = accounts
                        .filter(account => account.Leetcode_account)
                        .slice(0, 25); // Limit to 25 results, Discord's max
    
                    await interaction.respond(
                        filtered.map(account => ({ name: account.Leetcode_account, value: account.Leetcode_account }))
                   );
                } catch (error) {
                    console.error('Error fetching accounts for autocomplete:', error);
                    await interaction.respond([]); // Respond with an empty list in case of error
                }
            }
        },
            /* The execute property of the command */
            async execute(interaction) {
                const account_name = interaction.options.getString('account');
        
                /* Fetch the accounts from the database */
                const accounts = await fetch_leetcode_accounts();
        
                /* Check if the account name exists in the database */
                if (!accounts.some(account => account.Leetcode_account === account_name)) {
                    const embed = new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('Account Not Found')
                        .setDescription(`The account named "${account_name}" does not exist in the database.`);
        
                    /* Log the command usage */
                    displayCommands("delete_account", interaction.user.tag, 0);
                    displayBlueMessage("The account named ", account_name, " does not exist in the database.\n\n");
                    await interaction.reply({ embeds: [embed] });
                    return;
                }
        
                try {
                    /* Delete the account name from the database */
                    await new Promise((resolve, reject) => {
                        delete_leetcode_account(account_name, (error) => {
                            if (error) {
                                display_error_message('Error deleting account from the database: ', error);
                                reject();
                            } else {
                                resolve();
                            }
                        });
                    });
        
                    /* Create the embed */
                    const embed = new EmbedBuilder()
                        .setColor(0x00ff00)
                        .setTitle('Account Deleted')
                        .setDescription(`The account named "${account_name}" has been deleted from the database.`);
        
                    /* Log the command usage */
                    displayCommands("delete_account", interaction.user.tag, 1);
                    displayBlueMessage("The account named ", account_name, " has been deleted from the database.\n\n");
                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    display_error_message('Error deleting account from the database: ', error);
                }
            }
        };