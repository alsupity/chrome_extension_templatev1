// PocketOption Trading Assistant - Injected Script
// سكريبت مُحقن للوصول المباشر لبيانات PocketOption

(function() {
    'use strict';
    
    class PocketOptionDataExtractor {
        constructor() {
            this.priceData = [];
            this.chartData = null;
            this.isMonitoring = false;
            this.observers = [];
            
            this.init();
        }
        
        init() {
            console.log('🔍 PocketOption Data Extractor تم تحميله');
            this.startMonitoring();
            this.setupDataInterception();
        }
        
        startMonitoring() {
            if (this.isMonitoring) return;

            this.isMonitoring = true;

            // مراقبة تغييرات DOM
            this.observeDOM();

            // مراقبة طلبات الشبكة
            this.interceptNetworkRequests();

            // مراقبة WebSocket connections
            this.interceptWebSocket();

            // فحص دوري للبيانات
            this.startPeriodicScan();

            console.log('✅ بدء مراقبة بيانات PocketOption');
        }

        startPeriodicScan() {
            // فحص دوري كل 3 ثوان للبحث عن بيانات السعر
            setInterval(() => {
                this.scanForPriceData();
            }, 3000);
        }

        scanForPriceData() {
            console.log('🔍 فحص دوري للبحث عن بيانات السعر...');

            // البحث في النص الكامل للصفحة
            const bodyText = document.body.innerText;
            const priceRegex = /\d+\.\d{3,6}/g;
            const matches = bodyText.match(priceRegex);

            if (matches) {
                // أخذ أحدث الأرقام التي تبدو كأسعار
                const recentPrices = matches
                    .map(m => parseFloat(m))
                    .filter(p => p > 0.001 && p < 100000)
                    .slice(-5); // آخر 5 أرقام

                if (recentPrices.length > 0) {
                    console.log('🎯 أسعار محتملة تم العثور عليها:', recentPrices);
                    // استخدام آخر سعر
                    this.addPriceData(recentPrices[recentPrices.length - 1]);
                }
            }

            // البحث في عناصر محددة
            const specificElements = document.querySelectorAll('span, div, td');
            specificElements.forEach(element => {
                const text = element.textContent;
                if (text && /^\d+\.\d{3,6}$/.test(text.trim())) {
                    const price = parseFloat(text.trim());
                    if (price > 0.001 && price < 100000) {
                        console.log('💰 سعر من عنصر محدد:', price);
                        this.addPriceData(price);
                    }
                }
            });
        }
        
        observeDOM() {
            // مراقبة عناصر السعر - قائمة موسعة
            const priceSelectors = [
                '[class*="price"]',
                '[class*="rate"]',
                '[class*="quote"]',
                '[class*="value"]',
                '[class*="current"]',
                '[class*="last"]',
                '[class*="bid"]',
                '[class*="ask"]',
                '[class*="market"]',
                '[class*="ticker"]',
                '[id*="price"]',
                '[id*="rate"]',
                '[data-price]',
                '[data-value]',
                '.price',
                '.rate',
                '.quote',
                '.current-price',
                '.market-price'
            ];
            
            priceSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    const observer = new MutationObserver((mutations) => {
                        mutations.forEach(mutation => {
                            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                                this.extractPriceFromElement(element);
                            }
                        });
                    });
                    
                    observer.observe(element, {
                        childList: true,
                        subtree: true,
                        characterData: true
                    });
                    
                    this.observers.push(observer);
                });
            });
            
            // مراقبة إضافة عناصر جديدة
            const mainObserver = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.scanNewElement(node);
                        }
                    });
                });
            });
            
            mainObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            this.observers.push(mainObserver);
        }
        
        extractPriceFromElement(element) {
            const text = element.textContent || element.innerText;
            if (!text) return;

            // البحث عن أرقام تشبه الأسعار - نطاق أوسع
            const priceRegex = /\d+\.\d{2,6}/g;
            const matches = text.match(priceRegex);

            if (matches) {
                matches.forEach(match => {
                    const price = parseFloat(match);
                    // نطاق أوسع للأسعار (0.001 إلى 100000)
                    if (price > 0.001 && price < 100000) {
                        console.log('🔍 سعر محتمل تم العثور عليه:', price, 'من العنصر:', element);
                        this.addPriceData(price);
                    }
                });
            }
        }
        
        scanNewElement(element) {
            // فحص العنصر الجديد للبحث عن بيانات السعر
            if (element.querySelector) {
                const priceElements = element.querySelectorAll('[class*="price"], [class*="rate"], [class*="quote"]');
                priceElements.forEach(el => this.extractPriceFromElement(el));
            }
        }
        
        addPriceData(price) {
            const now = Date.now();
            
            // تجنب الأسعار المكررة
            if (this.priceData.length > 0) {
                const lastPrice = this.priceData[this.priceData.length - 1];
                if (Math.abs(lastPrice.price - price) < 0.00001 && 
                    now - lastPrice.timestamp < 1000) {
                    return;
                }
            }
            
            this.priceData.push({
                price: price,
                timestamp: now
            });
            
            // الاحتفاظ بآخر 200 نقطة فقط
            if (this.priceData.length > 200) {
                this.priceData.shift();
            }
            
            // إرسال البيانات للـ content script
            this.sendDataToContentScript();
        }
        
        interceptNetworkRequests() {
            // اعتراض XMLHttpRequest
            const originalXHR = window.XMLHttpRequest;
            const self = this;
            
            window.XMLHttpRequest = function() {
                const xhr = new originalXHR();
                const originalOpen = xhr.open;
                const originalSend = xhr.send;
                
                xhr.open = function(method, url, ...args) {
                    this._url = url;
                    return originalOpen.apply(this, [method, url, ...args]);
                };
                
                xhr.send = function(data) {
                    this.addEventListener('load', function() {
                        self.handleNetworkResponse(this._url, this.responseText);
                    });
                    return originalSend.apply(this, [data]);
                };
                
                return xhr;
            };
            
            // اعتراض fetch
            const originalFetch = window.fetch;
            window.fetch = function(url, options) {
                return originalFetch(url, options).then(response => {
                    const clonedResponse = response.clone();
                    clonedResponse.text().then(text => {
                        self.handleNetworkResponse(url, text);
                    });
                    return response;
                });
            };
        }
        
        handleNetworkResponse(url, responseText) {
            try {
                // البحث عن بيانات التداول في الاستجابات
                if (url.includes('quote') || url.includes('price') || url.includes('rate')) {
                    const data = JSON.parse(responseText);
                    this.extractDataFromAPI(data);
                }
            } catch (e) {
                // تجاهل الأخطاء في تحليل JSON
            }
        }
        
        extractDataFromAPI(data) {
            // استخراج بيانات السعر من API responses
            if (data && typeof data === 'object') {
                this.searchForPriceInObject(data);
            }
        }
        
        searchForPriceInObject(obj, depth = 0) {
            if (depth > 3) return; // تجنب التكرار العميق
            
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const value = obj[key];
                    
                    if (typeof value === 'number' && value > 0 && value < 10) {
                        // قد يكون سعر
                        if (key.toLowerCase().includes('price') || 
                            key.toLowerCase().includes('rate') || 
                            key.toLowerCase().includes('quote')) {
                            this.addPriceData(value);
                        }
                    } else if (typeof value === 'object' && value !== null) {
                        this.searchForPriceInObject(value, depth + 1);
                    }
                }
            }
        }
        
        interceptWebSocket() {
            const originalWebSocket = window.WebSocket;
            const self = this;
            
            window.WebSocket = function(url, protocols) {
                const ws = new originalWebSocket(url, protocols);
                
                ws.addEventListener('message', function(event) {
                    self.handleWebSocketMessage(event.data);
                });
                
                return ws;
            };
        }
        
        handleWebSocketMessage(data) {
            try {
                const parsed = JSON.parse(data);
                this.extractDataFromAPI(parsed);
            } catch (e) {
                // البحث عن أرقام في النص العادي
                const priceRegex = /\d+\.\d{3,5}/g;
                const matches = data.match(priceRegex);
                if (matches) {
                    matches.forEach(match => {
                        const price = parseFloat(match);
                        if (price > 0 && price < 10) {
                            this.addPriceData(price);
                        }
                    });
                }
            }
        }
        
        sendDataToContentScript() {
            // إرسال البيانات للـ content script
            window.postMessage({
                type: 'PO_PRICE_UPDATE',
                data: {
                    priceData: this.priceData.slice(-50), // آخر 50 نقطة
                    currentPrice: this.priceData.length > 0 ? 
                        this.priceData[this.priceData.length - 1].price : null,
                    timestamp: Date.now()
                }
            }, '*');
        }
        
        setupDataInterception() {
            // إعداد اعتراض البيانات من مصادر مختلفة
            this.interceptCanvasData();
            this.interceptChartLibraries();
        }
        
        interceptCanvasData() {
            // اعتراض رسم Canvas للحصول على بيانات الرسم البياني
            const originalGetContext = HTMLCanvasElement.prototype.getContext;
            const self = this;
            
            HTMLCanvasElement.prototype.getContext = function(type, ...args) {
                const context = originalGetContext.apply(this, [type, ...args]);
                
                if (type === '2d') {
                    // مراقبة عمليات الرسم
                    const originalStroke = context.stroke;
                    context.stroke = function() {
                        // يمكن تحليل مسار الرسم هنا
                        return originalStroke.apply(this, arguments);
                    };
                }
                
                return context;
            };
        }
        
        interceptChartLibraries() {
            // اعتراض مكتبات الرسم البياني الشائعة
            
            // TradingView
            if (window.TradingView) {
                console.log('🔍 تم اكتشاف TradingView');
            }
            
            // Chart.js
            if (window.Chart) {
                console.log('🔍 تم اكتشاف Chart.js');
            }
            
            // D3.js
            if (window.d3) {
                console.log('🔍 تم اكتشاف D3.js');
            }
        }
        
        getCurrentPrice() {
            return this.priceData.length > 0 ? 
                this.priceData[this.priceData.length - 1].price : null;
        }
        
        getPriceHistory() {
            return this.priceData.slice();
        }
        
        destroy() {
            this.isMonitoring = false;
            this.observers.forEach(observer => observer.disconnect());
            this.observers = [];
        }
    }
    
    // إنشاء مستخرج البيانات
    const dataExtractor = new PocketOptionDataExtractor();
    
    // إتاحة الوصول للبيانات من content script
    window.PODataExtractor = dataExtractor;
    
    // استقبال الرسائل من content script
    window.addEventListener('message', function(event) {
        if (event.data.type === 'PO_GET_DATA') {
            window.postMessage({
                type: 'PO_DATA_RESPONSE',
                data: {
                    currentPrice: dataExtractor.getCurrentPrice(),
                    priceHistory: dataExtractor.getPriceHistory(),
                    timestamp: Date.now()
                }
            }, '*');
        }
    });
    
    console.log('✅ PocketOption Data Extractor جاهز');
    
})();
