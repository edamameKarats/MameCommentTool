const fs = require('fs');
const MameCommentSettingData=require('./mameCommentSettingData');
const { Accelerator } = require('electron');
const ipcRenderer = require( 'electron' ).ipcRenderer;

let mameCommentSettingData=new MameCommentSettingData();

function save(){
    console.log('close with save.');
    saveValueToSettingData();
    mameCommentSettingData.copyUrlToToken();
    mameCommentSettingData.writeToIni();
    //メインに設定情報を送る
    ipcRenderer.send('settingUpdate',mameCommentSettingData);
    //ウインドウを閉じる
    self.close();
}

function cansel(){
    console.log('close without save.');
    //ウインドウを閉じる
    self.close();
}

function regist(){
    console.log('regist token.');
    ipcRenderer.send('windowRequest','regist');
}

function setValueFromSettingData(){
    console.log('set from SettingData.');
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
    console.log('save to SettingData.');
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
console.log('send settingReady event.');
ipcRenderer.send('settingReady','');

//準備完了後、メインから設定情報が飛んできたら反映する
ipcRenderer.on('settingUpdate',(ev,message)=>{
    console.log('setting update');
    mameCommentSettingData.setFromJson(message);
    setValueFromSettingData();
});

//登録画面からメインを通じてURL情報が飛んできたら設定する
ipcRenderer.on('tokenUrlInfo', (ev,message)=>{
    document.getElementById('replyUrl').value=message;
});

