const {app, BrowserWindow, ipcRenderer, dialog} = require('electron');
const ipcMain = require( 'electron' ).ipcMain;
const MameCommentSettingData=require('./mameCommentSettingData');
const MameCommentConstants=require('./mameCommentConstants');
const MameCommentCommon=require('./mameCommentCommon');

let mameCommentCommon=new MameCommentCommon();

//デバッグフラグ
let debugFlg='ON';
//let debugFlg='OFF';

//各ウインドウを定義
let mainWindow=null;
let boardWindow=null;
let viewerWindow=null;
let settingWindow=null;
let registWindow=null;

//GETステータスフラグを定義
let getFlag=0;
//GETしているmovie_idを定義
let movie_id;

//各ウインドウの開閉フラグを定義
let mainWindowFlag=0;
let boardWindowFlag=0;
let viewerWindowFlag=0;
let settingWindowFlag=0;

//各ログのファイルディスクリプタ
let logFd;
let commentFd;


//設定クラスの作成と、初期読み込みをここで実行
let mameCommentSettingData=new MameCommentSettingData();
mameCommentSettingData.readFromIni();

//操作用ログを開く
logFd=mameCommentCommon.openLog('mameCommentLog.log','w');
writeInfoLog('[main process] Initial setting load process completed.');

//準備ができたらウインドウを開く
app.on('ready', createMainWindow);

//MacOSでもプロセスを残したりしないできれいに終了させるようにする
app.on('window-all-closed', function(){
  app.quit();
})

//設定クラスの変更をどこかから受け取ったら、別のウインドウに渡す
ipcMain.on( 'settingUpdate', ( ev, message ) => {
  src=ev.sender.webContents.history[0].split('/').pop();
  mameCommentSettingData.setFromJson(message);
  mameCommentSettingData.writeToIni();
  mameCommentSettingData.readFromIni();
  //設定クラスの変更をOpenしている各クラスに通知する
  if(mainWindowFlag==1&&src!="mameCommentMain.html"){
    mainWindow.webContents.send('settingUpdate',mameCommentSettingData);
  }
  if(boardWindowFlag==1&&src!="mameCommentBoard.html"){
    boardWindow.webContents.send('settingUpdate',mameCommentSettingData);
  }
  if(viewerWindowFlag==1&&src!="mameCommentViewer.html"){
    viewerWindow.webContents.send('settingUpdate',mameCommentSettingData);
  }
  if(settingWindowFlag==1&&src!="mameCommentSetting.html"){
    settingWindow.webContents.send('settingUpdate',mameCommentSettingData);
  }
});

//メインウインドウから開いた通知を受信したときの動作
ipcMain.on('mainReady', (ev,message)=>{
  //メインウインドウが無事開けたので、フラグをONにする
  writeInfoLog('[main process] MainWindow ready event received.');
  mainWindowFlag=1;
  //メインウインドウに設定情報を渡す
  writeDebugLog('[main process] Send update event to MainWindow.');
  mainWindow.webContents.send('settingUpdate',mameCommentSettingData);
});


//メインウインドウからウインドウに関するイベントを受信したときの動作
ipcMain.on( 'windowRequest', ( ev, message ) => {
  writeDebugLog('[main process] Window event received.');
  //ボードに関する要求のとき
  if(message=='board'){
    writeDebugLog('[main process] This is board event.');
    //ボードが開いていない場合は、開く
    if(boardWindowFlag==0){
      writeInfoLog('[main process] Board is not opened. Open window.');
      createBoardWindow();
    }
    //開いている場合は閉じる
    else{
      writeInfoLog('[main process] Board is opened. Close window.');
      closeBoardWindow();
    }
  }
  //ビューワーに関する要求のとき
  else if(message=='viewer'){
    writeDebugLog('[main process] This is viewer event.');
    //ビューワーが開いていない場合は、開く
    if(viewerWindowFlag==0){
      writeInfoLog('[main process] Viewer is not opened. Open window.');
      createViewerWindow();
    }
    //開いている場合は閉じる
    else{
      writeInfoLog('[main process] Viewer is opened. Close window.');
      closeViewerWindow();
    }
  }
  //設定に関する要求のとき
  else if(message=='setting'){
    writeDebugLog('[main process] This is setting event.');
    //設定が開いていない場合は、開く
    if(settingWindowFlag==0){
      writeInfoLog('[main process] Setting is not opened. Open window.');
      createSettingWindow();
    }
    //開いている場合は閉じる
    else{
      writeInfoLog('[main process] Setting is opened. Close window.');
      closeSettingWindow();
    }
  }
  //登録に関する要求のとき
  else if(message=='regist'){
    writeInfoLog('[main process] This is registration event. Open window.');
    //複数開いてもいいことにする
    createRegistWindow();
  }
});

