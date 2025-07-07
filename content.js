// PocketOption Trading Assistant - Content Script
// محلل تقني متقدم لمنصة PocketOption

class PocketOptionAnalyzer {
    constructor() {
        this.isActive = false;
        this.currentPrice = 0;
        this.priceHistory = [];
        this.indicators = {};
        this.signals = [];
        this.analysisPanel = null;
        this.updateInterval = null;
        
        this.init();
    }

    init() {
        console.log('🚀 PocketOption Trading Assistant تم تحميله');

        // حقن السكريبت المساعد
        this.injectDataExtractor();

        // انتظار تحميل الصفحة بالكامل
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }

    injectDataExtractor() {
        try {
            // حقن السكريبت للوصول المباشر لبيانات الصفحة
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('injected.js');
            script.onload = function() {
                this.remove();
            };
            (document.head || document.documentElement).appendChild(script);

            // استقبال البيانات من السكريبت المحقون
            window.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'PO_PRICE_UPDATE') {
                    this.handleInjectedData(event.data.data);
                } else if (event.data && event.data.type === 'PO_DATA_RESPONSE') {
                    this.handleInjectedData(event.data.data);
                }
            });
        } catch (error) {
            console.log('خطأ في حقن السكريبت:', error);
        }
    }

    handleInjectedData(data) {
        console.log('📨 تم استلام بيانات من injected script:', data);

        if (data.currentPrice && data.currentPrice !== this.currentPrice) {
            console.log(`💰 سعر جديد من injected script: ${data.currentPrice}`);
            this.currentPrice = data.currentPrice;

            // دمج البيانات من المصدر المحقون
            if (data.priceHistory && data.priceHistory.length > 0) {
                this.priceHistory = data.priceHistory;
                console.log(`📊 تم تحديث تاريخ الأسعار: ${data.priceHistory.length} نقطة`);
            } else if (data.priceData && data.priceData.length > 0) {
                this.priceHistory = data.priceData;
                console.log(`📊 تم تحديث بيانات الأسعار: ${data.priceData.length} نقطة`);
            }

            // تحديث التحليل
            this.performAnalysis();
            this.updateUI();
        } else if (data.priceData && data.priceData.length > 0) {
            // حتى لو لم يتغير السعر الحالي، نحدث التاريخ
            this.priceHistory = data.priceData;
            if (data.priceData.length > 0) {
                this.currentPrice = data.priceData[data.priceData.length - 1].price;
                console.log(`📊 تم تحديث البيانات من injected script: ${this.currentPrice}`);
                this.performAnalysis();
                this.updateUI();
            }
        }
    }

    start() {
        // بدء مراقبة البيانات فقط (بدون إنشاء لوحة تلقائية)
        this.startDataMonitoring();

        // إضافة مستمعي الأحداث
        this.addEventListeners();

        this.isActive = true;
        console.log('✅ محلل PocketOption جاهز للعمل (في الخلفية)');

        // إشعار المستخدم أن المحلل جاهز
        this.showNotification('محلل PocketOption جاهز! اضغط على أيقونة الإضافة للوصول للتحليل');
    }

    showNotification(message) {
        // إنشاء إشعار بسيط في الزاوية
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            max-width: 300px;
            direction: rtl;
            border: 2px solid #FFD700;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        // إزالة الإشعار بعد 5 ثوان
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    createAnalysisPanel() {
        // إنشاء لوحة التحليل الجانبية
        this.analysisPanel = document.createElement('div');
        this.analysisPanel.id = 'po-analysis-panel';
        this.analysisPanel.innerHTML = `
            <div class="po-panel-header">
                <h3>🎯 محلل التداول</h3>
                <button id="po-toggle-btn">تصغير</button>
            </div>
            <div class="po-panel-content">
                <div class="po-signal-section">
                    <h4>📊 الإشارة الحالية</h4>
                    <div id="po-current-signal" class="po-signal-box">
                        <div class="po-signal-direction">تحليل...</div>
                        <div class="po-signal-strength">القوة: --</div>
                        <div class="po-signal-expiry">المدة المقترحة: --</div>
                    </div>
                </div>
                
                <div class="po-indicators-section">
                    <h4>📈 المؤشرات الفنية</h4>
                    <div id="po-indicators">
                        <div class="po-indicator">
                            <span>RSI:</span>
                            <span id="po-rsi">--</span>
                        </div>
                        <div class="po-indicator">
                            <span>MACD:</span>
                            <span id="po-macd">--</span>
                        </div>
                        <div class="po-indicator">
                            <span>BB:</span>
                            <span id="po-bb">--</span>
                        </div>
                        <div class="po-indicator">
                            <span>الاتجاه:</span>
                            <span id="po-trend">--</span>
                        </div>
                        <div class="po-indicator">
                            <span>Stoch %K/%D:</span>
                            <span id="po-stoch">--</span>
                        </div>
                        <div class="po-indicator">
                            <span>تقاطع EMA:</span>
                            <span id="po-ema-cross">--</span>
                        </div>
                        <div class="po-indicator">
                            <span>الاتجاه قصير:</span>
                            <span id="po-trend-short">--</span>
                        </div>
                        <div class="po-indicator">
                            <span>الاتجاه متوسط:</span>
                            <span id="po-trend-medium">--</span>
                        </div>
                        <div class="po-indicator">
                            <span>الاتجاه طويل:</span>
                            <span id="po-trend-long">--</span>
                        </div>
                        <div class="po-indicator">
                            <span>ATR:</span>
                            <span id="po-atr">--</span>
                        </div>
                        <div class="po-indicator">
                            <span>ADX:</span>
                            <span id="po-adx">--</span>
                        </div>
                        <div class="po-indicator">
                            <span>SuperTrend:</span>
                            <span id="po-supertrend">--</span>
                        </div>
                    </div>
                </div>
                
                <div class="po-price-section">
                    <h4>💰 معلومات السعر</h4>
                    <div id="po-price-info">
                        <div>السعر الحالي: <span id="po-current-price">--</span></div>
                        <div>التغيير: <span id="po-price-change">--</span></div>
                        <div>التقلبات: <span id="po-volatility">--</span></div>
                    </div>
                </div>
                
                <div class="po-recommendation-section">
                    <h4>🎯 التوصية</h4>
                    <div id="po-recommendation" class="po-recommendation-box">
                        <div class="po-action">الإجراء: <span id="po-action">انتظار</span></div>
                        <div class="po-confidence">الثقة: <span id="po-confidence">--</span></div>
                        <div class="po-entry-price">سعر الدخول: <span id="po-entry-price">--</span></div>
                        <div class="po-expiry-time">مدة الصفقة: <span id="po-expiry-time">--</span></div>
                    </div>
                </div>
                
                <div class="po-controls-section">
                    <button id="po-analyze-btn" class="po-btn po-btn-primary">تحليل فوري</button>
                    <button id="po-auto-trade-btn" class="po-btn po-btn-secondary">تفعيل التحليل التلقائي</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.analysisPanel);
    }

    startDataMonitoring() {
        // مراقبة تغييرات السعر كل ثانية
        this.updateInterval = setInterval(() => {
            this.collectMarketData();
            this.performAnalysis();
            this.updateUI();
        }, 1000);

        // مراقبة تغييرات DOM للأسعار الديناميكية
        this.setupDOMObserver();
    }

    collectMarketData() {
        try {
            console.log('🔍 البحث المحسن عن بيانات السعر...');

            // 1. محاولة الحصول على البيانات من injected script أولاً
            window.postMessage({ type: 'PO_GET_DATA' }, '*');

            // 2. البحث المباشر في الصفحة - نسخة محسنة
            let price = this.findPriceInPage();

            // 3. البحث في عناصر الرسم البياني
            if (!price) {
                price = this.findPriceInChart();
            }

            // 4. البحث في WebSocket أو Network requests
            if (!price) {
                price = this.findPriceInNetwork();
            }

            // 5. البحث العام في جميع النصوص
            if (!price) {
                price = this.findPriceInAllText();
            }

            // تحديث البيانات إذا وُجد سعر جديد
            if (price && this.isValidPrice(price)) {
                this.updatePriceData(price);
            } else {
                console.warn('⚠️ لم يتم العثور على سعر صالح');
                this.runAdvancedDiagnostics();
            }

        } catch (error) {
            console.error('خطأ في جمع بيانات السوق:', error);
        }
    }

    findPriceInPage() {
        console.log('🔍 البحث المباشر في الصفحة...');

        // محددات محسنة خاصة بـ PocketOption
        const priceSelectors = [
            // محددات عامة للأسعار
            '[class*="price"]', '[class*="rate"]', '[class*="quote"]', '[class*="value"]',
            '[class*="current"]', '[class*="last"]', '[class*="bid"]', '[class*="ask"]',
            '[id*="price"]', '[id*="rate"]', '[id*="quote"]', '[id*="current"]',

            // محددات خاصة بـ PocketOption
            '[class*="asset"]', '[class*="symbol"]', '[class*="ticker"]',
            '[class*="chart"]', '[class*="trading"]', '[class*="market"]',
            '[class*="instrument"]', '[class*="currency"]',

            // محددات CSS شائعة
            '.price', '.rate', '.quote', '.current-price', '.market-price',
            '.asset-price', '.trading-price', '.chart-price', '.live-price',

            // محددات بناءً على البنية والتصميم
            'span[style*="font-weight"]', 'div[style*="font-size"]',
            'span[style*="color"]', 'div[style*="color"]',
            'span[style*="font-family"]', 'div[style*="font-family"]',

            // محددات إضافية للبحث الشامل
            'span', 'div', 'td', 'th', 'p', 'label'
        ];

        // البحث في المحددات المحددة أولاً
        for (const selector of priceSelectors.slice(0, -1)) { // كل المحددات عدا الأخير
            try {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    const price = this.extractPriceFromElement(element);
                    if (price) {
                        console.log(`💰 سعر من محدد ${selector}: ${price}`);
                        return price;
                    }
                }
            } catch (e) {
                // تجاهل أخطاء المحددات غير الصالحة
            }
        }

        // البحث الشامل في جميع العناصر النصية (كحل أخير)
        console.log('🔍 البحث الشامل في جميع العناصر النصية...');
        const allTextElements = document.querySelectorAll('span, div, td, th, p, label');
        for (const element of allTextElements) {
            const text = element.textContent?.trim();
            if (text && /^\d+\.\d{4,6}$/.test(text)) { // أرقام بـ 4-6 خانات عشرية
                const price = parseFloat(text);
                if (this.isValidPrice(price)) {
                    console.log(`💰 سعر من البحث الشامل: ${price}`);
                    return price;
                }
            }
        }

        return null;
    }

    findPriceInChart() {
        console.log('📊 البحث في عناصر الرسم البياني...');

        // البحث في عناصر Canvas
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach((canvas, index) => {
            console.log(`🎨 Canvas ${index}: ${canvas.width}x${canvas.height}`);
        });

        // البحث في عناصر SVG
        const svgs = document.querySelectorAll('svg');
        for (let i = 0; i < svgs.length; i++) {
            const svg = svgs[i];
            const texts = svg.querySelectorAll('text');
            for (let j = 0; j < texts.length; j++) {
                const text = texts[j];
                const price = this.extractPriceFromElement(text);
                if (price) {
                    console.log(`💰 سعر من SVG: ${price}`);
                    return price;
                }
            }
        }

        return null;
    }

    findPriceInNetwork() {
        console.log('🌐 البحث في طلبات الشبكة...');
        // هذا سيتم التعامل معه في injected script
        return null;
    }

    findPriceInAllText() {
        console.log('📝 البحث العام في جميع النصوص...');

        // الحصول على جميع النصوص المرئية
        const allText = document.body.innerText || document.body.textContent || '';

        // أنماط أسعار محسنة
        const pricePatterns = [
            /\b1\.\d{5}\b/g,           // EUR/USD (1.12345)
            /\b1\.\d{4}\b/g,           // EUR/USD (1.1234)
            /\b0\.\d{5}\b/g,           // GBP/USD (0.12345)
            /\b0\.\d{4}\b/g,           // GBP/USD (0.1234)
            /\b\d{1,3}\.\d{3,5}\b/g,   // عام (123.12345)
            /\b\d+\.\d{2,6}\b/g,       // أي رقم عشري
        ];

        for (const pattern of pricePatterns) {
            const matches = allText.match(pattern);
            if (matches) {
                // أخذ أحدث الأرقام
                const prices = matches
                    .map(m => parseFloat(m))
                    .filter(p => this.isValidPrice(p))
                    .slice(-5); // آخر 5 أرقام

                if (prices.length > 0) {
                    const price = prices[prices.length - 1];
                    console.log(`💰 سعر من النص العام: ${price}`);
                    return price;
                }
            }
        }

        return null;
    }

    extractPriceFromElement(element) {
        if (!element) return null;

        const text = element.textContent || element.innerText || '';
        if (!text.trim()) return null;

        // البحث عن أرقام في النص
        const priceRegex = /\d+\.\d{2,6}/g;
        const matches = text.match(priceRegex);

        if (matches) {
            for (const match of matches) {
                const price = parseFloat(match);
                if (this.isValidPrice(price)) {
                    return price;
                }
            }
        }

        return null;
    }

    isValidPrice(price) {
        if (!price || isNaN(price)) return false;

        // نطاق واسع للأسعار المحتملة
        return price > 0.0001 && price < 1000000;
    }

    updatePriceData(price) {
        // تحقق من أن السعر مختلف بما فيه الكفاية
        if (Math.abs(price - this.currentPrice) > 0.00001) {
            this.priceHistory.push({
                price: price,
                timestamp: Date.now()
            });

            // الاحتفاظ بآخر 100 نقطة
            if (this.priceHistory.length > 100) {
                this.priceHistory.shift();
            }

            this.currentPrice = price;
            console.log(`📊 تم تحديث السعر: ${price}, عدد النقاط: ${this.priceHistory.length}`);
        }
    }

    runAdvancedDiagnostics() {
        console.log('🔧 تشخيص متقدم للبحث عن الأسعار...');

        // طباعة معلومات الصفحة
        console.log('🌐 URL:', window.location.href);
        console.log('📄 Title:', document.title);

        // البحث عن جميع الأرقام في الصفحة
        const allNumbers = (document.body.innerText || '').match(/\d+\.\d+/g);
        if (allNumbers) {
            console.log('🔢 جميع الأرقام العشرية:', allNumbers.slice(0, 30));

            // تصنيف الأرقام حسب عدد الخانات العشرية
            const priceNumbers = allNumbers.filter(num => {
                const decimal = num.split('.')[1];
                return decimal && decimal.length >= 4; // أسعار عادة لها 4+ خانات عشرية
            });
            console.log('💰 أرقام محتملة للأسعار (4+ خانات):', priceNumbers.slice(0, 15));
        }

        // البحث عن عناصر تحتوي على أرقام مع تفاصيل أكثر
        const suspiciousElements = document.querySelectorAll('span, div, td, th, p, label');
        const numbersFound = [];
        const priceElements = [];

        suspiciousElements.forEach(el => {
            const text = el.textContent?.trim();
            if (text && /^\d+\.\d+$/.test(text)) {
                const info = {
                    text: text,
                    element: el.tagName,
                    class: el.className || 'بدون class',
                    id: el.id || 'بدون id',
                    parent: el.parentElement?.tagName || 'بدون parent',
                    parentClass: el.parentElement?.className || 'بدون parent class'
                };

                numbersFound.push(info);

                // إذا كان الرقم يبدو كسعر (4+ خانات عشرية)
                const decimal = text.split('.')[1];
                if (decimal && decimal.length >= 4) {
                    priceElements.push(info);
                }
            }
        });

        console.log('🎯 عناصر تحتوي على أرقام:', numbersFound.slice(0, 15));
        console.log('💰 عناصر محتملة للأسعار:', priceElements.slice(0, 10));

        // البحث في عناصر Canvas و SVG
        const canvases = document.querySelectorAll('canvas');
        const svgs = document.querySelectorAll('svg');
        console.log(`🎨 عدد عناصر Canvas: ${canvases.length}`);
        console.log(`📊 عدد عناصر SVG: ${svgs.length}`);

        // البحث في عناصر مخفية أو ديناميكية
        const hiddenElements = document.querySelectorAll('[style*="display: none"], [hidden]');
        console.log(`👻 عدد العناصر المخفية: ${hiddenElements.length}`);
    }

    setupDOMObserver() {
        console.log('👁️ إعداد مراقب DOM للأسعار الديناميكية...');

        // إنشاء مراقب للتغييرات في DOM
        this.domObserver = new MutationObserver((mutations) => {
            let foundPrice = false;

            mutations.forEach((mutation) => {
                // مراقبة التغييرات في النصوص
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
                            const price = this.extractPriceFromNode(node);
                            if (price) {
                                console.log(`💰 سعر جديد من DOM Observer: ${price}`);
                                this.updatePriceData(price);
                                foundPrice = true;
                            }
                        }
                    });
                }

                // مراقبة تغييرات الخصائص (مثل textContent)
                if (mutation.type === 'characterData') {
                    const price = this.extractPriceFromNode(mutation.target);
                    if (price) {
                        console.log(`💰 سعر محدث من DOM Observer: ${price}`);
                        this.updatePriceData(price);
                        foundPrice = true;
                    }
                }
            });

            // إذا وُجد سعر جديد، قم بالتحليل
            if (foundPrice) {
                this.performAnalysis();
                this.updateUI();
            }
        });

        // بدء مراقبة التغييرات
        this.domObserver.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            characterDataOldValue: true
        });
    }

    extractPriceFromNode(node) {
        if (!node) return null;

        let text = '';
        if (node.nodeType === Node.TEXT_NODE) {
            text = node.textContent || '';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            text = node.textContent || node.innerText || '';
        }

        text = text.trim();

        // البحث عن أرقام تبدو كأسعار
        const priceRegex = /\b\d+\.\d{4,6}\b/g;
        const matches = text.match(priceRegex);

        if (matches) {
            for (const match of matches) {
                const price = parseFloat(match);
                if (this.isValidPrice(price)) {
                    return price;
                }
            }
        }

        return null;
    }

    performAnalysis() {
        // التحليل فقط إذا كان لدينا بيانات حقيقية
        if (this.priceHistory.length < 2) {
            console.log('⏳ انتظار المزيد من البيانات الحقيقية للتحليل...');
            return;
        }

        console.log(`🔍 بدء التحليل الحقيقي مع ${this.priceHistory.length} نقطة بيانات`);

        // حساب المؤشرات الفنية
        this.calculateRSI();
        this.calculateMACD();
        this.calculateBollingerBands();
        this.calculateTrend();
        this.calculateMultiTimeframeTrends();
        this.calculateStochastic();
        this.calculateEMACross();
        this.calculateATR();
        this.calculateADX();
        this.calculateSuperTrend();
        this.calculateMomentum();

        // تحليل الإشارات
        this.analyzeSignals();

        // إنتاج التوصية
        this.generateRecommendation();

        console.log('✅ تم إكمال التحليل الحقيقي:', {
            dataPoints: this.priceHistory.length,
            currentPrice: this.currentPrice,
            rsi: this.indicators.rsi?.toFixed(2),
            macd: this.indicators.macd?.toFixed(4),
            bb: this.indicators.bb?.position,
            trend: this.indicators.trend,
            recommendation: this.recommendation?.action,
            confidence: this.recommendation?.confidence?.toFixed(0) + '%'
        });
    }

    calculateRSI(period = 14) {
        // RSI قياسي باستخدام متوسط المكاسب والخسائر
        if (this.priceHistory.length < period + 1) {
            this.indicators.rsi = null;
            return;
        }

        const prices = this.priceHistory.map(p => p.price);
        let gains = 0, losses = 0;
        for (let i = prices.length - period; i < prices.length; i++) {
            const diff = prices[i] - prices[i - 1];
            if (diff > 0) gains += diff;
            else losses -= diff;
        }

        const avgGain = gains / period;
        const avgLoss = losses / period;
        if (avgLoss === 0) {
            this.indicators.rsi = 100;
            return;
        }
        const rs = avgGain / avgLoss;
        const rsi = 100 - 100 / (1 + rs);

        this.indicators.rsi = rsi;
        console.log(`📊 RSI محسوب بدقة: ${rsi.toFixed(2)}`);
    }

    // تم حذف دالة generateDummyData - نستخدم فقط البيانات الحقيقية

    calculateMACD() {
        // MACD التقليدي (12,26,9)
        const prices = this.priceHistory.map(p => p.price);
        if (prices.length < 35) { // 26 + 9 تقريبًا
            this.indicators.macd = null;
            return;
        }

        const ema12 = this.calculateEMA(prices, 12);
        const ema26 = this.calculateEMA(prices, 26);
        const macdLine = ema12 - ema26;

        // حساب خط الإشارة بطريقة مبسطة
        const macdSeries = [];
        let emaShort = prices[0], emaLong = prices[0];
        const kShort = 2 / (12 + 1), kLong = 2 / (26 + 1);
        for (let i = 1; i < prices.length; i++) {
            emaShort = prices[i] * kShort + emaShort * (1 - kShort);
            emaLong = prices[i] * kLong + emaLong * (1 - kLong);
            macdSeries.push(emaShort - emaLong);
        }
        const signal = this.calculateEMA(macdSeries, 9);
        this.indicators.macd = macdLine - signal;
        console.log(`📊 MACD محسوب بدقة: ${this.indicators.macd.toFixed(4)}`);
    }

    calculateEMA(prices, period) {
        if (prices.length < period) return null;

        // البداية بمتوسط بسيط للفترة الأولى
        let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
        const k = 2 / (period + 1);
        for (let i = period; i < prices.length; i++) {
            ema = prices[i] * k + ema * (1 - k);
        }
        return ema;
    }

    calculateBollingerBands(period = 20) {
        // نحتاج على الأقل 3 نقاط لحساب Bollinger Bands
        if (this.priceHistory.length < 3) {
            this.indicators.bb = null;
            return;
        }

        const availableData = Math.min(this.priceHistory.length, period);
        const prices = this.priceHistory.slice(-availableData).map(p => p.price);
        const sma = prices.reduce((sum, price) => sum + price, 0) / availableData;

        const variance = prices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / availableData;
        const stdDev = Math.sqrt(variance);

        const upper = sma + (2 * stdDev);
        const lower = sma - (2 * stdDev);

        let position;
        if (this.currentPrice > upper) position = 'upper';
        else if (this.currentPrice < lower) position = 'lower';
        else position = 'middle';

        this.indicators.bb = {
            upper: upper,
            middle: sma,
            lower: lower,
            position: position
        };

        console.log(`📊 Bollinger Bands محسوب: ${position} (Upper: ${upper.toFixed(5)}, Middle: ${sma.toFixed(5)}, Lower: ${lower.toFixed(5)})`);
    }

    calculateTrend() {
        // نحتاج على الأقل نقطتين لحساب الاتجاه
        if (this.priceHistory.length < 2) {
            this.indicators.trend = 'غير محدد';
            return;
        }

        const availableData = Math.min(this.priceHistory.length, 10);
        const recentPrices = this.priceHistory.slice(-availableData).map(p => p.price);
        const firstPrice = recentPrices[0];
        const lastPrice = recentPrices[recentPrices.length - 1];

        const change = ((lastPrice - firstPrice) / firstPrice) * 100;

        let trend;
        if (change > 0.01) trend = 'صاعد';      // 0.01% صعود
        else if (change < -0.01) trend = 'هابط'; // 0.01% هبوط
        else trend = 'جانبي';

        this.indicators.trend = trend;
        console.log(`📊 الاتجاه محسوب: ${trend} (تغيير: ${change.toFixed(3)}% من ${availableData} نقاط)`);
    }
    calculateMultiTimeframeTrends() {
        this.indicators.trendShort = this.computeTrendForPeriod(60);
        this.indicators.trendMedium = this.computeTrendForPeriod(300);
        this.indicators.trendLong = this.computeTrendForPeriod(900);
    }

    computeTrendForPeriod(seconds) {
        const fromTime = Date.now() - seconds * 1000;
        const subset = this.priceHistory.filter(p => p.timestamp >= fromTime);
        if (subset.length < 2) return "غير محدد";
        const first = subset[0].price;
        const last = subset[subset.length - 1].price;
        const change = ((last - first) / first) * 100;
        if (change > 0.01) return "صاعد";
        else if (change < -0.01) return "هابط";
        return "جانبي";
    }

    calculateStochastic(period = 14) {
        if (this.priceHistory.length < period) { this.indicators.stoch = null; return; }
        const recent = this.priceHistory.slice(-period).map(p=>p.price);
        const high = Math.max(...recent);
        const low = Math.min(...recent);
        const close = this.currentPrice;
        if (high === low) { this.indicators.stoch = {k:50,d:50}; return; }
        const k = ((close - low) / (high - low)) * 100;
        const hist = this.indicators.stochHistory || [];
        hist.push(k); if (hist.length > 3) hist.shift();
        const d = hist.reduce((a,b)=>a+b,0)/hist.length;
        this.indicators.stochHistory = hist;
        this.indicators.stoch = {k, d};
        console.log(`📊 Stochastic محسوب: %K=${k.toFixed(2)}, %D=${d.toFixed(2)}`);
    }

    calculateEMACross(fast=5, slow=20) {
        if (this.priceHistory.length < slow + 1) { this.indicators.emaCross = null; return; }
        const prices = this.priceHistory.map(p=>p.price);
        const fastPrev = this.calculateEMA(prices.slice(0,-1), fast);
        const slowPrev = this.calculateEMA(prices.slice(0,-1), slow);
        const fastNow = this.calculateEMA(prices, fast);
        const slowNow = this.calculateEMA(prices, slow);
        let signal = null;
        if (fastPrev < slowPrev && fastNow > slowNow) signal = "CALL";
        else if (fastPrev > slowPrev && fastNow < slowNow) signal = "PUT";
        this.indicators.emaCross = {fast: fastNow, slow: slowNow, signal};
        console.log(`📊 EMA Cross: fast=${fastNow.toFixed(5)}, slow=${slowNow.toFixed(5)}, signal=${signal}`);
    }

    calculateATR(period = 14) {
        if (this.priceHistory.length < period + 1) { this.indicators.atr = null; return; }
        const prices = this.priceHistory.map(p => p.price);
        const trs = [];
        for (let i = prices.length - period; i < prices.length; i++) {
            trs.push(Math.abs(prices[i] - prices[i - 1]));
        }
        const atr = trs.reduce((a, b) => a + b, 0) / trs.length;
        this.indicators.atr = atr;
    }

    calculateADX(period = 14) {
        if (this.priceHistory.length < period + 1) { this.indicators.adx = null; return; }
        const prices = this.priceHistory.map(p => p.price);
        const dxs = [];
        for (let i = prices.length - period; i < prices.length; i++) {
            const upMove = prices[i] - prices[i - 1];
            const downMove = prices[i - 1] - prices[i];
            const plusDM = upMove > downMove && upMove > 0 ? upMove : 0;
            const minusDM = downMove > upMove && downMove > 0 ? downMove : 0;
            const tr = Math.abs(prices[i] - prices[i - 1]);
            const plusDI = (plusDM / tr) * 100;
            const minusDI = (minusDM / tr) * 100;
            const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
            if (!isNaN(dx)) dxs.push(dx);
        }
        const adx = dxs.reduce((a, b) => a + b, 0) / dxs.length;
        this.indicators.adx = adx;
    }

    calculateSuperTrend(period = 10, mult = 3) {
        this.calculateATR(period);
        if (!this.indicators.atr) { this.indicators.supertrend = null; return; }
        const prices = this.priceHistory.map(p=>p.price);
        const ema = this.calculateEMA(prices, period);
        const upper = ema + mult * this.indicators.atr;
        const lower = ema - mult * this.indicators.atr;
        let direction = this.indicators.supertrend ? this.indicators.supertrend.direction : 'جانبي';
        if (this.currentPrice > upper) direction = 'صاعد';
        else if (this.currentPrice < lower) direction = 'هابط';
        this.indicators.supertrend = {direction, upper, lower};
    }

    calculateMomentum(period = 10) {
        if (this.priceHistory.length < period + 1) { this.indicators.momentum = null; return; }
        const oldPrice = this.priceHistory[this.priceHistory.length - period - 1].price;
        this.indicators.momentum = this.currentPrice - oldPrice;
    }

    analyzeSignals() {
        this.signals = [];
        
        // إشارات RSI
        if (this.indicators.rsi) {
            if (this.indicators.rsi > 70) {
                this.signals.push({
                    type: 'PUT',
                    strength: 'قوي',
                    reason: 'RSI في منطقة التشبع الشرائي',
                    confidence: 75
                });
            } else if (this.indicators.rsi < 30) {
                this.signals.push({
                    type: 'CALL',
                    strength: 'قوي',
                    reason: 'RSI في منطقة التشبع البيعي',
                    confidence: 75
                });
            }
        }
        
        // إشارات Bollinger Bands
        if (this.indicators.bb) {
            if (this.indicators.bb.position === 'upper') {
                this.signals.push({
                    type: 'PUT',
                    strength: 'متوسط',
                    reason: 'السعر عند الحد العلوي لبولينجر',
                    confidence: 60
                });
            } else if (this.indicators.bb.position === 'lower') {
                this.signals.push({
                    type: 'CALL',
                    strength: 'متوسط',
                    reason: 'السعر عند الحد السفلي لبولينجر',
                    confidence: 60
                });
            }
        }
        
        // إشارات MACD
        if (this.indicators.macd) {
            if (this.indicators.macd > 0) {
                this.signals.push({
                    type: 'CALL',
                    strength: 'متوسط',
                    reason: 'MACD إيجابي',
                    confidence: 55
                });
            } else {
                this.signals.push({
                    type: 'PUT',
                    strength: 'متوسط',
                    reason: 'MACD سلبي',
                    confidence: 55
                });
            }
        }
        if (this.indicators.stoch) {
            if (this.indicators.stoch.k > 80 && this.indicators.stoch.d > 80) {
                this.signals.push({type: "PUT", strength: "قوي", reason: "Stochastic تشبع شرائي", confidence: 70});
            } else if (this.indicators.stoch.k < 20 && this.indicators.stoch.d < 20) {
                this.signals.push({type: "CALL", strength: "قوي", reason: "Stochastic تشبع بيعي", confidence: 70});
            }
        }
        if (this.indicators.emaCross && this.indicators.emaCross.signal) {
            this.signals.push({type: this.indicators.emaCross.signal, strength: "قوي", reason: "تقاطع EMA سريع وبطيء", confidence: 65});
        }
        if (this.indicators.supertrend && this.indicators.adx && this.indicators.adx > 25) {
            const dir = this.indicators.supertrend.direction;
            if (dir !== "جانبي" && this.indicators.trendShort === dir && this.indicators.trendMedium === dir && this.indicators.trendLong === dir) {
                this.signals.push({type: dir === "صاعد" ? "CALL" : "PUT", strength: "قوي", reason: "اتجاه قوي مؤكد بعدة فريمات", confidence: 80});
            }
        }
        if (this.indicators.trendShort && this.indicators.trendMedium && this.indicators.trendShort === this.indicators.trendMedium && this.indicators.trendShort !== "جانبي") {
            this.signals.push({type: this.indicators.trendShort === "صاعد" ? "CALL" : "PUT", strength: "قوي", reason: "اتجاه متوافق على عدة فريمات", confidence: 60});
        }
    }

    generateRecommendation() {
        if (this.signals.length === 0) {
            this.recommendation = {
                action: 'انتظار',
                confidence: 0,
                expiry: 'غير محدد',
                reason: 'لا توجد إشارات واضحة'
            };
            return;
        }
        
        // تجميع الإشارات حسب النوع
        const callSignals = this.signals.filter(s => s.type === 'CALL');
        const putSignals = this.signals.filter(s => s.type === 'PUT');
        
        const callConfidence = callSignals.reduce((sum, s) => sum + s.confidence, 0);
        const putConfidence = putSignals.reduce((sum, s) => sum + s.confidence, 0);
        
        if (callConfidence > putConfidence && callConfidence > 100) {
            this.recommendation = {
                action: 'CALL',
                confidence: Math.min(callConfidence / callSignals.length, 95),
                expiry: this.suggestExpiry(),
                reason: callSignals.map(s => s.reason).join(', ')
            };
        } else if (putConfidence > callConfidence && putConfidence > 100) {
            this.recommendation = {
                action: 'PUT',
                confidence: Math.min(putConfidence / putSignals.length, 95),
                expiry: this.suggestExpiry(),
                reason: putSignals.map(s => s.reason).join(', ')
            };
        } else {
            this.recommendation = {
                action: 'انتظار',
                confidence: 0,
                expiry: 'غير محدد',
                reason: 'إشارات متضاربة'
            };
        }
    }

    suggestExpiry() {
        const volatility = this.calculateVolatility();
        const atr = this.indicators.atr || 0;
        if (volatility > 0.3 || atr > 0.0005) return "1 دقيقة";
        return "2 دقائق";

    }
    calculateVolatility() {
        if (this.priceHistory.length < 10) return 0;
        
        const prices = this.priceHistory.slice(-10).map(p => p.price);
        const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
        
        return Math.sqrt(variance) / mean;
    }

    updateUI() {
        // تحديث المؤشرات
        const rsiElement = document.getElementById('po-rsi');
        if (rsiElement && this.indicators.rsi) {
            rsiElement.textContent = this.indicators.rsi.toFixed(2);
            rsiElement.className = this.indicators.rsi > 70 ? 'po-overbought' : 
                                  this.indicators.rsi < 30 ? 'po-oversold' : 'po-neutral';
        }
        
        const macdElement = document.getElementById('po-macd');
        if (macdElement && this.indicators.macd) {
            macdElement.textContent = this.indicators.macd.toFixed(4);
            macdElement.className = this.indicators.macd > 0 ? 'po-positive' : 'po-negative';
        }
        
        const bbElement = document.getElementById('po-bb');
        if (bbElement && this.indicators.bb) {
            bbElement.textContent = this.indicators.bb.position;
        }
        
        const trendElement = document.getElementById('po-trend');
        if (trendElement && this.indicators.trend) {
            trendElement.textContent = this.indicators.trend;
        }
        const stochElement = document.getElementById("po-stoch");
        if (stochElement && this.indicators.stoch) {
            stochElement.textContent = this.indicators.stoch.k.toFixed(1) + "/" + this.indicators.stoch.d.toFixed(1);
        }
        const emaCrossElement = document.getElementById("po-ema-cross");
        if (emaCrossElement) {
            emaCrossElement.textContent = this.indicators.emaCross && this.indicators.emaCross.signal ? this.indicators.emaCross.signal : "--";
        }
        const trendShortEl = document.getElementById("po-trend-short");
        if (trendShortEl && this.indicators.trendShort) {
            trendShortEl.textContent = this.indicators.trendShort;
        }
        const trendMediumEl = document.getElementById("po-trend-medium");
        if (trendMediumEl && this.indicators.trendMedium) {
            trendMediumEl.textContent = this.indicators.trendMedium;
        }
        const trendLongEl = document.getElementById("po-trend-long");
        if (trendLongEl && this.indicators.trendLong) {
            trendLongEl.textContent = this.indicators.trendLong;
        }
        const atrEl = document.getElementById("po-atr");
        if (atrEl && this.indicators.atr) {
            atrEl.textContent = this.indicators.atr.toFixed(5);
        }
        const adxEl = document.getElementById("po-adx");
        if (adxEl && this.indicators.adx) {
            adxEl.textContent = this.indicators.adx.toFixed(1);
        }
        const superEl = document.getElementById("po-supertrend");
        if (superEl && this.indicators.supertrend) {
            superEl.textContent = this.indicators.supertrend.direction;
        }
        
        // تحديث السعر
        const priceElement = document.getElementById('po-current-price');
        if (priceElement) {
            priceElement.textContent = this.currentPrice.toFixed(5);
        }
        
        // تحديث التوصية
        if (this.recommendation) {
            const actionElement = document.getElementById('po-action');
            const confidenceElement = document.getElementById('po-confidence');
            const expiryElement = document.getElementById('po-expiry-time');
            
            if (actionElement) actionElement.textContent = this.recommendation.action;
            if (confidenceElement) confidenceElement.textContent = this.recommendation.confidence.toFixed(0) + '%';
            if (expiryElement) expiryElement.textContent = this.recommendation.expiry;
            
            // تلوين التوصية
            const recommendationBox = document.getElementById('po-recommendation');
            if (recommendationBox) {
                recommendationBox.className = 'po-recommendation-box';
                if (this.recommendation.action === 'CALL') {
                    recommendationBox.classList.add('po-call-signal');
                } else if (this.recommendation.action === 'PUT') {
                    recommendationBox.classList.add('po-put-signal');
                }
            }
        }
    }

    addEventListeners() {
        // زر التحليل الفوري
        const analyzeBtn = document.getElementById('po-analyze-btn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                console.log('🔍 بدء التحليل اليدوي...');
                this.collectMarketData(); // جمع البيانات أولاً
                this.performAnalysis();
                this.updateUI();
            });
        }

        // إضافة زر تشخيص
        const diagnosticBtn = document.createElement('button');
        diagnosticBtn.textContent = '🔧 تشخيص';
        diagnosticBtn.className = 'po-btn po-btn-secondary';
        diagnosticBtn.style.marginTop = '5px';
        diagnosticBtn.addEventListener('click', () => {
            this.runDiagnostics();
        });

        const controlsSection = document.querySelector('.po-controls-section');
        if (controlsSection) {
            controlsSection.appendChild(diagnosticBtn);
        }

        // زر تصغير/تكبير اللوحة
        const toggleBtn = document.getElementById('po-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const content = document.querySelector('.po-panel-content');
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    toggleBtn.textContent = 'تصغير';
                } else {
                    content.style.display = 'none';
                    toggleBtn.textContent = 'تكبير';
                }
            });
        }

        // استقبال الرسائل من popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'getData':
                    sendResponse(this.getCurrentData());
                    break;
                case 'analyze':
                    this.performAnalysis();
                    this.updateUI();
                    sendResponse(this.getCurrentData());
                    break;
                case 'toggleAnalyzer':
                    this.isActive = request.enabled;
                    if (this.isActive) {
                        this.startDataMonitoring();
                    } else {
                        clearInterval(this.updateInterval);
                    }
                    sendResponse({ success: true });
                    break;
                case 'showPanel':
                    // إنشاء أو إظهار لوحة التحليل عند الطلب
                    if (!this.analysisPanel || !document.body.contains(this.analysisPanel)) {
                        this.createAnalysisPanel();
                        this.updateUI();
                    } else {
                        // إذا كانت موجودة، تبديل الرؤية
                        this.analysisPanel.style.display =
                            this.analysisPanel.style.display === 'none' ? 'block' : 'none';
                    }
                    sendResponse({ success: true });
                    break;
                case 'hidePanel':
                    // إخفاء لوحة التحليل
                    if (this.analysisPanel) {
                        this.analysisPanel.style.display = 'none';
                    }
                    sendResponse({ success: true });
                    break;
                case 'runDiagnostics':
                    // تشغيل التشخيص وإرجاع النتائج
                    const diagnosticResults = this.runComprehensiveDiagnostics();
                    sendResponse(diagnosticResults);
                    break;
                default:
                    sendResponse({ error: 'Unknown action' });
            }
        });
    }

    runDiagnostics() {
        console.log('🔧 بدء التشخيص...');
        console.log('📊 حالة البيانات الحالية:');
        console.log('- السعر الحالي:', this.currentPrice);
        console.log('- عدد نقاط التاريخ:', this.priceHistory.length);
        console.log('- آخر 5 أسعار:', this.priceHistory.slice(-5).map(p => p.price));

        console.log('🔍 البحث عن النصوص في الصفحة...');

        // البحث عن جميع النصوص التي تحتوي على أرقام
        const allTexts = Array.from(document.querySelectorAll('*'))
            .filter(el => el.children.length === 0) // عناصر نصية فقط
            .map(el => el.textContent.trim())
            .filter(text => /\d/.test(text) && text.length < 20) // تحتوي على أرقام وقصيرة
            .filter(text => text.length > 0)
            .slice(0, 50); // أول 50 نص

        console.log('📝 النصوص التي تحتوي على أرقام:', allTexts);

        // البحث عن أنماط الأسعار المختلفة
        const pricePatterns = [
            /\b1\.\d{5}\b/,        // EUR/USD pattern (1.15000)
            /\b1\.\d{4}\b/,        // EUR/USD pattern (1.1500)
            /\b0\.\d{5}\b/,        // GBP/USD pattern (0.xxxxx)
            /\b0\.\d{4}\b/,        // GBP/USD pattern (0.xxxx)
            /\b\d{2,3}\.\d{3,5}\b/, // Other currencies
            /\b\d+\.\d{5}\b/,      // Any price with 5 decimals
            /\b\d+\.\d{4}\b/,      // Any price with 4 decimals
        ];

        const priceTexts = allTexts.filter(text =>
            pricePatterns.some(pattern => pattern.test(text))
        );
        console.log('💰 النصوص التي تشبه الأسعار:', priceTexts);

        // البحث المباشر في العناصر المرئية
        console.log('🔍 البحث المباشر في العناصر المرئية...');
        const visibleElements = Array.from(document.querySelectorAll('*')).filter(el => {
            return el.offsetParent !== null &&
                   el.offsetWidth > 0 &&
                   el.offsetHeight > 0 &&
                   el.children.length === 0; // نص فقط
        });

        const foundPrices = [];
        for (const element of visibleElements) {
            const text = element.textContent.trim();
            for (const pattern of pricePatterns) {
                const matches = text.match(pattern);
                if (matches) {
                    foundPrices.push({
                        text: text,
                        price: matches[0],
                        element: element.tagName,
                        className: element.className
                    });
                }
            }
        }

        console.log('🎯 الأسعار المكتشفة مباشرة:', foundPrices);

        // بحث خاص لـ PocketOption
        console.log('🔍 بحث خاص لـ PocketOption...');

        // البحث في الرسم البياني
        const chartElements = document.querySelectorAll('[class*="chart"], [class*="price"], [class*="rate"], [id*="chart"], [id*="price"]');
        console.log('📊 عناصر الرسم البياني:', chartElements.length);

        // البحث في النصوص الكبيرة (الأسعار عادة تكون بخط كبير)
        const largeTexts = Array.from(document.querySelectorAll('*')).filter(el => {
            const style = window.getComputedStyle(el);
            const fontSize = parseFloat(style.fontSize);
            return fontSize > 16 && el.children.length === 0 && el.textContent.trim().length > 0;
        }).map(el => ({
            text: el.textContent.trim(),
            fontSize: window.getComputedStyle(el).fontSize,
            element: el.tagName,
            className: el.className
        }));

        console.log('🔤 النصوص الكبيرة (قد تحتوي على أسعار):', largeTexts);

        // البحث عن أي رقم يحتوي على نقطة عشرية
        const decimalNumbers = allTexts.filter(text => /\d+\.\d+/.test(text));
        console.log('🔢 جميع الأرقام العشرية:', decimalNumbers);

        // معلومات الصفحة
        console.log('🌐 معلومات الصفحة:');
        console.log('- URL:', window.location.href);
        console.log('- العنوان:', document.title);
        console.log('- هل هذه صفحة PocketOption؟', window.location.href.includes('pocketoption'));

        alert('تم إكمال التشخيص - تحقق من Console (F12) للتفاصيل');
    }

    runComprehensiveDiagnostics() {
        console.log('🔧 بدء التشخيص الشامل...');

        const results = {
            currentPrice: this.currentPrice,
            priceHistoryLength: this.priceHistory.length,
            lastUpdate: this.priceHistory.length > 0 ?
                new Date(this.priceHistory[this.priceHistory.length - 1].timestamp).toLocaleString() : null,
            url: window.location.href,
            title: document.title,
            canvasCount: document.querySelectorAll('canvas').length,
            svgCount: document.querySelectorAll('svg').length,
            numbersFound: 0,
            elementsWithNumbers: [],
            recommendations: []
        };

        // البحث عن جميع الأرقام العشرية
        const allText = document.body.innerText || '';
        const numbers = allText.match(/\d+\.\d+/g);
        results.numbersFound = numbers ? numbers.length : 0;

        // البحث عن عناصر تحتوي على أرقام
        const elements = document.querySelectorAll('span, div, td, th, p');
        elements.forEach(el => {
            const text = el.textContent.trim();
            if (/^\d+\.\d+$/.test(text)) {
                results.elementsWithNumbers.push({
                    text: text,
                    tag: el.tagName,
                    class: el.className,
                    id: el.id,
                    visible: el.offsetParent !== null
                });
            }
        });

        // إضافة توصيات
        if (results.currentPrice === 0) {
            results.recommendations.push('لم يتم العثور على أي سعر - تأكد من فتح صفحة التداول');
        }

        if (results.priceHistoryLength === 0) {
            results.recommendations.push('لا يوجد تاريخ أسعار - انتظر قليلاً أو أعد تحميل الصفحة');
        }

        if (results.canvasCount === 0 && results.svgCount === 0) {
            results.recommendations.push('لا توجد عناصر رسم بياني - تأكد من تحميل الرسم البياني');
        }

        if (results.numbersFound === 0) {
            results.recommendations.push('لا توجد أرقام في الصفحة - تأكد من تحميل البيانات');
        }

        console.log('📊 نتائج التشخيص:', results);
        return results;
    }

    getCurrentData() {
        return {
            currentPrice: this.currentPrice,
            priceHistory: this.priceHistory,
            indicators: this.indicators,
            recommendation: this.recommendation,
            signals: this.signals,
            timestamp: Date.now()
        };
    }

    cleanup() {
        console.log('🧹 تنظيف الموارد...');

        // إيقاف مراقب DOM
        if (this.domObserver) {
            this.domObserver.disconnect();
            this.domObserver = null;
        }

        // إيقاف التحديث الدوري
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        this.isActive = false;
    }

    destroy() {
        this.cleanup();

        if (this.analysisPanel) {
            this.analysisPanel.remove();
            this.analysisPanel = null;
        }

        console.log('🗑️ تم تدمير محلل PocketOption');
    }
}

// تشغيل المحلل
const analyzer = new PocketOptionAnalyzer();

// إضافة مستمع لإيقاف المحلل عند مغادرة الصفحة
window.addEventListener('beforeunload', () => {
    analyzer.destroy();
});
