// DOM Elements
const ui = {
    latInput: document.getElementById('lat'),
    lngInput: document.getElementById('lng'),
    locateBtn: document.getElementById('locateBtn'),
    fullDate: document.getElementById('fullDate'),
    liveClock: document.getElementById('liveClock'),
    displayLocation: document.getElementById('displayLocation'),

    // Solar Values
    valSunrise: document.getElementById('val-sunrise'),
    valSunset: document.getElementById('val-sunset'),
    valNoon: document.getElementById('val-noon'),
    valQibla: document.getElementById('val-qibla'),
    valDayLen: document.getElementById('val-daylen'),
    compassDisk: document.getElementById('compassDisk'),

    // Audio
    muteBtn: document.getElementById('muteBtn'),
    audio: document.getElementById('adhanAudio'),

    // Views & Nav
    views: document.querySelectorAll('.app-view'),
    navItems: document.querySelectorAll('.nav-item'),
    calendarTable: document.getElementById('calendarTable'),

    // Prayer Cards
    cards: {
        fajr: document.getElementById('card-fajr'),
        dhuhr: document.getElementById('card-dhuhr'),
        asr: document.getElementById('card-asr'),
        maghrib: document.getElementById('card-maghrib'),
        isha: document.getElementById('card-isha')
    },
    times: {
        fajr: document.getElementById('time-fajr'),
        dhuhr: document.getElementById('time-dhuhr'),
        asr: document.getElementById('time-asr'),
        maghrib: document.getElementById('time-maghrib'),
        isha: document.getElementById('time-isha')
    },
    countdowns: {
        fajr: document.getElementById('cd-fajr'),
        dhuhr: document.getElementById('cd-dhuhr'),
        asr: document.getElementById('cd-asr'),
        maghrib: document.getElementById('cd-maghrib'),
        isha: document.getElementById('cd-isha')
    },

    // Progress Widget
    progressBar: document.getElementById('prayerProgressBar'),
    progressPercentage: document.getElementById('progressPercentage'),
    prevPrayerName: document.getElementById('prevPrayerName'),
    nextPrayerName: document.getElementById('nextPrayerName'),
    mainCountdown: document.getElementById('mainCountdown'),

    // Compass
    activateCompass: document.getElementById('activateCompass'),
    compassStatus: document.getElementById('compassStatus'),

    // Calendar Navigation
    prevMonth: document.getElementById('prevMonth'),
    nextMonth: document.getElementById('nextMonth'),
    calendarMonthTitle: document.getElementById('calendarMonthTitle'),
    ramadanBadge: document.getElementById('ramadanBadge'),

    // Settings
    darkModeToggle: document.getElementById('darkModeToggle'),
    saveSettings: document.getElementById('saveSettings'),
    resetSettings: document.getElementById('resetSettings'),
    mainDateInput: document.getElementById('mainDateInput'),
    todayBtn: document.getElementById('todayBtn')
};

// State
let state = {
    lat: 37.0400,
    lng: 9.6650,
    date: new Date(),
    currentView: 'view-dashboard',
    lastBackground: '',
    calendarMonth: new Date(), // Track calendar month separately
    offsets: {
        fajr: 0,
        dhuhr: 7, // Fixed: 7 minutes after noon
        asr: 0,
        maghrib: 2, // Fixed: 2 minutes after sunset
        isha: 0
    },
    darkMode: false
};

// Initialization
function init() {
    const today = new Date();
    if (ui.mainDateInput) ui.mainDateInput.valueAsDate = today;

    // Navigation Logic
    ui.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetView = item.getAttribute('data-view');
            switchView(targetView);
        });
    });

    // Event Listeners for Date Changes
    const handleDateChange = (newDate) => {
        state.date = newDate;
        // Update dashboard input
        if (ui.mainDateInput) ui.mainDateInput.valueAsDate = newDate;

        updateStaticData();
        generateCalendar();
    };

    if (ui.mainDateInput) {
        ui.mainDateInput.addEventListener('change', () => {
            const d = ui.mainDateInput.valueAsDate || new Date(ui.mainDateInput.value);
            handleDateChange(d);
        });
    }

    if (ui.todayBtn) {
        ui.todayBtn.addEventListener('click', () => {
            handleDateChange(new Date());
        });
    }

    const updateCoords = () => {
        const lat = parseFloat(ui.latInput.value);
        const lng = parseFloat(ui.lngInput.value);
        if (!isNaN(lat) && !isNaN(lng)) {
            state.lat = lat;
            state.lng = lng;
            updateStaticData();
            generateCalendar();
            saveSettingsToStorage(); // Auto-save location
        }
    };

    ui.latInput.addEventListener('input', updateCoords);
    ui.lngInput.addEventListener('input', updateCoords);
    ui.locateBtn.addEventListener('click', locateUser);

    // Calendar Navigation
    if (ui.prevMonth) {
        ui.prevMonth.addEventListener('click', () => {
            state.calendarMonth.setMonth(state.calendarMonth.getMonth() + 1);
            generateCalendar();
        });
    }
    if (ui.nextMonth) {
        ui.nextMonth.addEventListener('click', () => {
            state.calendarMonth.setMonth(state.calendarMonth.getMonth() - 1);
            generateCalendar();
        });
    }

    // Initial Render
    updateStaticData();
    generateCalendar();

    // Start Timer
    setInterval(tick, 1000);
    tick();
}