//ボードウインドウから、ボードの最前面表示に関するリクエストを受けたときの動作
ipcMain.on( 'topRequest', ( ev, message )=>{
  writeInfoLog('[main process] Board window on top event received.');
    //trueのメッセージなら最前面表示ON、そうでなければOFFにする
  if(message==true){
    writeDebugLog('[main process] Request is true.');
    boardWindow.setAlwaysOnTop(true);
  }else{
    writeDebugLog('[main process] Request is false.');
    boardWindow.setAlwaysOnTop(false);
  }
});

//ワーカースレッドから、開始した連絡を受けたらフラグを立てる
ipcMain.on( 'getStarted', (ev, message)=>{
  writeInfoLog('[main process] Worker started event received.');
  getFlag=1;
  movie_id=message;
  writeDebugLog('[main process] Worker is working with '+movie_id);
  //ログフラグがONならログファイルを開く
  if(mameCommentSettingData.logFlg==true&&mameCommentSettingData.logPath!=''){
    writeInfoLog('[main process] Log flg is ON. Open comment log file.');
    commentFd=mameCommentCommon.openLog(mameCommentSettingData.logPath,'w');
  }
});

//ワーカースレッドから、開始した連絡を受けたらフラグを消す
ipcMain.on( 'getStopped', (ev, message)=>{
  writeInfoLog('[main process] Worker stopped event received.');
  //ログフラグがONならログファイルを閉じる ワーカーがいきなり止まった時はきちんとスキップできるようにする
  if(mameCommentSettingData.logFlg==true&&mameCommentSettingData.logPath!=''&&getFlag==1){
    writeInfoLog('[main process] Log flg is ON. Close comment log file.');
    mameCommentCommon.closeLog(commentFd);
  }
  getFlag=0;
  movie_id='';
});


//ワーカースレッドから、コメントを取得した連絡を受けたときの動作
ipcMain.on ( 'notifyComment', (ev, message)=>{
  writeDebugLog('[main process] Notfy comment event from worker received.');
  //メッセージが配列で送られてくる
  //形式：[[slice_id,created,user_image,name,message,screen_id],[],...]
  //TODO ログがONの場合は、配列をそのままログ出力関数に投げる
  if(mameCommentSettingData.logFlg==true&&mameCommentSettingData.logPath!=''){
    writeDebugLog('[main process] Log flag is on. Write comment log.');
    writeCommentArray(message);
  }
  //ボードが開いている場合は、配列をそのまま投げる
  if(boardWindowFlag==1){
    writeDebugLog('[main process] Board window is opend. Send comment to Board.');
    boardWindow.webContents.send('notifyComment',message);
  }
  //ビューワーが開いている場合は、配列をそのまま投げる
  if(viewerWindowFlag==1){
    writeDebugLog('[main process] Viewer window is opened. Send comment to Viewer.');
    viewerWindow.webContents.send('notifyComment',message);
  }
});



