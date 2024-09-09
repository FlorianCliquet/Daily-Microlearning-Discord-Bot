/** src/Autorunning/cronjob.js
 * @fileoverview This file contains the cron job configuration for auto-running functions.
 */

/* Required modules */
const cron = require('node-cron');
const { dailyPDF } = require('./7am/dailyPDF');
const { dailyLeetcode } = require('./7am/dailyLeetcode');
const { dailyMicroLearning } = require('./7am/dailyMicroLearning'); // Uncomment if needed
const { dailyRecap } = require('./4pm/dailyRecap');
const fs = require('fs');
const path = require('path');

/* Load environment variables */
require('dotenv').config();

const dotenvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(dotenvPath)) {
    require('dotenv').config({ path: dotenvPath });
}

const morningHour = process.env.MORNING_HOUR || '7';
const eveningHour = process.env.EVENING_HOUR || '16';

/* Schedule daily tasks */
function scheduleDailyLeetcode(client) {
    cron.schedule(`0 ${morningHour} * * *`, async () => {
        await dailyLeetcode(client);
    });
}

function scheduleDailyPDF(client) {
    cron.schedule(`0 ${morningHour} * * *`, async () => {
        await dailyPDF(client);
    });
}

function scheduleDailyRecap(client) {
    cron.schedule(`0 ${eveningHour} * * *`, async () => {
        await dailyRecap(client);
    });
}

function scheduleDailyMicroLearning(client) {
    cron.schedule(`0 ${morningHour} * * *`, async () => {
        await dailyMicroLearning(client);
    });
}
/* Initialize all scheduled tasks */
function handle_AutoRunning_funcion(client) {
    console.log('Setting up cron jobs');
    scheduleDailyLeetcode(client);
    scheduleDailyPDF(client);
    scheduleDailyRecap(client);
    scheduleDailyMicroLearning(client);
}

module.exports = { handle_AutoRunning_funcion };
