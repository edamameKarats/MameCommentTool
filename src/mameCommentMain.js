const ipcRenderer = require( 'electron' ).ipcRenderer;
const dialog = require('electron').remote.dialog;
const fs=require('fs');
const MameCommentSettingData=require('./mameCommentSettingData');
const MameCommentConstants=require('./mameCommentConstants');
const MameCommentTwitCasting=require('./mameCommentTwitCasting');
let mameCommentTwitCasting=new MameCommentTwitCasting();
let mameCommentSettingData=new MameCommentSettingData();

let getThread;

function boardButtonClicked(){
    console.log('Board button clicked.');
    ipcRenderer.send( 'windowRequest', 'board' );    
}

function viewerButtonClicked(){
    console.log('Viewer button clicked.');
    ipcRenderer.send( 'windowRequest', 'viewer' );    
}

function settingButtonClicked(){
    console.log('Setting button clicked.');
    ipcRenderer.send( 'windowRequest', 'setting' );    
}

function getButtonClicked(){
    console.log('Get button clicked. ');
    if (document.getElementById('getButton').textContent==dictionary["GET_START"]){
        getThread=new Worker('mameCommentGetThread.js');
        getThread.addEventListener('message',(message)=>{
            if(message.data=='started'||message.data=='stopped') {
                changeGetButton(message.data);
            }else if(String(message.data).match(/^error,/)) {
                console.log(message.data);
            }else{
                ipcRenderer.send( 'notifyComment' , message.data );
            }
        });
        getThread.postMessage('user;'+document.getElementById('movieUserId').value);
        getThread.postMessage(mameCommentSettingData);
        getThread.postMessage('startRequest');
    }else if (document.getElementById('getButton').textContent==dictionary["GET_END"]){
        getThread.postMessage('stopRequest');
    }
}

function changeGetButton(message){
    if(message=='started'){
        document.getElementById('getButton').textContent=dictionary["GET_END"];
    }else if(message=='stopped'){
        console.log('change to start.');
        document.getElementById('getButton').textContent=dictionary["GET_START"];
    }else{
        //コメント送信
        ipcRenderer.send('notifyComment',message);
    }
}

//ウインドウ系のイベント
ipcRenderer.on('windowResponse',(ev,message)=>{
    if(message=='boardOpened'){
        console.log('Board is opened.');
        document.getElementById('boardButton').classList.add('push');
    }else if(message=='boardClosed'){
        console.log('Board is closed.');
        document.getElementById('boardButton').classList.remove('push');
    }else if(message=='viewerOpened'){
        console.log('Viewer is opened.');
        document.getElementById('viewerButton').classList.add('push');
    }else if(message=='viewerClosed'){
        console.log('Viewer is closed.');
        document.getElementById('viewerButton').classList.remove('push');
    }else if(message=='settingOpened'){
        console.log('Setting is opened.');
        document.getElementById('settingButton').classList.add('push');
    }else if(message=='settingClosed'){
        console.log('Setting is closed.');
        document.getElementById('settingButton').classList.remove('push');
    }
});

//設定情報の更新要求を受信
ipcRenderer.on('settingUpdate',(ev,message)=>{
    console.log('update received');
    var tokenChangeFlg=0;
    if (mameCommentSettingData.tokenId != message.tokenId) tokenChangeFlg=1;
    mameCommentSettingData.setFromJson(message);
    //token情報が更新されている場合、ユーザー情報を取り直す
    if(tokenChangeFlg==1){
        //ユーザー情報の取得
        var userData=mameCommentTwitCasting.getSelfData(mameCommentSettingData.tokenId);
        document.getElementById("accountUserName").innerText=userData[0];
        document.getElementById("accountUserId").innerText=userData[1];
        document.getElementById("accountImage").src=userData[2];
    }
});


//ここからは起動時に実行される処理
//TODO いずれはここで言語によって切り替えたい(切り替えるときは再起動前提)
const dictionary =require('./dictionary/ja');
document.getElementById("ACCOUNT_INFO").innerText=dictionary["ACCOUNT_INFO"];
document.getElementById("USERNAME").innerText=dictionary["USERNAME"];
document.getElementById("USERID").innerText=dictionary["USERID"];
document.getElementById("GET_INFO").innerText=dictionary["GET_INFO"];
document.getElementById("GET_USERID").innerText=dictionary["USERID"];
document.getElementById("GET_").innerText=dictionary["GET_START"];
document.getElementById("BOARD_").innerText=dictionary["BOARD_OPEN"];
document.getElementById("VIEWER_").innerText=dictionary["VIEWER_OPEN"];
document.getElementById("SETTING_").innerText=dictionary["SETTING_OPEN"];


//準備完了を通知
console.log('send mainReady event.');
ipcRenderer.send('mainReady','');
