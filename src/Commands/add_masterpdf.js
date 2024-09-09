/** src/Commands/add_masterpdf.js
 *  @fileoverview This file contains the command to add a new master PDF and its associated PDFs.
 */

/* Required modules */
const { SlashCommandBuilder } = require('@discordjs/builders');
const { addMasterPDF } = require('../database/mongodb');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addmasterpdf')
        .setDescription('Add a new master PDF and its associated PDFs')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the master PDF')
                .setRequired(true)),

    async execute(interaction) {
        const masterPDFName = interaction.options.getString('name');

        try {
            const result = await addMasterPDF(masterPDFName);  // Calls the function once to handle addition

            if (result === null) {
                const embed = new EmbedBuilder()
                    .setColor('#FFA500') // Orange color for warning
                    .setTitle('Master PDF Already Exists')
                    .setDescription(`Master PDF **"${masterPDFName}"** already exists in the database.`)
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], ephemeral: true }); // Sends the embed privately
            }

            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00') // Green color for success
                .setTitle('Master PDF Added Successfully')
                .setDescription(`Master PDF **"${masterPDFName}"** has been added to the database and is now available.`)
                .addFields(
                    { name: 'Action:', value: 'Master PDF Creation', inline: true },
                    { name: 'Status:', value: 'Success', inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.reply({ embeds: [successEmbed] });

        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000') // Red color for error
                .setTitle('Error')
                .setDescription(`Failed to add Master PDF: ${error.message}`)
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};
