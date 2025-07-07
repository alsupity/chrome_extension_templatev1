// PocketOption Scalper V2 - Content Script

class ScalperV2 {
    constructor() {
        this.priceHistory = [];
        this.indicators = {};
        this.panel = null;
        window.scalperV2 = this;
        this.start();
    }

    start() {
        this.createPanel();
        this.collectLoop = setInterval(() => this.collectPrice(), 1000);
    }

    collectPrice() {
        let price = this.readPrice();
        if (!price) return;
        const now = Date.now();
        this.priceHistory.push({ price, time: now });
        if (this.priceHistory.length > 1000) this.priceHistory.shift();
        this.calculateIndicators();
        this.updatePanel();
    }

    readPrice() {
        // محاولة الحصول على السعر من عنصر معروف في الصفحة
        const el = document.querySelector('.price-value, .price, [data-price]');
        if (el) {
            const p = parseFloat(el.textContent.replace(/[^0-9.]/g, ''));
            if (!isNaN(p)) return p;
        }
        return null;
    }

    calculateIndicators() {
        const prices = this.priceHistory.map(p => p.price);
        this.indicators.rsi = this.calcRSI(prices, 14);
        const { macd, signal } = this.calcMACD(prices);
        this.indicators.macd = macd;
        this.indicators.macdSignal = signal;
        this.indicators.stoch = this.calcStoch(prices, 14);
        this.indicators.emaFast = this.ema(prices, 5);
        this.indicators.emaSlow = this.ema(prices, 20);
        this.indicators.emaCross = this.indicators.emaFast > this.indicators.emaSlow ? 'CALL' : 'PUT';
        this.indicators.atr = this.calcATR(prices, 14);
        this.indicators.adx = this.calcADX(prices, 14);
        this.indicators.super = this.calcSuperTrend(prices, 10, 3);
        this.indicators.trend1 = this.trendForPeriod(60);
        this.indicators.trend5 = this.trendForPeriod(300);
        this.indicators.trend15 = this.trendForPeriod(900);
        this.indicators.signal = this.buildSignal();
    }

    ema(data, period) {
        if (data.length < period) return 0;
        let k = 2 / (period + 1);
        let ema = data.slice(0, period).reduce((a,b)=>a+b,0) / period;
        for (let i = period; i < data.length; i++) {
            ema = data[i] * k + ema * (1 - k);
        }
        return ema;
    }

    calcRSI(data, period) {
        if (data.length < period + 1) return 0;
        let gains = 0, losses = 0;
        for (let i = data.length - period; i < data.length; i++) {
            let diff = data[i] - data[i - 1];
            if (diff >= 0) gains += diff; else losses -= diff;
        }
        if (losses === 0) return 100;
        const rs = gains / period / (losses / period);
        return 100 - 100 / (1 + rs);
    }

    calcMACD(data, fast=12, slow=26, sig=9) {
        if (data.length < slow + sig) return { macd:0, signal:0 };
        const emaFast = this.ema(data, fast);
        const emaSlow = this.ema(data, slow);
        const macdLine = emaFast - emaSlow;
        const macdHist = [];
        let emaF = data[0], emaS = data[0];
        const kF = 2 / (fast + 1), kS = 2 / (slow + 1);
        for (let i = 1; i < data.length; i++) {
            emaF = data[i]*kF + emaF*(1-kF);
            emaS = data[i]*kS + emaS*(1-kS);
            macdHist.push(emaF - emaS);
        }
        const signal = this.ema(macdHist, sig);
        return { macd: macdLine - signal, signal };
    }

    calcStoch(data, period) {
        if (data.length < period) return {k:0,d:0};
        const recent = data.slice(-period);
        const high = Math.max(...recent);
        const low = Math.min(...recent);
        const close = data[data.length-1];
        const k = 100*((close - low)/(high - low));
        this.stochHist = this.stochHist || [];
        this.stochHist.push(k); if (this.stochHist.length > 3) this.stochHist.shift();
        const d = this.stochHist.reduce((a,b)=>a+b,0)/this.stochHist.length;
        return {k,d};
    }

