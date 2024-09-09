/** src/Commands/delete_microlearning.js 
 * @fileoverview This file contains the command to delete a microlearning fact.
 */

const { SlashCommandBuilder } = require('@discordjs/builders');
const { removeMicrolearningData, fetchMicrolearningData } = require('../database/mongodb');
const { EmbedBuilder } = require('discord.js');
const { display_error_message, displayCommands, displayBlueMessage } = require('../helper/terminal_enhancement');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete_microlearning')
        .setDescription('Delete a microlearning fact')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the microlearning fact to delete')
                .setRequired(true)
                .setAutocomplete(true)),

    // Autocomplete function for Microlearning titles
    async autocomplete(interaction) {
        try {
            const focusedValue = interaction.options.getFocused();
            const microlearningData = await fetchMicrolearningData(); // Fetch all microlearning data
            const filtered = microlearningData
                .filter(fact => fact.title.toLowerCase().startsWith(focusedValue.toLowerCase()))
                .slice(0, 25); // Limit results to 25 for better performance
            
            await interaction.respond(
                filtered.map(fact => ({ name: fact.title, value: fact.title }))
            );
        } catch (error) {
            display_error_message('Error during autocomplete in delete_microlearning command:', error);
        }
    },

    // Command execution for deleting the microlearning fact
    async execute(interaction) {
        const title = interaction.options.getString('title');

        try {
            // Fetch the microlearning fact for validation
            const microlearningData = await fetchMicrolearningData();
            const factToDelete = microlearningData.find(fact => fact.title === title);

            // Check if the fact exists before attempting to delete
            if (!factToDelete) {
                const notFoundEmbed = new EmbedBuilder()
                    .setColor('#FFA500') // Orange color for warning
                    .setTitle('Microlearning Fact Not Found')
                    .setDescription(`No microlearning fact found with the title **"${title}"**. Please check the title and try again.`)
                    .setTimestamp();

                return interaction.reply({ embeds: [notFoundEmbed], ephemeral: true });
            }

            // Proceed with deletion
            const result = await removeMicrolearningData(title);
            if (result.deletedCount === 0) {
                const failedEmbed = new EmbedBuilder()
                    .setColor('#FFA500') // Orange color for warning
                    .setTitle('Deletion Failed')
                    .setDescription(`Failed to delete microlearning fact **"${title}"**. It may have already been removed or an issue occurred.`)
                    .setTimestamp();

                return interaction.reply({ embeds: [failedEmbed], ephemeral: true });
            }

            // Success embed with details of deletion
            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00') // Green color for success
                .setTitle('Microlearning Fact Deleted Successfully')
                .setDescription(`Microlearning fact **"${title}"** has been deleted from the database.`)
                .setTimestamp()
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.reply({ embeds: [successEmbed] });

            // Log the successful deletion
            displayCommands('delete_microlearning', interaction.user.tag, 1);
            displayBlueMessage(`Microlearning fact "${title}" deleted successfully.`);

        } catch (error) {
            // Log error details for debugging
            display_error_message('Error executing delete_microlearning command:', error);

            // Inform the user of the error
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000') // Red color for error
                .setTitle('Error')
                .setDescription(`Failed to delete microlearning fact **"${title}"** due to an internal error. Please try again later.`)
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};
