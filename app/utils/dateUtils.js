const { DateTime, Duration } = require("luxon");

/**
 * Retrieves the current date and time in Indian Standard Time (IST) and optionally formats it.
 *
 * @param {boolean} [formatStr=true] - Specifies whether the output should be formatted as a string. if false a Luxon DateTime object will be returned.
 * @param {string} [format="yyyy-MM-dd'T'HH:mm:ss"] - The datetime string format. Uses Luxon's format string syntax. Applicable only if `formatStr` is true.
 * @returns {string|DateTime} The current datetime in IST. If `formatStr` is true, returns string; otherwise, a Luxon DateTime object.
 */
function getISTDateTime(formatStr = true, format = "yyyy-MM-dd\'T\'HH:mm:ss") {
    const dt = DateTime.now().setZone('Asia/Kolkata');
    const formattedDateTime = formatStr ? dt.toFormat(format) : dt;
    return formattedDateTime;  // Output: "2023-08-17T14:25:30" (example output)
};

/**
 * Calculates a new date and time by adding a specified time delta to a given start time.
 *
 * @param {Object} options - An object containing values for adjusting the time. Can include properties like hours, minutes, seconds, years, months, and days.
 * @param {string} [format="yyyy-MM-dd'T'HH:mm:ss"] - The format in which the datetime should be returned. Uses Luxon's format string syntax.
 * @param {string} [startTime=getISTDateTime()] - The starting date and time in ISO format. If not provided, the current IST (Indian Standard Time) date and time will be used.
 * @returns {string} The calculated date and time in the specified format.
 */
function calculateTimeDelta(options, format = "yyyy-MM-dd\'T\'HH:mm:ss", startTime = getISTDateTime()) {
    console.log("start_time: " + startTime);
    const inputDatetime = DateTime.fromISO(startTime);
    let timeDelta = Duration.fromObject(options);
    return inputDatetime.plus(timeDelta).toFormat(format);
};

module.exports = { getISTDateTime, calculateTimeDelta };