function switchView(viewId) {
    ui.views.forEach(v => v.classList.remove('active'));
    ui.navItems.forEach(n => n.classList.remove('active'));

    document.getElementById(viewId).classList.add('active');
    document.querySelector(`[data-view="${viewId}"]`).classList.add('active');
    state.currentView = viewId;
}

// Geolocation
function locateUser() {
    if (navigator.geolocation) {
        ui.locateBtn.innerHTML = '⏳ جاري...';
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                state.lat = pos.coords.latitude;
                state.lng = pos.coords.longitude;
                ui.latInput.value = state.lat.toFixed(4);
                ui.lngInput.value = state.lng.toFixed(4);
                updateStaticData();
                generateCalendar();
                saveSettingsToStorage(); // Auto-save location
                ui.locateBtn.innerHTML = 'تحديث الموقع';
                ui.displayLocation.innerText = `📍 موقعك الحالي (${state.lat.toFixed(2)}, ${state.lng.toFixed(2)})`;
                setTimeout(() => ui.locateBtn.innerHTML = 'تحديث الموقع', 2000);
            },
            (err) => {
                alert('تعذر تحديد الموقع: ' + err.message);
                ui.locateBtn.innerHTML = 'تحديث الموقع';
            }
        );
    }
}

// Update Static Data
let dailyData = null;

