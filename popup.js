// PocketOption Trading Assistant - Popup Script
// واجهة التحكم الرئيسية للإضافة

class PopupController {
    constructor() {
        this.isConnected = false;
        this.currentData = null;
        this.settings = {
            autoAnalysis: true,
            notifications: true,
            riskLevel: 'medium'
        };
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.connectToContentScript();
        this.startDataUpdates();
    }

    loadSettings() {
        chrome.storage.sync.get(['poSettings'], (result) => {
            if (result.poSettings) {
                this.settings = { ...this.settings, ...result.poSettings };
            }
        });
    }

    saveSettings() {
        chrome.storage.sync.set({ poSettings: this.settings });
    }

    setupEventListeners() {
        // زر التحليل الفوري
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.performInstantAnalysis();
        });

        // زر الاختبار السريع
        document.getElementById('testBtn').addEventListener('click', () => {
            this.runQuickTest();
        });

        // زر تفعيل/إيقاف المحلل
        document.getElementById('toggleAnalyzer').addEventListener('click', () => {
            this.toggleAnalyzer();
        });

        // زر الإعدادات
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettings();
        });

        // زر إظهار لوحة التحليل
        document.getElementById('showPanelBtn').addEventListener('click', () => {
            this.showAnalysisPanel();
        });

        // زر إخفاء لوحة التحليل
        document.getElementById('hidePanelBtn').addEventListener('click', () => {
            this.hideAnalysisPanel();
        });

        // زر التشخيص المتقدم
        document.getElementById('diagnosticBtn').addEventListener('click', () => {
            this.runDiagnostics();
        });
    }

    connectToContentScript() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
                console.log('خطأ في الاستعلام عن التبويبات:', chrome.runtime.lastError);
                this.updateConnectionStatus(false);
                return;
            }

            if (tabs[0] && tabs[0].url && tabs[0].url.includes('pocketoption.com')) {
                this.isConnected = true;
                this.updateConnectionStatus(true);

                // طلب البيانات الحالية من content script
                chrome.tabs.sendMessage(tabs[0].id, { action: 'getData' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log('خطأ في الاتصال:', chrome.runtime.lastError);
                        this.updateConnectionStatus(false);
                        return;
                    }

                    if (response) {
                        this.updateUI(response);
                    }
                });
            } else {
                this.updateConnectionStatus(false);
                this.showNotConnectedMessage();
            }
        });
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connectionStatus');
        const statusText = document.getElementById('status');

        if (statusElement) {
            if (connected) {
                statusElement.className = 'connection-status connected';
            } else {
                statusElement.className = 'connection-status disconnected';
            }
        }

        if (statusText) {
            if (connected) {
                statusText.textContent = 'متصل بـ PocketOption';
            } else {
                statusText.textContent = 'غير متصل - افتح PocketOption';
            }
        }
    }

    showNotConnectedMessage() {
        const mainSignal = document.getElementById('mainSignal');
        mainSignal.innerHTML = `
            <h3>📊 الإشارة الحالية</h3>
            <div class="recommendation-box signal-none">
                <div class="recommendation-text">غير متصل</div>
                <p style="font-size: 12px; margin: 10px 0;">
                    يرجى فتح موقع PocketOption أولاً لبدء التحليل
                </p>
                <button class="button" onclick="window.open('https://pocketoption.com', '_blank')">
                    فتح PocketOption
                </button>
            </div>
        `;
    }

    performInstantAnalysis() {
        if (!this.isConnected) {
            this.showNotification('يرجى الاتصال بـ PocketOption أولاً', 'error');
            return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'analyze' }, (response) => {
                if (response) {
                    this.updateUI(response);
                    this.showNotification('تم التحليل بنجاح', 'success');
                }
            });
        });
    }

    runQuickTest() {
        // إنشاء بيانات اختبار واقعية
        const testData = {
            currentPrice: 29.24800,
            priceHistory: this.generateTestPriceHistory(29.24800),
            indicators: {
                rsi: 65.5,
                macd: 0.0012,
                bb: {
                    upper: 29.25000,
                    middle: 29.24800,
                    lower: 29.24600,
                    position: 'middle'
                },
                trend: 'صاعد'
            },
            recommendation: {
                action: 'CALL',
                confidence: 75,
                expiry: '3 دقائق',
                reason: 'RSI في منطقة متوسطة، MACD إيجابي'
            },
            signals: [
                {type: 'CALL', strength: 'متوسط', reason: 'MACD إيجابي', confidence: 60},
                {type: 'CALL', strength: 'قوي', reason: 'الاتجاه صاعد', confidence: 70}
            ],
            timestamp: Date.now()
        };

        // تحديث واجهة المستخدم
        this.updateUI(testData);

        // إظهار رسالة نجاح
        this.showNotification('✅ تم تشغيل الاختبار بنجاح!', 'success');

        // تحديث حالة الاتصال
        this.updateConnectionStatus(true);
        document.getElementById('status').textContent = '🧪 وضع الاختبار - بيانات وهمية';
    }

    generateTestPriceHistory(basePrice) {
        const history = [];
        for (let i = 20; i >= 0; i--) {
            const variation = (Math.random() - 0.5) * 0.001; // تغيير صغير
            history.push({
                price: basePrice + variation,
                timestamp: Date.now() - (i * 1000)
            });
        }
        return history;
    }

    toggleAnalyzer() {
        this.settings.autoAnalysis = !this.settings.autoAnalysis;
        this.saveSettings();
        
        const button = document.getElementById('toggleAnalyzer');
        button.textContent = this.settings.autoAnalysis ? 'إيقاف المحلل' : 'تفعيل المحلل';
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { 
                action: 'toggleAnalyzer', 
                enabled: this.settings.autoAnalysis 
            });
        });
    }

    openSettings() {
        // إنشاء نافذة إعدادات بسيطة
        const settingsOverlay = document.createElement('div');
        settingsOverlay.id = 'settingsOverlay';
        settingsOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 1000; display: flex;
            align-items: center; justify-content: center;
        `;

        const settingsDialog = document.createElement('div');
        settingsDialog.style.cssText = `
            background: #1e3c72; padding: 20px; border-radius: 10px;
            width: 300px; color: white;
        `;

        settingsDialog.innerHTML = `
            <h3>⚙️ الإعدادات</h3>
            <label style="display: block; margin: 10px 0;">
                <input type="checkbox" id="autoAnalysisCheck" ${this.settings.autoAnalysis ? 'checked' : ''}>
                التحليل التلقائي
            </label>
            <label style="display: block; margin: 10px 0;">
                <input type="checkbox" id="notificationsCheck" ${this.settings.notifications ? 'checked' : ''}>
                الإشعارات
            </label>
            <label style="display: block; margin: 10px 0;">
                مستوى المخاطرة:
                <select id="riskLevelSelect" style="margin-right: 10px; padding: 5px;">
                    <option value="low" ${this.settings.riskLevel === 'low' ? 'selected' : ''}>منخفض</option>
                    <option value="medium" ${this.settings.riskLevel === 'medium' ? 'selected' : ''}>متوسط</option>
                    <option value="high" ${this.settings.riskLevel === 'high' ? 'selected' : ''}>عالي</option>
                </select>
            </label>
            <div style="margin-top: 20px;">
                <button id="saveSettingsBtn"
                        style="background: #4CAF50; color: white; border: none;
                               padding: 8px 15px; border-radius: 5px; margin-left: 10px;">
                    حفظ
                </button>
                <button id="cancelSettingsBtn"
                        style="background: #f44336; color: white; border: none;
                               padding: 8px 15px; border-radius: 5px;">
                    إلغاء
                </button>
            </div>
        `;

        settingsOverlay.appendChild(settingsDialog);
        document.body.appendChild(settingsOverlay);

        // إضافة مستمعي الأحداث
        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettingsFromDialog();
            settingsOverlay.remove();
        });

        document.getElementById('cancelSettingsBtn').addEventListener('click', () => {
            settingsOverlay.remove();
        });

        // إغلاق عند النقر خارج النافذة
        settingsOverlay.addEventListener('click', (e) => {
            if (e.target === settingsOverlay) {
                settingsOverlay.remove();
            }
        });
    }

    saveSettingsFromDialog() {
        const autoAnalysis = document.getElementById('autoAnalysisCheck').checked;
        const notifications = document.getElementById('notificationsCheck').checked;
        const riskLevel = document.getElementById('riskLevelSelect').value;

        this.settings = {
            ...this.settings,
            autoAnalysis,
            notifications,
            riskLevel
        };

        this.saveSettings();
        this.showNotification('تم حفظ الإعدادات', 'success');
    }

    showAnalysisPanel() {
        if (!this.isConnected) {
            this.showNotification('يرجى الاتصال بـ PocketOption أولاً', 'error');
            return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'showPanel' }, (response) => {
                if (response && response.success) {
                    this.showNotification('تم إظهار لوحة التحليل', 'success');
                } else {
                    this.showNotification('خطأ في إظهار لوحة التحليل', 'error');
                }
            });
        });
    }

    hideAnalysisPanel() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'hidePanel' }, (response) => {
                if (response && response.success) {
                    this.showNotification('تم إخفاء لوحة التحليل', 'success');
                } else {
                    this.showNotification('خطأ في إخفاء لوحة التحليل', 'error');
                }
            });
        });
    }

    runDiagnostics() {
        if (!this.isConnected) {
            this.showNotification('يرجى الاتصال بـ PocketOption أولاً', 'error');
            return;
        }

        this.showNotification('جاري تشغيل التشخيص...', 'info');

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            // تشغيل التشخيص في content script
            chrome.tabs.sendMessage(tabs[0].id, { action: 'runDiagnostics' }, (response) => {
                if (response) {
                    this.showDiagnosticResults(response);
                } else {
                    this.showNotification('فشل في تشغيل التشخيص', 'error');
                }
            });

            // تشغيل تشخيص إضافي في popup
            this.runPopupDiagnostics(tabs[0]);
        });
    }

    runPopupDiagnostics(tab) {
        console.log('🔧 تشخيص Popup...');
        console.log('📄 Tab URL:', tab.url);
        console.log('📄 Tab Title:', tab.title);
        console.log('🔗 هل هذه صفحة PocketOption؟', tab.url.includes('pocketoption'));

        // فحص حالة الإضافة
        console.log('⚙️ حالة الإضافة:');
        console.log('- متصل:', this.isConnected);
        console.log('- البيانات الحالية:', this.currentData);
        console.log('- الإعدادات:', this.settings);
    }

    showDiagnosticResults(results) {
        // إنشاء نافذة نتائج التشخيص
        const diagnosticOverlay = document.createElement('div');
        diagnosticOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 1000; display: flex;
            align-items: center; justify-content: center; direction: rtl;
        `;

        const diagnosticDialog = document.createElement('div');
        diagnosticDialog.style.cssText = `
            background: #1e3c72; padding: 20px; border-radius: 10px;
            width: 90%; max-width: 500px; color: white; max-height: 80vh;
            overflow-y: auto; border: 2px solid #FFD700;
        `;

        diagnosticDialog.innerHTML = `
            <h3>🔧 نتائج التشخيص</h3>
            <div style="font-size: 12px; line-height: 1.5;">
                <p><strong>📊 حالة البيانات:</strong></p>
                <p>- السعر الحالي: ${results.currentPrice || 'غير متوفر'}</p>
                <p>- عدد نقاط التاريخ: ${results.priceHistoryLength || 0}</p>
                <p>- آخر تحديث: ${results.lastUpdate || 'غير متوفر'}</p>

                <p><strong>🌐 معلومات الصفحة:</strong></p>
                <p>- URL: ${results.url || 'غير متوفر'}</p>
                <p>- العنوان: ${results.title || 'غير متوفر'}</p>

                <p><strong>🔍 البحث عن البيانات:</strong></p>
                <p>- عناصر Canvas: ${results.canvasCount || 0}</p>
                <p>- عناصر SVG: ${results.svgCount || 0}</p>
                <p>- أرقام عشرية موجودة: ${results.numbersFound || 0}</p>

                <p><strong>💡 التوصيات:</strong></p>
                <ul style="margin: 10px 0; padding-right: 20px;">
                    <li>تأكد من فتح صفحة التداول في PocketOption</li>
                    <li>انتظر تحميل الرسم البياني بالكامل</li>
                    <li>جرب إعادة تحميل الصفحة</li>
                    <li>تحقق من Console (F12) للمزيد من التفاصيل</li>
                </ul>
            </div>
            <button id="closeDiagnostic" style="background: #4CAF50; color: white; border: none;
                   padding: 10px 20px; border-radius: 5px; margin-top: 15px; cursor: pointer;">
                إغلاق
            </button>
        `;

        diagnosticOverlay.appendChild(diagnosticDialog);
        document.body.appendChild(diagnosticOverlay);

        // إضافة مستمع الإغلاق
        document.getElementById('closeDiagnostic').addEventListener('click', () => {
            diagnosticOverlay.remove();
        });

        // إغلاق عند النقر خارج النافذة
        diagnosticOverlay.addEventListener('click', (e) => {
            if (e.target === diagnosticOverlay) {
                diagnosticOverlay.remove();
            }
        });

        this.showNotification('تم إكمال التشخيص', 'success');
    }

    updateUI(data) {
        this.currentData = data;

        // تحديث الإشارة الحالية
        if (data.recommendation) {
            const signalDirection = document.getElementById('signalDirection');
            const signalStrength = document.getElementById('signalStrength');
            const signalExpiry = document.getElementById('signalExpiry');
            const confidenceFill = document.getElementById('confidenceFill');
            const recommendationBox = document.getElementById('recommendationBox');

            if (signalDirection) signalDirection.textContent = this.translateAction(data.recommendation.action);
            if (signalStrength) signalStrength.textContent = data.recommendation.confidence.toFixed(0) + '%';
            if (signalExpiry) signalExpiry.textContent = data.recommendation.expiry;
            if (confidenceFill) confidenceFill.style.width = data.recommendation.confidence + '%';

            // تحديث لون التوصية
            if (recommendationBox) {
                recommendationBox.className = 'recommendation-box';
                if (data.recommendation.action === 'CALL') {
                    recommendationBox.classList.add('recommendation-call');
                } else if (data.recommendation.action === 'PUT') {
                    recommendationBox.classList.add('recommendation-put');
                }
            }
        }
        
        // تحديث المؤشرات الفنية
        if (data.indicators) {
            const rsiElement = document.getElementById('rsiValue');
            const macdElement = document.getElementById('macdValue');
            const bbElement = document.getElementById('bbValue');
            const trendElement = document.getElementById('trendValue');
            const stochElement = document.getElementById("stochValue");
            const emaCrossElement = document.getElementById("emaCrossValue");
            const trendShortElement = document.getElementById("trendShortValue");
            const trendMediumElement = document.getElementById("trendMediumValue");
            const trendLongElement = document.getElementById("trendLongValue");
            const atrElement = document.getElementById("atrValue");
            const adxElement = document.getElementById("adxValue");
            const superTrendElement = document.getElementById("superTrendValue");

            if (rsiElement) rsiElement.textContent =
                data.indicators.rsi ? data.indicators.rsi.toFixed(2) : '--';
            if (macdElement) macdElement.textContent =
                data.indicators.macd ? data.indicators.macd.toFixed(4) : '--';
            if (bbElement) bbElement.textContent =
                data.indicators.bb ? data.indicators.bb.position : '--';
            if (trendElement) trendElement.textContent = data.indicators.trend || "--";
            if (stochElement) stochElement.textContent = data.indicators.stoch ? data.indicators.stoch.k.toFixed(1) + "/" + data.indicators.stoch.d.toFixed(1) : "--";
            if (emaCrossElement) emaCrossElement.textContent = data.indicators.emaCross && data.indicators.emaCross.signal ? data.indicators.emaCross.signal : "--";
            if (trendShortElement) trendShortElement.textContent = data.indicators.trendShort || "--";
            if (trendMediumElement) trendMediumElement.textContent = data.indicators.trendMedium || "--";
            if (trendLongElement) trendLongElement.textContent = data.indicators.trendLong || "--";
            if (atrElement) atrElement.textContent = data.indicators.atr ? data.indicators.atr.toFixed(5) : "--";
            if (adxElement) adxElement.textContent = data.indicators.adx ? data.indicators.adx.toFixed(1) : "--";
            if (superTrendElement) superTrendElement.textContent = data.indicators.supertrend ? data.indicators.supertrend.direction : "--";
        }
        
        // تحديث معلومات السعر
        if (data.currentPrice) {
            const currentPriceElement = document.getElementById('currentPrice');
            if (currentPriceElement) {
                currentPriceElement.textContent = data.currentPrice.toFixed(5);
            }

            // حساب التغيير
            if (data.priceHistory && data.priceHistory.length > 1) {
                const previousPrice = data.priceHistory[data.priceHistory.length - 2].price;
                const change = ((data.currentPrice - previousPrice) / previousPrice * 100);
                const changeElement = document.getElementById('priceChange');
                if (changeElement) {
                    changeElement.textContent = (change >= 0 ? '+' : '') + change.toFixed(3) + '%';
                    changeElement.style.color = change >= 0 ? '#4CAF50' : '#F44336';
                }
            }

            // حساب التقلبات
            const volatility = this.calculateVolatility(data.priceHistory);
            const volatilityElement = document.getElementById('volatility');
            if (volatilityElement) {
                volatilityElement.textContent = volatility.toFixed(3);
            }
        }
        
        // تحديث آخر تحديث
        const lastUpdateElement = document.getElementById('lastUpdate');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = new Date().toLocaleTimeString('ar-SA');
        }
    }

    translateAction(action) {
        switch (action) {
            case 'CALL': return '📈 شراء (CALL)';
            case 'PUT': return '📉 بيع (PUT)';
            case 'انتظار': return '⏳ انتظار';
            default: return action;
        }
    }

    calculateVolatility(priceHistory) {
        if (!priceHistory || priceHistory.length < 10) return 0;
        
        const prices = priceHistory.slice(-10).map(p => p.price);
        const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
        
        return Math.sqrt(variance) / mean;
    }

    startDataUpdates() {
        // تحديث البيانات كل 5 ثوان
        setInterval(() => {
            if (this.isConnected) {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0] && tabs[0].url.includes('pocketoption.com')) {
                        chrome.tabs.sendMessage(tabs[0].id, { action: 'getData' }, (response) => {
                            if (response) {
                                this.updateUI(response);
                            }
                        });
                    }
                });
            }
        }, 5000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 1001;
            font-size: 12px;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// تشغيل واجهة التحكم عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});

// استقبال الرسائل من content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updatePopup') {
        // تحديث واجهة المستخدم بالبيانات الجديدة
        const controller = window.popupController;
        if (controller) {
            controller.updateUI(request.data);
        }
    }
});
