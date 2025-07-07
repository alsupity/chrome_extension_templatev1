// Scalper Pro - redesigned content script
class ScalperPro {
  constructor() {
    this.priceHistory = [];
    this.currentPrice = null;
    this.indicators = {};
    this.monitor = null;
    this.panel = null;
    this.init();
  }

  init() {
    this.injectHelper();
    this.setupListeners();
    if (document.readyState !== 'loading') this.start();
    else document.addEventListener('DOMContentLoaded', () => this.start());
  }

  injectHelper() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = function() { this.remove(); };
    (document.head || document.documentElement).appendChild(script);
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'PO_PRICE_UPDATE') {
        this.handlePriceData(e.data.data);
      }
    });
  }

  start() {
    this.monitor = setInterval(() => {
      window.postMessage({ type: 'PO_GET_DATA' }, '*');
    }, 1000);
  }

  setupListeners() {
    chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
      switch (req.action) {
        case 'getData':
          sendResponse(this.getCurrentData());
          break;
        case 'analyze':
          this.analyze();
          sendResponse(this.getCurrentData());
          break;
        case 'showPanel':
          this.showPanel();
          sendResponse({ success: true });
          break;
        case 'hidePanel':
          if (this.panel) this.panel.remove();
          this.panel = null;
          sendResponse({ success: true });
          break;
        default:
          break;
      }
    });
  }

  handlePriceData(data) {
    if (!data || !data.currentPrice) return;
    this.currentPrice = data.currentPrice;
    if (Array.isArray(data.priceHistory)) this.priceHistory = data.priceHistory;
    else this.priceHistory.push({ price: data.currentPrice, timestamp: Date.now() });
    this.analyze();
  }

  analyze() {
    if (this.priceHistory.length < 5) return;
    this.calculateIndicators();
    this.generateSignals();
    if (this.panel) this.updatePanel();
    chrome.runtime.sendMessage({ action: 'updatePopup', data: this.getCurrentData() });
  }

  calculateIndicators() {
    this.calcStochastic();
    this.calcEMA();
    this.calcKeltner();
    this.calcATR();
    this.calcADX();
    this.calcSuperTrend();
    this.calcAroon();
    this.calcTrends();
  }

  calcEMA(period=9) {
    const prices = this.priceHistory.map(p=>p.price);
    if (prices.length < period) { this.indicators.ema = null; return; }
    let ema = prices.slice(0, period).reduce((a,b)=>a+b,0)/period;
    const k = 2/(period+1);
    for (let i=period;i<prices.length;i++) ema = prices[i]*k + ema*(1-k);
    this.indicators.ema = ema;
  }

  calcATR(period=14) {
    if (this.priceHistory.length < period+1) { this.indicators.atr=null; return; }
    const trs=[];
    for(let i=this.priceHistory.length-period;i<this.priceHistory.length;i++){
      const cur=this.priceHistory[i].price;
      const prev=this.priceHistory[i-1].price;
      trs.push(Math.abs(cur-prev));
    }
    this.indicators.atr = trs.reduce((a,b)=>a+b,0)/trs.length;
  }

  calcADX(period=14) {
    if (this.priceHistory.length < period+1) { this.indicators.adx=null; return; }
    const up=[]; const down=[]; const trs=[];
    for(let i=this.priceHistory.length-period;i<this.priceHistory.length;i++){
      const cur=this.priceHistory[i].price;
      const prev=this.priceHistory[i-1].price;
      up.push(Math.max(cur-prev,0));
      down.push(Math.max(prev-cur,0));
      trs.push(Math.abs(cur-prev));
    }
    const plusDI=up.reduce((a,b)=>a+b,0)/trs.reduce((a,b)=>a+b,0)*100;
    const minusDI=down.reduce((a,b)=>a+b,0)/trs.reduce((a,b)=>a+b,0)*100;
    const dx=Math.abs(plusDI-minusDI)/(plusDI+minusDI)*100;
    this.indicators.adx=dx;
  }

  calcStochastic(period=14) {
    if (this.priceHistory.length < period) { this.indicators.stoch=null; return; }
    const recent=this.priceHistory.slice(-period);
    const high=Math.max(...recent.map(p=>p.price));
    const low=Math.min(...recent.map(p=>p.price));
    const close=this.currentPrice;
    const k=(close-low)/(high-low)*100;
    const prev=this.indicators.stoch?this.indicators.stoch.k:50;
    const d=(prev+k)/2;
    this.indicators.stoch={k,d};
  }

  calcKeltner(period=20,mult=1.5) {
    if (this.priceHistory.length < period+1 || !this.indicators.atr) { this.indicators.kc=null; return; }
    const prices=this.priceHistory.map(p=>p.price);
    let ema=prices.slice(0,period).reduce((a,b)=>a+b,0)/period;
    const k=2/(period+1);
    for(let i=period;i<prices.length;i++) ema=prices[i]*k+ema*(1-k);
    const upper=ema+mult*this.indicators.atr;
    const lower=ema-mult*this.indicators.atr;
    this.indicators.kc={upper,lower,center:ema};
  }

  calcSuperTrend(period=10,mult=3) {
    if (!this.indicators.atr) { this.indicators.super=null; return; }
    const prices=this.priceHistory.map(p=>p.price);
    const ema=this.calcEMA(period) || this.indicators.ema;
    const upper=ema+mult*this.indicators.atr;
    const lower=ema-mult*this.indicators.atr;
    let direction=this.indicators.super?this.indicators.super.direction:'side';
    if (this.currentPrice>upper) direction='up';
    else if (this.currentPrice<lower) direction='down';
    this.indicators.super={direction,upper,lower};
  }

  calcAroon(period=14) {
    if (this.priceHistory.length < period) { this.indicators.aroon=null; return; }
    const recent=this.priceHistory.slice(-period);
    const highs=recent.map(p=>p.price);
    const lows=recent.map(p=>p.price);
    const highIndex=highs.indexOf(Math.max(...highs));
    const lowIndex=lows.indexOf(Math.min(...lows));
    const aroonUp=((period-1-highIndex)/(period-1))*100;
    const aroonDown=((period-1-lowIndex)/(period-1))*100;
    this.indicators.aroon={up:aroonUp,down:aroonDown};
  }

  calcTrends() {
    this.indicators.trendMicro=this.computeTrend(30);
    this.indicators.trendShort=this.computeTrend(60);
    this.indicators.trendMedium=this.computeTrend(300);
  }

  computeTrend(seconds) {
    const from=Date.now()-seconds*1000;
    const subset=this.priceHistory.filter(p=>p.timestamp>=from);
    if (subset.length<2) return 'side';
    const first=subset[0].price;
    const last=subset[subset.length-1].price;
    const change=(last-first)/first*100;
    if (change>0.01) return 'up';
    if (change<-0.01) return 'down';
    return 'side';
  }

  generateSignals() {
    this.signals=[];
    if (!this.indicators.stoch || !this.indicators.super || !this.indicators.adx) return;
    if (this.indicators.stoch.k<20 && this.indicators.super.direction==='up' && this.indicators.adx>20) {
      this.signals.push({type:'CALL',confidence:80});
    } else if (this.indicators.stoch.k>80 && this.indicators.super.direction==='down' && this.indicators.adx>20) {
      this.signals.push({type:'PUT',confidence:80});
    }
  }

  suggestExpiry() {
    if (!this.indicators.atr) return '2 دقائق';
    return this.indicators.atr>0.0005 ? '1 دقيقة' : '2 دقائق';
  }

  getCurrentData() {
    return {
      currentPrice: this.currentPrice,
      priceHistory: this.priceHistory,
      indicators: this.indicators,
      signals: this.signals,
      recommendation: this.signals[0] ? { action: this.signals[0].type, confidence: this.signals[0].confidence, expiry: this.suggestExpiry() } : { action:'انتظار', confidence:0, expiry:'--' }
    };
  }

  showPanel() {
    if (this.panel) return;
    this.panel=document.createElement('div');
    this.panel.id='scalper-panel';
    this.panel.style.cssText='position:fixed;top:50px;right:20px;background:#fff;padding:10px;border:1px solid #ccc;z-index:10000;';
    this.panel.innerHTML='<div id="scalper-signal">انتظار</div>';
    document.body.appendChild(this.panel);
  }

  updatePanel() {
    if (!this.panel) return;
    const sig=this.signals[0];
    document.getElementById('scalper-signal').textContent=sig?sig.type+ ' ('+sig.confidence+'%)':'انتظار';
  }
}

new ScalperPro();
