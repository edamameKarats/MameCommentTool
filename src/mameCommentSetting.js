const fs = require('fs');
const MameCommentSettingData=require('./mameCommentSettingData');
const { Accelerator } = require('electron');
const ipcRenderer = require( 'electron' ).ipcRenderer;

let mameCommentSettingData=new MameCommentSettingData();

//TODO いずれはここで言語によって切り替えたい(切り替えるときは再起動前提)
const dictionary =require('./dictionary/ja');
document.getElementById("SAVE").innerText=dictionary["SAVE"];
document.getElementById("CANSEL").innerText=dictionary["CANSEL"];

//WindowsとMacでフォントが違うのでサイズ指定
document.getElementById("SAVE").style.fontSize='13px';
document.getElementById("CANSEL").style.fontSize='13px';


function save(){
    ipcRenderer.send('debugLog','Close with save.');
    saveValueToSettingData();
    mameCommentSettingData.copyUrlToToken();
    mameCommentSettingData.writeToIni();
    //メインに設定情報を送る
    ipcRenderer.send('debugLog','Send setting update event to main.');
    ipcRenderer.send('settingUpdate',mameCommentSettingData);
    //ウインドウを閉じる
    self.close();
}

function cansel(){
    ipcRenderer.send('debugLog','Close without save.');
    //ウインドウを閉じる
    self.close();
}

function regist(){
    ipcRenderer.send('debugLog','Regist token. Send window request event to main.');
    ipcRenderer.send('windowRequest','regist');
}

function setValueFromSettingData(){
    ipcRenderer.send('debugLog','Set values from setting data.');
    document.getElementById('replyUrl').value=mameCommentSettingData.replyUrl;
    if (mameCommentSettingData.logFlg=='true'){
        document.getElementById('logCheckBox').checked=true;
    }else{
        document.getElementById('logCheckBox').checked=false;
    }
    document.getElementById('logPath').value=mameCommentSettingData.logPath;
    document.getElementById('boardX').value=mameCommentSettingData.boardX;
    document.getElementById('boardY').value=mameCommentSettingData.boardY;
    document.getElementById('boardWidth').value=mameCommentSettingData.boardWidth;
    document.getElementById('boardHeight').value=mameCommentSettingData.boardHeight;
    document.getElementById('boardLineNum').value=mameCommentSettingData.boardLineNum;
    document.getElementById('boardFontColor').value=mameCommentSettingData.boardFontColor;
    document.getElementById('boardBackgroundColor').value=mameCommentSettingData.boardBackgroundColor;
    document.getElementById('viewerX').value=mameCommentSettingData.viewerX;
    document.getElementById('viewerY').value=mameCommentSettingData.viewerY;
    document.getElementById('viewerWidth').value=mameCommentSettingData.viewerWidth;
    document.getElementById('viewerHeight').value=mameCommentSettingData.viewerHeight;
}

function saveValueToSettingData(){
    ipcRenderer.send('debugLog','Save vaues to setting data.');
    mameCommentSettingData.replyUrl=document.getElementById('replyUrl').value;
    mameCommentSettingData.copyUrlToToken();
    mameCommentSettingData.logFlg=document.getElementById('logCheckBox').checked;
    mameCommentSettingData.logPath=document.getElementById('logPath').value;
    mameCommentSettingData.boardX=document.getElementById('boardX').value;
    mameCommentSettingData.boardY=document.getElementById('boardY').value;
    mameCommentSettingData.boardWidth=document.getElementById('boardWidth').value;
    mameCommentSettingData.boardHeight=document.getElementById('boardHeight').value;
    mameCommentSettingData.boardLineNum=document.getElementById('boardLineNum').value;
    mameCommentSettingData.boardFontColor=document.getElementById('boardFontColor').value;
    mameCommentSettingData.boardBackgroundColor=document.getElementById('boardBackgroundColor').value;
    mameCommentSettingData.viewerX=document.getElementById('viewerX').value;
    mameCommentSettingData.viewerY=document.getElementById('viewerY').value;
    mameCommentSettingData.viewerWidth=document.getElementById('viewerWidth').value;
    mameCommentSettingData.viewerHeight=document.getElementById('viewerHeight').value;
}

//準備完了を通知
ipcRenderer.send('debugLog','Send setting ready event to main.');
ipcRenderer.send('settingReady','');

//準備完了後、メインから設定情報が飛んできたら反映する
ipcRenderer.on('settingUpdate',(ev,message)=>{
    ipcRenderer.send('debugLog','Setting update event received.');
    mameCommentSettingData.setFromJson(message);
    setValueFromSettingData();
});

//登録画面からメインを通じてURL情報が飛んできたら設定する
ipcRenderer.on('tokenUrlInfo', (ev,message)=>{
    ipcRenderer.send('debugLog','Token info event received.');
    document.getElementById('replyUrl').value=message;
});

