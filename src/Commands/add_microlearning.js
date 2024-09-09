/** src/Commands/add_microlearning.js
 *  @fileoverview This file contains the command to add a new microlearning fact.
 */

/* Required modules */
const { SlashCommandBuilder } = require('@discordjs/builders');
const { addMicrolearningData } = require('../database/mongodb');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addmicrolearning')
        .setDescription('Add a new microlearning fact')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the microlearning fact')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('The description of the microlearning fact')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('article')
                .setDescription('The link to the article')
                .setRequired(true)),
        

    async execute(interaction) {
        const microlearning_title = interaction.options.getString('title');
        const microlearning_description = interaction.options.getString('description');
        const microlearning_article = interaction.options.getString('article');

        // Check if microlearning article is a valid URL
        if (!microlearning_article.startsWith('http')) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000') // Red color for error
                .setTitle('Invalid URL')
                .setDescription('The article link provided is not a valid URL. Please provide a valid URL.')
                .setTimestamp();

            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
        try {
            const result = await addMicrolearningData(microlearning_title, microlearning_description, microlearning_article);  // Calls the function once to handle addition

            if (result === null) {
                const embed = new EmbedBuilder()
                    .setColor('#FFA500') // Orange color for warning
                    .setTitle('Microlearning Fact Already Exists')
                    .setDescription(`Microlearning fact **"${microlearning_title}"** already exists in the database.`)
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], ephemeral: true }); // Sends the embed privately
            }

            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00') // Green color for success
                .setTitle('Microlearning Fact Added Successfully')
                .setDescription(`MIcrolearning Fact **"${microlearning_title}"** has been added to the database and is now available.`)
                .addFields(
                    { name: 'Action:', value: 'Microlearning Fact Creation', inline: true },
                    { name: 'Status:', value: 'Success', inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.reply({ embeds: [successEmbed] });

        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000') // Red color for error
                .setTitle('Error')
                .setDescription(`Failed to add Microlearning fact: ${error.message}`)
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};