// メインのウインドウを開いていく
function createMainWindow() {
  writeInfoLog('[main process] Start to open Main window.');
  //画面配置が少しWindowsとMacで異なるので、Windowsの場合画面サイズを拡張する
  if(process.platform=='win32'){
    options={
      width: 493, height: 205,resizable: false,
      webPreferences:{
        nodeIntegration: true,
        nodeIntegrationInWorker: true
      }
    };
  }else{
    options={
      width: 493, height: 200,resizable: false,
      webPreferences:{
        nodeIntegration: true,
        nodeIntegrationInWorker: true
      }
    };
  }
  mainWindow = new BrowserWindow(options);

  mainWindow.setMenu(null);
  //メインのウインドウのファイル定義
  mainWindow.loadURL(`file://${__dirname}/mameCommentMain.html`);

  // Open the DevTools.
  if(debugFlg=='ON'){
    mainWindow.webContents.openDevTools();
  }
  
  // Windowが閉じたときの動作について定義
  mainWindow.on('closed', function () {
    writeInfoLog('[main process] Main window closed.');

    //メインウインドウのフラグをOFFにする
    mainWindowFlag=0;

    //各ウインドウが開いていた場合、閉じる関数を呼び出す
    if(viewerWindow!=null){
      closeViewerWindow();
    }
    if(boardWindow!=null){
        closeBoardWindow();
    }
    if(settingWindow!=null){
        closeSettingWindow();
    }
    writeInfoLog('[main process] Quit process.');
  });
  writeDebugLog('[main process] Send initial setting event to Main window.');
  mainWindow.webContents.send('initialSetting',mameCommentSettingData);
}



//ボードを開く
function createBoardWindow(){
  writeInfoLog('[main process] Start to open Board window.');
  let boardOption={
    x: parseInt(mameCommentSettingData.boardX), y: parseInt(mameCommentSettingData.boardY),
    width: parseInt(mameCommentSettingData.boardWidth), height: parseInt(mameCommentSettingData.boardHeight),
    transparent: true,
    frame:false,
    webPreferences:{
      nodeIntegration: true
    }
  }
  boardWindow = new BrowserWindow(boardOption);
  boardWindow.setMenu(null);
  //ボードのファイル定義
  boardWindow.loadURL(`file://${__dirname}/mameCommentBoard.html`);

  // Open the DevTools.
  if(debugFlg=='ON'){
    boardWindow.webContents.openDevTools()
  }

  // ウインドウを閉じる前に位置を保存する
  boardWindow.on('close', function () {
    writeDebugLog('[main process] Board window will close. Save window bounds to ini file.');
    boardBounds=boardWindow.getBounds();
    mameCommentSettingData.boardX=boardBounds.x;
    mameCommentSettingData.boardY=boardBounds.y;
    mameCommentSettingData.boardWidth=boardBounds.width;
    mameCommentSettingData.boardHeight=boardBounds.height;
    mameCommentSettingData.writeToIni();
  })
  
  // ウインドウが閉じたときの動作
  boardWindow.on('closed', function () {
    writeDebugLog('[main process] Board window closed.');
    boardWindowClosed();
  })

}

//ボードウインドウから開いた通知を受信したときの動作
ipcMain.on('boardReady', (ev,message)=>{
  writeDebugLog('[main process] Board window ready event received.');
  //設定ウインドウが無事開けたので、フラグをONにする
  boardWindowFlag=1;
  //ボードウインドウに設定情報を渡す
  writeDebugLog('[main process] Send setting update event to Board window.');
  boardWindow.webContents.send('settingUpdate',mameCommentSettingData);
  //メインウインドウに、設定が開いたことを通知する
  writeDebugLog('[main process] Send Board window opened event to Main window.');
  mainWindow.webContents.send('windowResponse','boardOpened');

});

//ボードを閉じる
function closeBoardWindow(){
  writeDebugLog('[main process] Board close function called. Close Board.');
  boardWindow.close();
}

//ボードが閉じたときに実行する処理
function boardWindowClosed(){
  writeDebugLog('[main process] Board window is closed. Start after process.');
  //ウインドウをnullにする
  boardWindow=null;

  //メインウインドウが開いている場合は、メインウインドウにボードが閉じたことを通知する
  if(mainWindowFlag==1){
    writeDebugLog('[main process] Send Board window closed event to Main window.');
    mainWindow.webContents.send('windowResponse','boardClosed');
  }

  //ボードが無事閉じられたので、フラグをOFFにする
  boardWindowFlag=0;
  writeInfoLog('[main process] Board close completed.');
}