function updateStaticData() {
    dailyData = Calculator.calculate(state.date, state.lat, state.lng);

    // Apply offsets
    dailyData.fajr += state.offsets.fajr;
    dailyData.dhuhr += state.offsets.dhuhr;
    dailyData.asr += state.offsets.asr;
    dailyData.maghrib += state.offsets.maghrib;
    dailyData.isha += state.offsets.isha;

    // Update Header Dates
    const greg = new Intl.DateTimeFormat('ar-TN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(state.date);
    const hijri = new Intl.DateTimeFormat('ar-TN-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(state.date);
    ui.fullDate.innerHTML = `${greg} <span style="color:var(--gold)">|</span> ${hijri}`;

    // Solar Panel
    ui.valSunrise.innerText = Calculator.formatTime(dailyData.sunrise);
    ui.valSunset.innerText = Calculator.formatTime(dailyData.sunset);
    ui.valNoon.innerText = Calculator.formatTime(dailyData.noonIs);

    const dayLenMins = dailyData.dayLength;
    ui.valDayLen.innerText = `${Math.floor(dayLenMins / 60)}س ${Math.floor(dayLenMins % 60)}د`;

    // Qibla
    const qibla = Calculator.getQibla(state.lat, state.lng);
    ui.valQibla.innerText = qibla.toFixed(2);
    if (ui.compassDisk) {
        ui.compassDisk.style.transform = `rotate(${-qibla}deg)`;
    }

    // Prayer Times List
    ui.times.fajr.innerText = Calculator.formatTime(dailyData.fajr);
    ui.times.dhuhr.innerText = Calculator.formatTime(dailyData.dhuhr);
    ui.times.asr.innerText = Calculator.formatTime(dailyData.asr);
    ui.times.maghrib.innerText = Calculator.formatTime(dailyData.maghrib);
    ui.times.isha.innerText = Calculator.formatTime(dailyData.isha);
}

// Helper: Apply offsets to prayer times
function applyOffsets(times) {
    return {
        ...times,
        fajr: times.fajr + state.offsets.fajr,
        dhuhr: times.dhuhr + state.offsets.dhuhr,
        asr: times.asr + state.offsets.asr,
        maghrib: times.maghrib + state.offsets.maghrib,
        isha: times.isha + state.offsets.isha
    };
}

// Monthly Calendar Generation - Enhanced
function generateCalendar() {
    const monthNames = ["جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان", "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const year = state.calendarMonth.getFullYear();
    const month = state.calendarMonth.getMonth();

    // Update title
    if (ui.calendarMonthTitle) {
        ui.calendarMonthTitle.innerText = `📅 ${monthNames[month]} ${year}`;
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    // Check if ANY day in this month is Ramadan
    let hasRamadanDays = false;
    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        if (checkIfRamadan(d)) {
            hasRamadanDays = true;
            break;
        }
    }

    // Show/hide Ramadan badge
    if (ui.ramadanBadge) {
        ui.ramadanBadge.style.display = hasRamadanDays ? 'inline-block' : 'none';
    }

    // Build table header
    let html = `<table class="calendar-table">
        <thead>
            <tr>
                <th>اليوم</th>`;

    if (hasRamadanDays) {
        html += `<th>إمساك</th>`;
    }

    html += `<th>فجر</th>
                <th>ظهر</th>
                <th>عصر</th>
                <th>مغرب</th>
                <th>عشاء</th>
            </tr>
        </thead>
        <tbody>`;

    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        let times = Calculator.calculate(d, state.lat, state.lng);
        times = applyOffsets(times); // Apply custom offsets here

        const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const isDayInRamadan = checkIfRamadan(d);

        html += `<tr class="${isToday ? 'today' : ''}">
            <td>${i} ${monthNames[month]}</td>`;

        if (hasRamadanDays) {
            if (isDayInRamadan) {
                // Imsak = Fajr - 10 minutes
                const imsakTime = times.fajr - 10;
                html += `<td class="imsak-time">${Calculator.formatTime(imsakTime)}</td>`;
            } else {
                html += `<td>-</td>`;
            }
        }

        html += `<td>${Calculator.formatTime(times.fajr)}</td>
            <td>${Calculator.formatTime(times.dhuhr)}</td>
            <td>${Calculator.formatTime(times.asr)}</td>
            <td>${Calculator.formatTime(times.maghrib)}</td>
            <td>${Calculator.formatTime(times.isha)}</td>
        </tr>`;
    }

    html += `</tbody></table>`;
    ui.calendarTable.innerHTML = html;
}

// Check if date is in Ramadan (Hijri month 9)
function checkIfRamadan(date) {
    try {
        // Method 1: Try formatToParts
        const hijriFormatter = new Intl.DateTimeFormat('ar-TN-u-ca-islamic-umalqura', {
            month: 'long',
            year: 'numeric',
            day: 'numeric'
        });

        const hijriDate = hijriFormatter.format(date);
        console.log(`Hijri Date for ${date.toLocaleDateString('ar-TN')}: ${hijriDate}`);

        // Check if it contains "رمضان" in Arabic
        if (hijriDate.includes('رمضان')) {
            console.log('✅ Ramadan detected via month name!');
            return true;
        }

        // Method 2: Manual calculation for 2026
        // Ramadan 2026 starts around February 18-19, 2026 and ends around March 19, 2026
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-indexed
        const day = date.getDate();

        if (year === 2026) {
            // February 18 - March 19, 2026
            if ((month === 1 && day >= 18) || (month === 2 && day <= 19)) {
                console.log('✅ Ramadan 2026 detected via manual dates!');
                return true;
            }
        }

        // For other years, try to detect via Hijri calendar
        const parts = hijriFormatter.formatToParts(date);
        const monthPart = parts.find(p => p.type === 'month');

        if (monthPart && monthPart.value.includes('رمضان')) {
            console.log('✅ Ramadan detected via formatToParts!');
            return true;
        }

        console.log('❌ Not Ramadan');
        return false;
    } catch (e) {
        console.error('Ramadan detection error:', e);
        return false;
    }
}

// Live Updates
// Track last system date to detect midnight transition
let lastSystemDate = new Date().getDate();

function tick() {
    const now = new Date();
    ui.liveClock.innerText = now.toLocaleTimeString('en-GB');

    // Handle real midnight transition
    if (now.getDate() !== lastSystemDate) {
        lastSystemDate = now.getDate();
        // Only auto-update state.date if the user was looking at the "current" date
        // For simplicity, we can just update the static data if they haven't picked a specific day
        // But the safest is to just refresh the whole state if it's a new day
        state.date = now;
        if (ui.dateInput) ui.dateInput.valueAsDate = now;
        if (ui.mainDateInput) ui.mainDateInput.valueAsDate = now;
        updateStaticData();
        generateCalendar();
    }

    if (!dailyData) return;

    // Calculate minutes since start of the day (for the SELECTED state.date)
    // If state.date is NOT today, we should probably display 0 or handled differently
    // But for viewing future dates, we typically just show the static times.
    // The countdown only makes sense for "Today"

    const isToday = state.date.getDate() === now.getDate() &&
        state.date.getMonth() === now.getMonth() &&
        state.date.getFullYear() === now.getFullYear();

    if (isToday) {
        const curMins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
        updateActivePrayer(curMins);
    } else {
        // Clear active/next states if we are looking at a different day
        Object.values(ui.cards).forEach(c => c.classList.remove('active', 'next-prayer', 'approaching'));
        ui.mainCountdown.innerText = "--:--:--";
        ui.nextPrayerName.innerText = "يوم آخر";
        ui.prayerProgressBar.style.width = "0%";
    }
}

// Audio State
let isMuted = true;
let lastAudioPlayTime = -1;
let lastNotificationRef = '';

ui.muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    ui.muteBtn.innerHTML = isMuted ? '🔇' : '🔊';
    if (Notification.permission !== 'granted') Notification.requestPermission();
    if (!isMuted) {
        ui.audio.play().then(() => ui.audio.pause()).catch(e => console.log('Audio init', e));
    }
});

