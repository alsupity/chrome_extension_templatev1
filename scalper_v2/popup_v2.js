function send(action){
    chrome.tabs.query({active:true,currentWindow:true}, tabs => {
        if(tabs[0]) chrome.tabs.sendMessage(tabs[0].id,{action},res=>update(res));
    });
}
function update(data){
    if(!data) return;
    document.getElementById('signal').textContent = `${data.signal.action} (${data.signal.confidence}%)`;
}

document.getElementById('analyze').addEventListener('click',()=>send('get'));

send('get');