//ビューワーを開く
function createViewerWindow(){
  writeInfoLog('[main process] Start to open Viewer window.');
  let viewerOption={
    x: parseInt(mameCommentSettingData.viewerX), y: parseInt(mameCommentSettingData.viewerY),
    width: parseInt(mameCommentSettingData.viewerWidth), height: parseInt(mameCommentSettingData.viewerHeight),
    webPreferences:{
      nodeIntegration: true
    }
  }
  viewerWindow = new BrowserWindow(viewerOption);
  viewerWindow.setMenu(null);
  //ビューワーのファイル定義
  viewerWindow.loadURL(`file://${__dirname}/mameCommentViewer.html`);

  // Open the DevTools.
  if(debugFlg=='ON'){
    viewerWindow.webContents.openDevTools()
  }

  // ウインドウを閉じる前に位置を保存する
  viewerWindow.on('close', function (e) {
    writeDebugLog('[main process] Viewer window will close. Save window bounds to ini file.');
    e.preventDefault();
    viewerBounds=viewerWindow.getBounds();
    mameCommentSettingData.viewerX=viewerBounds.x;
    mameCommentSettingData.viewerY=viewerBounds.y;
    mameCommentSettingData.viewerWidth=viewerBounds.width;
    mameCommentSettingData.viewerHeight=viewerBounds.height;
    writeDebugLog('[main process] Sent column data requset event to Viewer window.');
    viewerWindow.webContents.send('getColumnData','');
  })
  
}

//ビューワーウインドウから開いた通知を受信したときの動作
ipcMain.on('viewerReady', (ev,message)=>{
  writeDebugLog('[main process] Viewer window ready event received.');
  //設定ウインドウが無事開けたので、フラグをONにする
  viewerWindowFlag=1;
  //ビューワーウインドウに設定情報を渡す
  writeDebugLog('[main process] Send setting update event to Viewer window.');
  viewerWindow.webContents.send('settingUpdate',mameCommentSettingData);
  //メインウインドウに、設定が開いたことを通知する
  writeDebugLog('[main process] Send Viewer window opened event to Main window.');
  mainWindow.webContents.send('windowResponse','viewerOpened');
});

//ビューワーウインドウからコメント送信のリクエストを受信したときの動作
ipcMain.on('submitComment',(ev,message)=>{
  writeDebugLog('[main process] Submit comment request received.');
  if(getFlag==1){
    //メインウインドウにPOSTしてもらう
    writeDebugLog('[main process] Worker is ready. Send post request to Main window.');
    mainWindow.webContents.send('postRequest',message);
  }else{
    writeErrorLog('[main process] Worker is not ready. Cannot post comment.');
  }
});


//ビューワーを閉じる
function closeViewerWindow(){
  writeDebugLog('[main process] Viewer close function called. Close Viewer.');
  viewerWindow.close();
}

//ビューワーが閉じるときに列の幅データが送られてくるはずなので、その処理
ipcMain.on('sendViewerColumnData',(ev,message)=>{
  writeDebugLog('[main process] Viewer column data event received. Write data to ini file.');
  let data=JSON.parse(message);
  mameCommentSettingData.viewerTime=data.time;
  mameCommentSettingData.viewerName=data.name;
  mameCommentSettingData.viewerImage=data.image;
  mameCommentSettingData.writeToIni();
  writeDebugLog('[main process] Destroy Viewer.');
  viewerWindow.destroy();
  viewerWindowClosed();
});


//ビューワーが閉じたときに実行する処理
function viewerWindowClosed(){
  writeDebugLog('[main process] Viewer window is closed. Start after process.');
  //ウインドウをnullにする
  viewerWindow=null;

  //メインウインドウが開いている場合は、メインウインドウにビューワーが閉じたことを通知する
  if(mainWindowFlag==1){
    writeDebugLog('[main process] Send Viewer window closed event to Main window.');
    mainWindow.webContents.send('windowResponse','viewerClosed');
  }

  //ビューワーが無事閉じられたので、フラグをOFFにする
  viewerWindowFlag=0;
  writeInfoLog('[main process] Viewer close completed.');
}



//設定を開く
function createSettingWindow(){
  writeInfoLog('[main process] Start to open Setting window.');

  settingWindow = new BrowserWindow({
    width: 640.0, height: 460.0,
    webPreferences:{
      nodeIntegration: true
    }

  });

  //設定のファイル定義
  settingWindow.loadURL(`file://${__dirname}/mameCommentSetting.html`);
  settingWindow.setMenu(null);
  // Open the DevTools.
  if(debugFlg=='ON'){
    settingWindow.webContents.openDevTools()
  }

  // ウインドウが閉じたときの動作
  settingWindow.on('closed', function () {
    writeDebugLog('[main process] Setting window closed.');
    settingWindowClosed();
  })

}