function updateActivePrayer(curMins) {
    const prayers = [
        { key: 'fajr', time: dailyData.fajr, name: 'الفجر' },
        { key: 'dhuhr', time: dailyData.dhuhr, name: 'الظهر' },
        { key: 'asr', time: dailyData.asr, name: 'العصر' },
        { key: 'maghrib', time: dailyData.maghrib, name: 'المغرب' },
        { key: 'isha', time: dailyData.isha, name: 'العشاء' }
    ];

    let nextPrayer = null;
    let prevPrayer = null;

    for (let i = 0; i < prayers.length; i++) {
        if (prayers[i].time > curMins) {
            nextPrayer = prayers[i];
            prevPrayer = i > 0 ? prayers[i - 1] : { key: 'isha', time: prayers[4].time - 1440, name: 'العشاء' };
            break;
        }
    }

    if (!nextPrayer) {
        // Between Isha and Fajr Tomorrow
        nextPrayer = { ...prayers[0], time: prayers[0].time + 1440 };
        prevPrayer = prayers[4];
    }

    let diff = nextPrayer.time - curMins;

    // Audio Trigger Logic
    if (diff > 0 && diff < 0.02) {
        const nowSec = Math.floor(Date.now() / 1000);
        if (nowSec !== lastAudioPlayTime) {
            lastAudioPlayTime = nowSec;
            if (!isMuted) {
                let audioSrc = 'assets/adhan.mp3';
                if (nextPrayer.key === 'fajr') audioSrc = 'assets/adhan_fajr.mp3';
                ui.audio.src = audioSrc;
                ui.audio.currentTime = 0;
                ui.audio.play().catch(e => console.log('Autoplay blocked', e));
            }
        }
    }

    // Reset all cards
    Object.values(ui.cards).forEach(c => c.classList.remove('active', 'next-prayer', 'approaching'));

    // activeKey is the "Next" prayer
    let activeKey = nextPrayer.key;

    if (nextPrayer) {
        ui.cards[activeKey].classList.add('active');

        if (diff <= 5 && diff > 0) {
            ui.cards[activeKey].classList.add('approaching');
            const notifKey = `${activeKey}-5min`;
            if (lastNotificationRef !== notifKey && Notification.permission === "granted") {
                new Notification("قرب وقت الصلاة", {
                    body: `تبقي 5 دقائق على صلاة ${nextPrayer.name}`,
                    icon: 'assets/icon-192.png'
                });
                lastNotificationRef = notifKey;
            }
        }
    }

    // --- Progress Bar Logic ---
    const totalDuration = nextPrayer.time - prevPrayer.time;
    const elapsed = curMins - prevPrayer.time;
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

    if (ui.progressBar) {
        ui.progressBar.style.width = `${progress}%`;
        ui.progressPercentage.innerText = `${Math.floor(progress)}%`;
        ui.prevPrayerName.innerText = prevPrayer.name;
        ui.nextPrayerName.innerText = nextPrayer.name;
    }

    // --- Dynamic Background ---
    const bgClass = `bg-${prevPrayer.key}`;
    if (state.lastBackground !== bgClass) {
        document.body.classList.remove('bg-fajr', 'bg-dhuhr', 'bg-asr', 'bg-maghrib', 'bg-isha');
        document.body.classList.add(bgClass);
        state.lastBackground = bgClass;
    }

    // Format Countdown
    const dH = Math.floor(diff / 60);
    const dM = Math.floor(diff % 60);
    const dS = Math.floor((diff * 60) % 60);
    const diffStr = `${String(dH).padStart(2, '0')}:${String(dM).padStart(2, '0')}:${String(dS).padStart(2, '0')}`;

    if (ui.mainCountdown) {
        ui.mainCountdown.innerText = diffStr;
    }
}

