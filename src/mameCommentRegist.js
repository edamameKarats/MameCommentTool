const ipcRenderer = require( 'electron' ).ipcRenderer;

function handleEvent(event){
    var webView=document.getElementById('foo');
    if(webView.getURL().match('^http://localhost:8080*')){
        ipcRenderer.send('tokenUrlInfo',webView.getURL());
        self.close();
    }
}

var webview_wrapper = document.getElementById('webview_wrapper');
var url = 'https://apiv2.twitcasting.tv/oauth2/authorize?client_id=2671027374.f688b31afb4ae712724112e8ff419ae4c376a54f35f762bc047403ef6e56918d&response_type=token';
var newWebview = document.createElement('webview');
newWebview.id = 'foo';
newWebview.setAttribute('src',url);
newWebview.addEventListener('did-finish-load',handleEvent,false);
webview_wrapper.appendChild(newWebview);