    calcATR(data, period) {
        if (data.length < period + 1) return 0;
        const trs=[];
        for(let i=data.length-period;i<data.length;i++){
            trs.push(Math.abs(data[i]-data[i-1]));
        }
        return trs.reduce((a,b)=>a+b,0)/trs.length;
    }

    calcADX(data, period) {
        if (data.length < period + 1) return 0;
        const dxs=[];
        for(let i=data.length-period;i<data.length;i++){
            const up = data[i]-data[i-1];
            const down = data[i-1]-data[i];
            const tr = Math.abs(data[i]-data[i-1]);
            const plus = up>down&&up>0?up:0;
            const minus = down>up&&down>0?down:0;
            const plusDI = (plus/tr)*100;
            const minusDI = (minus/tr)*100;
            const dx = Math.abs(plusDI-minusDI)/(plusDI+minusDI)*100;
            if(!isNaN(dx)) dxs.push(dx);
        }
        return dxs.reduce((a,b)=>a+b,0)/dxs.length;
    }

    calcSuperTrend(data, period, mult) {
        const atr = this.calcATR(data, period);
        if (!atr) return 'SIDE';
        const ema = this.ema(data, period);
        const upper = ema + mult*atr;
        const lower = ema - mult*atr;
        const price = data[data.length-1];
        if (price > upper) return 'UP';
        if (price < lower) return 'DOWN';
        return 'SIDE';
    }

    trendForPeriod(seconds) {
        const cutoff = Date.now() - seconds*1000;
        const subset = this.priceHistory.filter(p => p.time >= cutoff);
        if (subset.length < 2) return 'SIDE';
        const change = (subset[subset.length-1].price - subset[0].price)/subset[0].price;
        if (change > 0.001) return 'UP';
        if (change < -0.001) return 'DOWN';
        return 'SIDE';
    }

    buildSignal() {
        const {trend1,trend5,trend15,adx,super:superDir,emaCross,stoch,rsi} = this.indicators;
        if (adx > 25 && superDir !== 'SIDE' && trend1===trend5 && trend5===trend15 && trend1!== 'SIDE') {
            if (emaCross === 'CALL' && stoch.k < 20 && rsi < 30) return {action:'CALL',confidence:80};
            if (emaCross === 'PUT' && stoch.k > 80 && rsi > 70) return {action:'PUT',confidence:80};
        }
        return {action:'WAIT',confidence:0};
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.style.cssText = 'position:fixed;top:60px;right:10px;background:#fff;padding:10px;border:1px solid #ccc;z-index:9999;font-size:12px;direction:rtl;font-family:sans-serif';
        this.panel.innerHTML = `<div id="sv2-signal">جاري التحميل...</div>`;
        document.body.appendChild(this.panel);
    }

    updatePanel() {
        if (!this.panel) return;
        const sig = this.indicators.signal;
        this.panel.innerHTML = `
            <div>السعر: ${this.priceHistory[this.priceHistory.length-1].price.toFixed(5)}</div>
            <div>RSI: ${this.indicators.rsi.toFixed(2)}</div>
            <div>MACD: ${this.indicators.macd.toFixed(4)}</div>
            <div>Stoch: ${this.indicators.stoch.k.toFixed(1)}/${this.indicators.stoch.d.toFixed(1)}</div>
            <div>Trend1m: ${this.indicators.trend1}</div>
            <div>Trend5m: ${this.indicators.trend5}</div>
            <div>Trend15m: ${this.indicators.trend15}</div>
            <div>Signal: ${sig.action} (${sig.confidence}%)</div>`;
    }
}

new ScalperV2();


chrome.runtime.onMessage.addListener((req,sender,sendResponse)=>{
    if(req.action==='get' && window.scalperV2){
        sendResponse({signal:window.scalperV2.indicators.signal||{action:'WAIT',confidence:0}});
    }
});
