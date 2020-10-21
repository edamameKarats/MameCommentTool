const ipcRenderer = require( 'electron' ).ipcRenderer;
const fs=require('fs');
const MameCommentSettingData=require('./mameCommentSettingData');
const MameCommentConstants=require('./mameCommentConstants');
const MameCommentTwitCasting=require('./mameCommentTwitCasting');
let mameCommentTwitCasting=new MameCommentTwitCasting();
let mameCommentSettingData=new MameCommentSettingData();

let getThread;
let getId;

function boardButtonClicked(){
    ipcRenderer.send('debugLog','Board button is clicked.')
    ipcRenderer.send('debugLog','Send Board window request event to Main.')
    ipcRenderer.send( 'windowRequest', 'board' );    
}

function viewerButtonClicked(){
    ipcRenderer.send('debugLog','Viewer button is clicked.')
    ipcRenderer.send('debugLog','Send Viewer window request event to Main.')
    ipcRenderer.send( 'windowRequest', 'viewer' );    
}

function settingButtonClicked(){
    ipcRenderer.send('debugLog','Setting button is clicked.')
    ipcRenderer.send('debugLog','Send Setting window request event to Main.')
    ipcRenderer.send( 'windowRequest', 'setting' );    
}

function getButtonClicked(){
    ipcRenderer.send('debugLog','Get button is clicked.')
    if (document.getElementById('getButton').textContent==dictionary["GET_START"]){
        ipcRenderer.send('debugLog','Start to get comment.')
        var getScreen=document.getElementById('movieUserId').value;
        ipcRenderer.send('debugLog','Target user is '+getScreen+', Current user is '+document.getElementById("accountUserId").innerText+'.');
        if(getScreen!=''&&document.getElementById("accountUserId").innerText!=''){
            ipcRenderer.send('debugLog','Call Get thread.');
            getThread=new Worker('mameCommentGetThread.js');
            getThread.addEventListener('message',(message)=>{
                if(String(message.data).match(/^started,/)||message.data=='stopped') {
                    ipcRenderer.send('debugLog','Started or Stopped event received from Get thread.');
                    changeGetButton(message.data);
                }else if(String(message.data).match(/^error,/)) {
                    ipcRenderer.send('errorLog','Error message received from Get thread: '+message.data);
                }else{
                    ipcRenderer.send('debugLog','Comment data received from Get thread.');
                    ipcRenderer.send( 'notifyComment' , message.data );
                }
            });
            ipcRenderer.send('debugLog','Send data and start request to Get thread.');
            getThread.postMessage('user;'+getScreen);
            getThread.postMessage(mameCommentSettingData);
            getThread.postMessage('startRequest');
        }else{
            ipcRenderer.send('errorLog','Target user: '+getScreen + ' or, Current user: '+document.getElementById("accountUserId").innerText+' is not defined correctly.');
        }
    }else if (document.getElementById('getButton').textContent==dictionary["GET_END"]){
        ipcRenderer.send('debugLog','Stop to get.')
        getThread.postMessage('stopRequest');
    }
}

function changeGetButton(message){
    if(message.match(/^started,/)){
        document.getElementById('getButton').textContent=dictionary["GET_END"];
        getId=message.split(',')[1];
        ipcRenderer.send('getStarted',getId);
    }else if(message=='stopped'){
        console.log('change to start.');
        document.getElementById('getButton').textContent=dictionary["GET_START"];
        ipcRenderer.send('getStopped','');
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
        document.getElementById("BOARD_").innerText=dictionary["BOARD_CLOSE"];
    }else if(message=='boardClosed'){
        console.log('Board is closed.');
        document.getElementById('boardButton').classList.remove('push');
        document.getElementById("BOARD_").innerText=dictionary["BOARD_OPEN"];
    }else if(message=='viewerOpened'){
        console.log('Viewer is opened.');
        document.getElementById('viewerButton').classList.add('push');
        document.getElementById("VIEWER_").innerText=dictionary["VIEWER_CLOSE"];
    }else if(message=='viewerClosed'){
        console.log('Viewer is closed.');
        document.getElementById('viewerButton').classList.remove('push');
        document.getElementById("VIEWER_").innerText=dictionary["VIEWER_OPEN"];
    }else if(message=='settingOpened'){
        console.log('Setting is opened.');
        document.getElementById('settingButton').classList.add('push');
        document.getElementById("SETTING_").innerText=dictionary["SETTING_CLOSE"];
    }else if(message=='settingClosed'){
        console.log('Setting is closed.');
        document.getElementById('settingButton').classList.remove('push');
        document.getElementById("SETTING_").innerText=dictionary["SETTING_OPEN"];
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

//POSTリクエストを受信
ipcRenderer.on('postRequest',(ev,message)=>{
    console.log('post request received.');
    mameCommentTwitCasting.postCommentData(getId,message,'none',mameCommentSettingData.tokenId);
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