// ========== LIVE COMPASS FUNCTIONALITY ==========
let compassActive = false;
let deviceHeading = 0;

if (ui.activateCompass) {
    ui.activateCompass.addEventListener('click', async () => {
        if (compassActive) {
            // Deactivate
            compassActive = false;
            ui.activateCompass.innerHTML = '🧭 تفعيل البوصلة الحية';
            ui.compassStatus.innerText = 'البوصلة غير نشطة';
            ui.compassStatus.classList.remove('active');
            return;
        }

        // Request permission for iOS 13+
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission !== 'granted') {
                    alert('يجب السماح بالوصول إلى حساسات الجهاز لتفعيل البوصلة');
                    return;
                }
            } catch (error) {
                console.error('Permission error:', error);
                alert('حدث خطأ في طلب الإذن');
                return;
            }
        }

        // Activate compass
        compassActive = true;
        ui.activateCompass.innerHTML = '⏸️ إيقاف البوصلة';
        ui.compassStatus.innerText = 'البوصلة نشطة';
        ui.compassStatus.classList.add('active');

        // Listen to device orientation
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        window.addEventListener('deviceorientation', handleOrientation, true);
    });
}

function handleOrientation(event) {
    if (!compassActive) return;

    // Get compass heading
    let alpha = event.alpha; // 0-360 degrees
    let webkitAlpha = event.webkitCompassHeading; // iOS

    if (webkitAlpha !== undefined && webkitAlpha !== null) {
        deviceHeading = webkitAlpha;
    } else if (alpha !== undefined && alpha !== null) {
        deviceHeading = 360 - alpha; // Invert for standard compass
    } else {
        return;
    }

    // Update compass disk rotation
    // We rotate the disk to show device heading, and the arrow points to Qibla
    const qiblaAngle = Calculator.getQibla(state.lat, state.lng);
    const rotation = deviceHeading - qiblaAngle;

    if (ui.compassDisk) {
        ui.compassDisk.style.transform = `rotate(${rotation}deg)`;
    }
}

// ========== SETTINGS MANAGEMENT ==========

// Load settings from LocalStorage
function loadSettings() {
    const saved = localStorage.getItem('salatTunisieSettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            // Offsets are now fixed in state, only load other settings
            state.darkMode = settings.darkMode || false;
            state.lat = settings.lat || state.lat;
            state.lng = settings.lng || state.lng;

            // Apply to UI
            if (ui.darkModeToggle) ui.darkModeToggle.checked = state.darkMode;
            if (ui.latInput) ui.latInput.value = state.lat;
            if (ui.lngInput) ui.lngInput.value = state.lng;

            applyDarkMode(state.darkMode);

            console.log('✅ Settings loaded from LocalStorage');
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    }
}

// Save settings to LocalStorage
function saveSettingsToStorage() {
    const settings = {
        darkMode: state.darkMode,
        lat: state.lat,
        lng: state.lng
    };

    localStorage.setItem('salatTunisieSettings', JSON.stringify(settings));
    console.log('💾 Settings saved to LocalStorage');

    // Show feedback
    if (ui.saveSettings) {
        const originalText = ui.saveSettings.innerHTML;
        ui.saveSettings.innerHTML = '✅ تم الحفظ!';
        ui.saveSettings.style.background = 'linear-gradient(135deg, #4caf50, #388e3c)';

        setTimeout(() => {
            ui.saveSettings.innerHTML = originalText;
            ui.saveSettings.style.background = '';
        }, 2000);
    }
}

// Reset settings to defaults
function resetSettingsToDefaults() {
    if (!confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات؟')) {
        return;
    }

    state.darkMode = false;
    if (ui.darkModeToggle) ui.darkModeToggle.checked = false;

    applyDarkMode(false);
    saveSettingsToStorage();
    updateStaticData();
    generateCalendar();

    console.log('🔄 Settings reset to defaults');
}

// Apply dark mode
function applyDarkMode(enabled) {
    if (enabled) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// Settings event listeners
if (ui.saveSettings) {
    ui.saveSettings.addEventListener('click', () => {
        saveSettingsToStorage();
        updateStaticData();
        generateCalendar();
    });
}

if (ui.resetSettings) {
    ui.resetSettings.addEventListener('click', resetSettingsToDefaults);
}

if (ui.darkModeToggle) {
    ui.darkModeToggle.addEventListener('change', (e) => {
        state.darkMode = e.target.checked;
        applyDarkMode(state.darkMode);
        saveSettingsToStorage();
    });
}

// Load settings on startup
loadSettings();

init();