//設定ウインドウから開いた通知を受信したときの動作
ipcMain.on('settingReady', (ev,message)=>{
  writeDebugLog('[main process] Setting window ready event received..');  
  //設定ウインドウが無事開けたので、フラグをONにする
  settingWindowFlag=1;
  //設定ウインドウに設定情報を渡す
  writeDebugLog('[main process] Send setting update event to Setting window.');
  settingWindow.webContents.send('settingUpdate',mameCommentSettingData);
  //メインウインドウに、設定が開いたことを通知する
  writeDebugLog('[main process] Send Setting window opened event to Main window.');
  mainWindow.webContents.send('windowResponse','settingOpened');
});

//設定を閉じる
function closeSettingWindow(){
  writeDebugLog('[main process] Setting close function called. Close Setting.');
  settingWindow.close();
}

//設定が閉じたときに実行する処理
function settingWindowClosed(){
  writeDebugLog('[main process] Setting window is closed. Start after process.');
  //ウインドウをnullにする
  settingWindow=null;

  //メインウインドウが開いている場合は、メインウインドウに設定が閉じたことを通知する
  if(mainWindowFlag==1){
    writeDebugLog('[main process] Send Setting window closed event to Main window.');
    mainWindow.webContents.send('windowResponse','settingClosed');
  }
  //設定が無事閉じられたので、フラグをOFFにする
  settingWindowFlag=0;
  writeInfoLog('[main process] Setting close completed.');
}


//登録を開く
function createRegistWindow(){
  writeInfoLog('[main process] Start to open Regist window.');

  registWindow = new BrowserWindow({
    width: 640.0, height: 640.0,
    webPreferences:{
      nodeIntegration: true,
      webviewTag: true
    }
  });
  //ボードのファイル定義
  registWindow.loadURL(`file://${__dirname}/mameCommentRegist.html`);
  registWindow.setMenu(null);
  // Open the DevTools.
  if(debugFlg=='ON'){
    registWindow.webContents.openDevTools();
  }
}

//登録からURLを取得したときの動作
ipcMain.on('tokenUrlInfo', (ev,message)=>{
  writeDebugLog('[main process] Token url information event received.');
  writeDebugLog('[main process] Send Token url to Setting window.');
  settingWindow.webContents.send('tokenUrlInfo',message);
});

//デバッグログ出力リクエストを受けたときの動作
ipcMain.on('debugLog',(ev,message)=>{
  writeDebugLog('['+ev.sender.getURL().split('/').pop().split('.')[0]+'] '+message);
});
//情報ログ出力リクエストを受けたときの動作
ipcMain.on('infoLog',(ev,message)=>{
  writeInfoLog('['+ev.sender.getURL().split('/').pop().split('.')[0]+'] '+message);
});
//エラーログ出力リクエストを受けたときの動作
ipcMain.on('errorLog',(ev,message)=>{
  writeErrorLog('['+ev.sender.getURL().split('/').pop().split('.')[0]+'] '+message);
});


//デバッグログ出力
function writeDebugLog(logMessage){
  if(debugFlg=='ON'){
    mameCommentCommon.writeLog('[Debug      ] '+logMessage,logFd);
  }
}
//情報ログ出力
function writeInfoLog(logMessage){
  mameCommentCommon.writeLog('[Information] '+logMessage,logFd);
}
//エラーログ出力
function writeErrorLog(logMessage){
  mameCommentCommon.writeLog('[!!!Error!!!] '+logMessage,logFd);
  dialog.showErrorBox('Error',logMessage);
}
//コメント配列処理
//形式：[[slice_id,created,user_image,name,message,screen_id],[],...]
function writeCommentArray(array){
  for(i=0;i<array.length;i++){
    var commentData=array[i];
    writeCommentLog(commentData[3]+','+commentData[4]);
  }
}

//コメントログ出力
function writeCommentLog(logMessage){
  mameCommentCommon.writeLog(logMessage,commentFd);
}