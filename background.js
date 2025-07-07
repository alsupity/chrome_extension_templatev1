// PocketOption Trading Assistant - Background Script
// خدمة الخلفية للإضافة

let notifications = [];
let tradingData = {};
let settings = {
    notifications: true,
    soundAlerts: true,
    autoAnalysis: true
};

// معالجة الرسائل
function handleMessage(request, sender, sendResponse) {
    switch (request.action) {
        case 'newSignal':
            handleNewSignal(request.data, sender.tab);
            sendResponse({ success: true });
            break;

        case 'updateData':
            updateTradingData(request.data, sender.tab.id);
            sendResponse({ success: true });
            break;

        case 'showNotification':
            showNotification(request.title, request.message, request.type);
            sendResponse({ success: true });
            break;

        case 'getSettings':
            sendResponse({ settings: settings });
            break;

        case 'updateSettings':
            updateSettings(request.settings);
            sendResponse({ success: true });
            break;

        default:
            sendResponse({ error: 'Unknown action' });
    }
}

function handleInstallation(details) {
    if (details.reason === 'install') {
        showWelcomeNotification();
        setDefaultSettings();
    } else if (details.reason === 'update') {
        console.log('تم تحديث الإضافة إلى الإصدار الجديد');
    }
}

function handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('pocketoption.com')) {
        showNotification(
            'محلل PocketOption جاهز',
            'تم تحميل محلل التداول بنجاح',
            'success'
        );
    }
}

function handleAlarm(alarm) {
    switch (alarm.name) {
        case 'marketCheck':
            performMarketCheck();
            break;
        case 'dataCleanup':
            cleanupOldData();
            break;
    }
}

function handleNewSignal(signalData, tab) {
    if (!tradingData[tab.id]) {
        tradingData[tab.id] = {
            signals: [],
            lastUpdate: Date.now()
        };
    }

    tradingData[tab.id].signals.push({
        ...signalData,
        timestamp: Date.now(),
        tabId: tab.id
    });

    if (signalData.confidence > 75) {
        showStrongSignalNotification(signalData);
    }

    updateBadge(tab.id);
}

function updateTradingData(data, tabId) {
    if (!tradingData[tabId]) {
        tradingData[tabId] = {};
    }

    tradingData[tabId] = {
        ...tradingData[tabId],
        ...data,
        lastUpdate: Date.now()
    };
}

function showNotification(title, message, type = 'info') {
    if (!settings.notifications) return;

    try {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            title: title,
            message: message,
            priority: type === 'high' ? 2 : 1
        });
    } catch (error) {
        console.log('Notification error:', error);
    }
}

function showStrongSignalNotification(signalData) {
    const title = '🎯 إشارة قوية!';
    const message = `${translateAction(signalData.action)} - الثقة: ${signalData.confidence.toFixed(0)}%`;

    showNotification(title, message, 'signal');
}

function showWelcomeNotification() {
    showNotification(
        'مرحباً بك في محلل PocketOption',
        'تم تثبيت الإضافة بنجاح. افتح PocketOption لبدء التحليل.',
        'info'
    );
}

function updateBadge(tabId) {
    const tabData = tradingData[tabId];
    if (tabData && tabData.signals) {
        const recentSignals = tabData.signals.filter(
            signal => Date.now() - signal.timestamp < 300000
        );

        try {
            chrome.action.setBadgeText({
                text: recentSignals.length > 0 ? recentSignals.length.toString() : '',
                tabId: tabId
            });

            chrome.action.setBadgeBackgroundColor({
                color: recentSignals.length > 0 ? '#4CAF50' : '#F44336'
            });
        } catch (error) {
            console.log('Badge error:', error);
        }
    }
}

function translateAction(action) {
    switch (action) {
        case 'CALL': return 'شراء (CALL)';
        case 'PUT': return 'بيع (PUT)';
        default: return action;
    }
}

function loadSettings() {
    chrome.storage.sync.get(['poSettings'], (result) => {
        if (result.poSettings) {
            settings = { ...settings, ...result.poSettings };
        }
    });
}

function updateSettings(newSettings) {
    settings = { ...settings, ...newSettings };
    chrome.storage.sync.set({ poSettings: settings });
}

function setDefaultSettings() {
    chrome.storage.sync.set({
        poSettings: settings,
        poFirstRun: true
    });
}

function performMarketCheck() {
    chrome.tabs.query({ url: '*://*.pocketoption.com/*' }, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { action: 'marketCheck' });
        });
    });
}

function cleanupOldData() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);

    Object.keys(tradingData).forEach(tabId => {
        const tabData = tradingData[tabId];
        if (tabData.signals) {
            tabData.signals = tabData.signals.filter(
                signal => signal.timestamp > cutoffTime
            );
        }

        if (tabData.lastUpdate < cutoffTime) {
            delete tradingData[tabId];
        }
    });
}

// إعداد مستمعي الأحداث
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request, sender, sendResponse);
    return true;
});

chrome.runtime.onInstalled.addListener((details) => {
    handleInstallation(details);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    handleTabUpdate(tabId, changeInfo, tab);
});

chrome.alarms.onAlarm.addListener((alarm) => {
    handleAlarm(alarm);
});

// إعداد الإنذارات الدورية
chrome.alarms.create('marketCheck', { periodInMinutes: 1 });
chrome.alarms.create('dataCleanup', { periodInMinutes: 60 });

// معالج النقر على الإشعارات
if (chrome.notifications) {
    chrome.notifications.onClicked.addListener((notificationId) => {
        chrome.notifications.clear(notificationId);
    });
}

// تحميل الإعدادات عند البدء
loadSettings();

console.log('🚀 PocketOption Background Service بدأ العمل');
