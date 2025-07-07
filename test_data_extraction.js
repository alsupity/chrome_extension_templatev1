// أداة اختبار استخراج البيانات من PocketOption
// شغل هذا الكود في Console للعثور على بيانات السعر

console.log('🔍 بدء اختبار استخراج البيانات من PocketOption...');

// 1. البحث عن عناصر تحتوي على كلمات مفتاحية
function findPriceElements() {
    console.log('\n📊 البحث عن عناصر السعر...');
    
    const selectors = [
        '[class*="price"]',
        '[class*="rate"]', 
        '[class*="quote"]',
        '[class*="value"]',
        '[class*="current"]',
        '[class*="last"]',
        '[class*="bid"]',
        '[class*="ask"]',
        '[class*="market"]',
        '[id*="price"]',
        '[id*="rate"]',
        '.price',
        '.rate',
        '.quote'
    ];
    
    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            console.log(`✅ ${selector}: ${elements.length} عنصر`);
            elements.forEach((el, i) => {
                if (i < 3) { // أول 3 عناصر فقط
                    console.log(`   - ${el.textContent?.trim() || 'فارغ'}`);
                }
            });
        }
    });
}

// 2. البحث عن أرقام تشبه الأسعار في النص
function findPriceNumbers() {
    console.log('\n💰 البحث عن أرقام تشبه الأسعار...');
    
    const bodyText = document.body.innerText;
    const priceRegex = /\d+\.\d{3,6}/g;
    const matches = bodyText.match(priceRegex);
    
    if (matches) {
        const uniquePrices = [...new Set(matches)]
            .map(m => parseFloat(m))
            .filter(p => p > 0.001 && p < 100000)
            .sort((a, b) => b - a)
            .slice(0, 10);
        
        console.log('🎯 أرقام محتملة للأسعار (أعلى 10):');
        uniquePrices.forEach(price => {
            console.log(`   - ${price}`);
        });
        
        return uniquePrices;
    } else {
        console.log('❌ لم يتم العثور على أرقام تشبه الأسعار');
        return [];
    }
}

// 3. البحث في عناصر محددة
function findSpecificElements() {
    console.log('\n🔍 البحث في عناصر محددة...');
    
    const elements = document.querySelectorAll('span, div, td, th');
    const priceElements = [];
    
    elements.forEach(element => {
        const text = element.textContent?.trim();
        if (text && /^\d+\.\d{3,6}$/.test(text)) {
            const price = parseFloat(text);
            if (price > 0.001 && price < 100000) {
                priceElements.push({
                    element: element,
                    price: price,
                    text: text,
                    className: element.className,
                    id: element.id
                });
            }
        }
    });
    
    if (priceElements.length > 0) {
        console.log(`✅ تم العثور على ${priceElements.length} عنصر يحتوي على أسعار:`);
        priceElements.slice(0, 5).forEach(item => {
            console.log(`   - ${item.price} (class: ${item.className}, id: ${item.id})`);
        });
        return priceElements;
    } else {
        console.log('❌ لم يتم العثور على عناصر تحتوي على أسعار');
        return [];
    }
}

// 4. فحص طلبات الشبكة
function checkNetworkRequests() {
    console.log('\n🌐 مراقبة طلبات الشبكة...');
    
    // اعتراض XMLHttpRequest
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
        const xhr = new originalXHR();
        const originalOpen = xhr.open;
        
        xhr.open = function(method, url, ...args) {
            console.log(`📡 طلب شبكة: ${method} ${url}`);
            return originalOpen.apply(this, [method, url, ...args]);
        };
        
        return xhr;
    };
    
    // اعتراض fetch
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        console.log(`📡 Fetch: ${url}`);
        return originalFetch(url, options);
    };
    
    console.log('✅ تم تفعيل مراقبة طلبات الشبكة');
}

// 5. البحث في localStorage و sessionStorage
function checkStorage() {
    console.log('\n💾 فحص التخزين المحلي...');
    
    // localStorage
    console.log('📦 localStorage:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        if (value && (value.includes('.') || /\d+\.\d+/.test(value))) {
            console.log(`   - ${key}: ${value.substring(0, 100)}...`);
        }
    }
    
    // sessionStorage
    console.log('📦 sessionStorage:');
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        if (value && (value.includes('.') || /\d+\.\d+/.test(value))) {
            console.log(`   - ${key}: ${value.substring(0, 100)}...`);
        }
    }
}

// 6. البحث في متغيرات window
function checkWindowVariables() {
    console.log('\n🪟 فحص متغيرات window...');
    
    const interestingKeys = [];
    for (const key in window) {
        if (key.toLowerCase().includes('price') || 
            key.toLowerCase().includes('rate') || 
            key.toLowerCase().includes('quote') ||
            key.toLowerCase().includes('market')) {
            interestingKeys.push(key);
        }
    }
    
    if (interestingKeys.length > 0) {
        console.log('🎯 متغيرات مثيرة للاهتمام:');
        interestingKeys.forEach(key => {
            try {
                const value = window[key];
                console.log(`   - ${key}: ${typeof value} ${value?.toString?.()?.substring(0, 50) || ''}`);
            } catch (e) {
                console.log(`   - ${key}: خطأ في الوصول`);
            }
        });
    } else {
        console.log('❌ لم يتم العثور على متغيرات مثيرة للاهتمام');
    }
}

// تشغيل جميع الاختبارات
function runAllTests() {
    console.log('🚀 تشغيل جميع اختبارات استخراج البيانات...');
    
    findPriceElements();
    const prices = findPriceNumbers();
    const elements = findSpecificElements();
    checkStorage();
    checkWindowVariables();
    checkNetworkRequests();
    
    console.log('\n📋 ملخص النتائج:');
    console.log(`   - أرقام محتملة: ${prices.length}`);
    console.log(`   - عناصر تحتوي على أسعار: ${elements.length}`);
    
    if (prices.length > 0) {
        console.log(`\n🎯 أفضل سعر محتمل: ${prices[0]}`);
        
        // محاولة إرسال البيانات للإضافة
        window.postMessage({
            type: 'PO_PRICE_UPDATE',
            data: {
                currentPrice: prices[0],
                priceHistory: prices.slice(0, 10).map((price, i) => ({
                    price: price,
                    timestamp: Date.now() - (i * 1000)
                })),
                timestamp: Date.now()
            }
        }, '*');
        
        console.log('✅ تم إرسال البيانات للإضافة');
    }
}

// تشغيل الاختبارات
runAllTests();

// إضافة مراقب للتغييرات
console.log('\n👀 إضافة مراقب للتغييرات...');
const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const text = node.textContent;
                    if (text && /\d+\.\d{3,6}/.test(text)) {
                        console.log('🆕 عنصر جديد يحتوي على رقم:', text);
                    }
                }
            });
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('✅ تم تفعيل مراقب التغييرات');

// دالة لإيقاف المراقب
window.stopPriceMonitoring = () => {
    observer.disconnect();
    console.log('⏹️ تم إيقاف مراقب التغييرات');
};

console.log('\n💡 نصائح:');
console.log('   - تأكد من أنك في صفحة التداول وليس الصفحة الرئيسية');
console.log('   - افتح رسم بياني لأي أصل مالي');
console.log('   - شاهد Console للحصول على تحديثات مستمرة');
console.log('   - استخدم stopPriceMonitoring() لإيقاف المراقبة');
