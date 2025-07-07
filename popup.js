// Simple popup controller for new Scalping Assistant
class PopupController {
    constructor() {
        this.updateInterval = null;
        document.getElementById('analyzeBtn').addEventListener('click', () => this.requestData());
        this.requestData();
        this.updateInterval = setInterval(() => this.requestData(), 5000);
        chrome.runtime.onMessage.addListener((req) => {
            if (req.action === 'updatePopup') this.render(req.data);
        });
    }

    requestData() {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (!tabs[0]) return;
            chrome.tabs.sendMessage(tabs[0].id, {action: 'getData'}, (resp) => {
                if (resp) this.render(resp);
            });
        });
    }

    render(data) {
        if (!data) return;
        const rec = data.recommendation;
        document.getElementById('signalDirection').textContent = rec.action;
        document.getElementById('signalConfidence').textContent = rec.confidence.toFixed(0)+'%';
        document.getElementById('signalExpiry').textContent = rec.expiry;
        const ind = data.indicators || {};
        const assign = (id,val) => {
            const el=document.getElementById(id); if(el) el.textContent=val??'--';
        };
        assign('rsiVal', ind.rsi?.toFixed(1));
        assign('macdVal', ind.macd?.toFixed(5));
        assign('stochVal', ind.stoch?ind.stoch.k.toFixed(1)+'/'+ind.stoch.d.toFixed(1):'--');
        assign('adxVal', ind.adx?.toFixed(1));
        assign('atrVal', ind.atr?.toFixed(5));
        assign('bbWidth', ind.bb?ind.bb.width.toFixed(3):'--');
        assign('vortexVal', ind.vortex?ind.vortex.plus.toFixed(2)+'/'+ind.vortex.minus.toFixed(2):'--');
        assign('aroonVal', ind.aroon?ind.aroon.up.toFixed(1)+'/'+ind.aroon.down.toFixed(1):'--');
        assign('superVal', ind.super?ind.super.direction:'--');
        assign('trend20', ind.trend20);
        assign('trend60', ind.trend60);
        assign('trend120', ind.trend120);
    }
}

document.addEventListener('DOMContentLoaded', () => new PopupController());
