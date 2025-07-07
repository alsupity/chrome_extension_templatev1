// New PocketOption Scalping Assistant - completely rewritten
class ScalpingAssistant {
    constructor() {
        this.priceHistory = [];
        this.indicators = {};
        this.recommendation = {action: 'انتظار', confidence: 0, expiry: '1 دقيقة'};
        this.start();
    }

    start() {
        this.collectPrice();
        this.timer = setInterval(() => {
            this.collectPrice();
            this.calculateIndicators();
            this.makeDecision();
        }, 1000);
    }

    collectPrice() {
        const el = document.querySelector('[class*="price"], [id*="price"]');
        if (el) {
            const price = parseFloat(el.textContent);
            if (!isNaN(price)) {
                this.priceHistory.push({price, time: Date.now()});
                if (this.priceHistory.length > 600) this.priceHistory.shift();
            }
        }
    }

    ema(period, data) {
        if (data.length < period) return null;
        const k = 2 / (period + 1);
        let ema = data[0];
        for (let i = 1; i < data.length; i++) {
            ema = data[i] * k + ema * (1 - k);
        }
        return ema;
    }

    rsi(period, closes) {
        if (closes.length < period + 1) return null;
        let gains = 0, losses = 0;
        for (let i = 1; i <= period; i++) {
            const diff = closes[i] - closes[i - 1];
            if (diff >= 0) gains += diff; else losses -= diff;
        }
        let avgGain = gains / period;
        let avgLoss = losses / period;
        for (let i = period + 1; i < closes.length; i++) {
            const diff = closes[i] - closes[i - 1];
            avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
            avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
        }
        if (avgLoss === 0) return 100;
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    macd(closes) {
        const ema12 = this.ema(12, closes);
        const ema26 = this.ema(26, closes);
        if (ema12 === null || ema26 === null) return null;
        const macdLine = ema12 - ema26;
        const signal = this.ema(9, closes.slice(closes.length - 35));
        if (signal === null) return null;
        return macdLine - signal;
    }

    stoch(kPeriod, dPeriod, closes) {
        if (closes.length < kPeriod + dPeriod) return null;
        const recent = closes.slice(-kPeriod);
        const low = Math.min(...recent);
        const high = Math.max(...recent);
        const k = ((closes[closes.length - 1] - low) / (high - low)) * 100;
        const dVals = [];
        for (let i = dPeriod; i > 0; i--) {
            const slice = closes.slice(-(kPeriod + i - 1), -i + 1);
            const lo = Math.min(...slice);
            const hi = Math.max(...slice);
            dVals.push(((slice[slice.length - 1] - lo) / (hi - lo)) * 100);
        }
        const d = dVals.reduce((a, b) => a + b, 0) / dVals.length;
        return {k, d};
    }

    atr(period, highs, lows, closes) {
        if (highs.length < period + 1) return null;
        const trs = [];
        for (let i = 1; i < highs.length; i++) {
            const high = highs[i];
            const low = lows[i];
            const prevClose = closes[i - 1];
            trs.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
        }
        let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
        for (let i = period; i < trs.length; i++) {
            atr = (atr * (period - 1) + trs[i]) / period;
        }
        return atr;
    }

    adx(period, highs, lows, closes) {
        if (highs.length < period + 2) return null;
        const plusDM = [], minusDM = [], trs = [];
        for (let i = 1; i < highs.length; i++) {
            const upMove = highs[i] - highs[i-1];
            const downMove = lows[i-1] - lows[i];
            plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
            minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
            const high = highs[i];
            const low = lows[i];
            const prevClose = closes[i-1];
            trs.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
        }
        let atr = trs.slice(0, period).reduce((a,b)=>a+b,0)/period;
        let pDM = plusDM.slice(0, period).reduce((a,b)=>a+b,0)/period;
        let mDM = minusDM.slice(0, period).reduce((a,b)=>a+b,0)/period;
        for (let i = period; i < trs.length; i++) {
            atr = (atr*(period-1)+trs[i])/period;
            pDM = (pDM*(period-1)+plusDM[i])/period;
            mDM = (mDM*(period-1)+minusDM[i])/period;
        }
        const pDI = 100 * (pDM/atr);
        const mDI = 100 * (mDM/atr);
        const dx = Math.abs(pDI - mDI) / (pDI + mDI) * 100;
        return dx;
    }

    superTrend(period, multiplier, highs, lows, closes) {
        if (highs.length < period + 1) return null;
        const atr = this.atr(period, highs, lows, closes);
        if (!atr) return null;
        const hl2 = (highs[highs.length-1] + lows[lows.length-1]) / 2;
        const finalUpper = hl2 + multiplier * atr;
        const finalLower = hl2 - multiplier * atr;
        const prevClose = closes[closes.length - 2];
        const direction = prevClose > finalUpper ? 'هبوط' : prevClose < finalLower ? 'صعود' : 'جانبي';
        return {value: direction === 'صعود' ? finalLower : finalUpper, direction};
    }

    calculateIndicators() {
        const closes = this.priceHistory.map(p => p.price);
        if (closes.length < 30) return;
        this.indicators.rsi = this.rsi(14, closes.slice(-30));
        this.indicators.macd = this.macd(closes.slice(-60));
        this.indicators.stoch = this.stoch(14, 3, closes);
        // placeholder highs/lows equal closes for simplicity
        const highs = closes;
        const lows = closes;
        this.indicators.atr = this.atr(14, highs, lows, closes);
        this.indicators.adx = this.adx(14, highs, lows, closes);
        this.indicators.super = this.superTrend(10, 3, highs, lows, closes);

        // trends by EMA cross
        this.indicators.trend30 = this.trendByEMA(9, 21, 30);
        this.indicators.trend60 = this.trendByEMA(9, 21, 60);
        this.indicators.trend300 = this.trendByEMA(9, 21, 300);
    }

    trendByEMA(fast, slow, seconds) {
        const now = Date.now();
        const subset = this.priceHistory.filter(p => now - p.time <= seconds*1000).map(p=>p.price);
        if (subset.length < slow) return null;
        const fastEma = this.ema(fast, subset);
        const slowEma = this.ema(slow, subset);
        if (fastEma > slowEma) return 'صاعد';
        if (fastEma < slowEma) return 'هابط';
        return 'جانبي';
    }

    makeDecision() {
        const ind = this.indicators;
        if (!ind.rsi || !ind.macd || !ind.stoch || !ind.super) return;
        const sameDir = ind.trend30 === ind.trend60 && ind.trend60 === ind.trend300 && ind.trend30 !== null;
        if (sameDir && ind.super.direction !== 'جانبي' && ind.adx > 20) {
            if (ind.stoch.k > ind.stoch.d && ind.rsi < 70 && ind.super.direction === 'صعود') {
                this.recommendation = {action: 'CALL', confidence: 80, expiry: '1 دقيقة'};
            } else if (ind.stoch.k < ind.stoch.d && ind.rsi > 30 && ind.super.direction === 'هبوط') {
                this.recommendation = {action: 'PUT', confidence: 80, expiry: '1 دقيقة'};
            } else {
                this.recommendation = {action: 'انتظار', confidence: 40, expiry: '2 دقائق'};
            }
        } else {
            this.recommendation = {action: 'انتظار', confidence: 20, expiry: '2 دقائق'};
        }
        this.sendToPopup();
    }

    sendToPopup() {
        chrome.runtime.sendMessage({action: 'updatePopup', data: {
            indicators: this.indicators,
            recommendation: this.recommendation,
            currentPrice: this.priceHistory.length? this.priceHistory[this.priceHistory.length-1].price: null,
            priceHistory: this.priceHistory.slice(-60)
        }});
    }
}


const assistant = new ScalpingAssistant();
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === 'getData') {
        sendResponse({
            indicators: assistant.indicators,
            recommendation: assistant.recommendation,
            currentPrice: assistant.priceHistory.length ? assistant.priceHistory[assistant.priceHistory.length-1].price : null,
            priceHistory: assistant.priceHistory.slice(-60)
        });
    }
});
