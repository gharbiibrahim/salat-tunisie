/**
 * Salat Tunisia - Prayer Time Calculator
 * Based on astronomical algorithms with specific Tunisian adjustments.
 */

const Calculator = {
    // Configuration for Tunisian specific offsets (in minutes)
    offsets: {
        fajr: 0,
        sunrise: 0,
        dhuhr: 7,   // Added 7 minutes as per user requirement in original file
        asr: 0,
        maghrib: 2, // Added 2 minutes as per user requirement in original file
        isha: 0
    },

    /**
     * Formats decimal minutes into HH:MM:SS string
     * @param {number} minutes - Time in minutes from midnight
     * @returns {string} HH:MM:SS
     */
    formatTime: (minutes) => {
        if (isNaN(minutes)) return "--:--";
        let seconds = Math.max(0, Math.round(minutes * 60));
        const h = Math.floor(seconds / 3600) % 24;
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    },

    /**
     * Calculates prayer times and sun data
     * @param {Date} date - The date to calculate for
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     */
    calculate: function (date, lat, lng) {
        // Day of year calculation
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const day = Math.floor(diff / oneDay);

        // Astronomical Constants
        const b = (2 * Math.PI * (day - 81)) / 365.25;
        const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
        const dec = 23.45 * Math.sin((2 * Math.PI / 365) * (day + 284)); // Declination

        // Noon Calculation
        // (15 - lng) accounts for longitude difference from standard meridian (if using UTC, but here it seems to treat inputs as local mean time adjustments)
        // Note: The original generic formula often uses timezone. The original code used 4*(15-lng) which implies offsets from a reference.
        // Given it's working for the user, we keep the exact original math: `720 - eot + (4 * (15 - lg))`
        const rawNoon = 720 - eot + (4 * (15 - lng));

        // Helper for Hour Angle
        const r = lat * Math.PI / 180;
        const dr = dec * Math.PI / 180;

        const hourAngle = (angle) => {
            const numerator = Math.sin(angle * Math.PI / 180) - Math.sin(r) * Math.sin(dr);
            const denominator = Math.cos(r) * Math.cos(dr);
            // Clamp value for acos to avoid NaN on extreme latitudes/dates
            const clamped = Math.max(-1, Math.min(1, numerator / denominator));
            return Math.acos(clamped) * 180 / Math.PI;
        };

        // Calculations
        // Fajr & Isha: Sun at -18 degrees
        // Sunrise & Sunset: Sun at -0.833 degrees (accounting for refraction and semi-diameter)
        // Asr: Shadow length factor. Standard is 1 (Shafi'i/Maliki/Hanbali).
        const asrAngle = Math.atan(1 / (1 + 1 / Math.tan((90 - Math.abs(lat - dec)) * Math.PI / 180))) * 180 / Math.PI;

        const ha18 = hourAngle(-18) * 4;       // Degrees to Minutes
        const haSunrise = hourAngle(-0.833) * 4;
        const haAsr = hourAngle(asrAngle) * 4;

        // Raw Times (in minutes from midnight)
        const times = {
            fajr: rawNoon - ha18,
            sunrise: rawNoon - haSunrise,
            noon: rawNoon,
            asr: rawNoon + haAsr,
            sunset: rawNoon + haSunrise,
            maghrib: rawNoon + haSunrise, // Maghrib is technically sunset in this simplified model, often same base.
            isha: rawNoon + ha18
        };

        // Apply Tunisian Specific Adjustments
        const results = {
            fajr: times.fajr + this.offsets.fajr,
            sunrise: times.sunrise + this.offsets.sunrise,
            dhuhr: times.noon + this.offsets.dhuhr, // +7 minutes
            asr: times.asr + this.offsets.asr,
            maghrib: times.sunset + this.offsets.maghrib, // +2 minutes added to sunset time
            sunset: times.sunset, // Added missing sunset time
            isha: times.isha + this.offsets.isha,

            // Extra Data
            noonIs: times.noon, // True noon without offset
            eot: eot,
            declination: dec,
            dayLength: times.sunset - times.sunrise
        };

        return results;
    },

    /**
     * Calculates Qibla direction
     */
    getQibla: (lat, lng) => {
        const KAABA_LAT = 21.4225;
        const KAABA_LNG = 39.8262;

        const y = Math.sin((KAABA_LNG - lng) * Math.PI / 180);
        const x = Math.cos(lat * Math.PI / 180) * Math.tan(KAABA_LAT * Math.PI / 180)
            - Math.sin(lat * Math.PI / 180) * Math.cos((KAABA_LNG - lng) * Math.PI / 180);

        let q = Math.atan2(y, x) * 180 / Math.PI;
        return (q + 360) % 360;
    }
};

// Export to global scope for non-module usage
window.Calculator = Calculator;
