const { SlashCommandBuilder } = require('@discordjs/builders');
const { addPDF, fetchAllMasterPDFs } = require('../database/mongodb');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addpdf')
        .setDescription('Add a new PDF to an existing master PDF')
        .addStringOption(option =>
            option.setName('masterpdf')
                .setDescription('Select the master PDF')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('pdfname')
                .setDescription('Enter the name of the PDF')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('pdflink')
                .setDescription('Enter the link to the PDF')
                .setRequired(true)),

    async autocomplete(interaction) {
        const masterPDFs = await fetchAllMasterPDFs(); // Fetch available master PDFs from DB
        console.log(masterPDFs);
        await interaction.respond(
            masterPDFs.map(pdf => ({ name: pdf.nom, value: pdf.nom }))
        );
    },

    async execute(interaction) {
        const masterPDF = interaction.options.getString('masterpdf');
        const pdfName = interaction.options.getString('pdfname');
        const pdfLink = interaction.options.getString('pdflink');

        try {
            // Add the new PDF to the database
            await addPDF(masterPDF, pdfName, pdfLink);

            // Success Embed
            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00') // Green for success
                .setTitle('PDF Added Successfully')
                .setDescription(`PDF **"${pdfName}"** has been added to master PDF **"${masterPDF}"**.`)
                .addFields(
                    { name: 'PDF Link', value: `${pdfLink}`, inline: true },
                    { name: 'Action:', value: 'PDF Addition', inline: true },
                    { name: 'Status:', value: 'Success', inline: true })
                .setTimestamp()
                .setFooter({ text: `Added by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.reply({ embeds: [successEmbed] });
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000') // Red for error
                .setTitle('Error Adding PDF')
                .setDescription(`Failed to add the PDF: ${error.message}`)
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};
