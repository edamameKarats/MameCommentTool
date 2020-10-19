const {app, BrowserWindow, ipcRenderer} = require('electron');
const ipcMain = require( 'electron' ).ipcMain;
const MameCommentSettingData=require('./mameCommentSettingData');
const MameCommentConstants=require('./mameCommentConstants');
const fs=require('fs');

//各ウインドウを定義
let mainWindow=null;
let boardWindow=null;
let viewerWindow=null;
let settingWindow=null;
let registWindow=null;

//GET用のワーカースレッドを定義
let getThread=null;
//GETステータスフラグを定義
let getFlag=0;
//GETしているmovie_idを定義
let movie_id;

//各ウインドウの開閉フラグを定義
let mainWindowFlag=0;
let boardWindowFlag=0;
let viewerWindowFlag=0;
let settingWindowFlag=0;

//TODO 設定ファイル配置用ディレクトリは、Windows/Linuxだと足元、Macだと~/Libary/Application\ Support/MameComment・・・だと思う。
let osArch=process.platform;

//設定クラスの作成と、初期読み込みをここで実行
let mameCommentSettingData=new MameCommentSettingData();
console.log('read from inifile');
mameCommentSettingData.readFromIni();

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
  console.log('main window opened');
  mainWindowFlag=1;
  //メインウインドウに設定情報を渡す
  console.log('send update event.');
  mainWindow.webContents.send('settingUpdate',mameCommentSettingData);
});


//メインウインドウからウインドウに関するイベントを受信したときの動作
ipcMain.on( 'windowRequest', ( ev, message ) => {
  //ボードに関する要求のとき
  if(message=='board'){
    //ボードが開いていない場合は、開く
    if(boardWindowFlag==0){
      createBoardWindow();
    }
    //開いている場合は閉じる
    else{
      closeBoardWindow();
    }
  }
  //ビューワーに関する要求のとき
  else if(message=='viewer'){
    //ビューワーが開いていない場合は、開く
    if(viewerWindowFlag==0){
      createViewerWindow();
    }
    //開いている場合は閉じる
    else{
      closeViewerWindow();
    }
  }
  //設定に関する要求のとき
  else if(message=='setting'){
    //設定が開いていない場合は、開く
    if(settingWindowFlag==0){
      createSettingWindow();
    }
    //開いている場合は閉じる
    else{
      closeSettingWindow();
    }
  }
  //登録に関する要求のとき
  else if(message=='regist'){
    //複数開いてもいいことにする
    createRegistWindow();
  }
});

//ボードウインドウから、ボードの最前面表示に関するリクエストを受けたときの動作
ipcMain.on( 'topRequest', ( ev, message )=>{
  //trueのメッセージなら最前面表示ON、そうでなければOFFにする
  if(message==true){
    console.log('true');
    boardWindow.setAlwaysOnTop(true);
  }else{
    console.log('false');
    boardWindow.setAlwaysOnTop(false);
  }

});

//ワーカースレッドから、開始した連絡を受けたらフラグを立てる
ipcMain.on( 'getStarted', (ev, message)=>{
  console.log('worker started.');
  getFlag=1;
  console.log(message);
  movie_id=message;
});

//ワーカースレッドから、開始した連絡を受けたらフラグを消す
ipcMain.on( 'getStopped', (ev, message)=>{
  console.log('worker stopped.');
  getFlag=0;
  movie_id='';
});


//ワーカースレッドから、コメントを取得した連絡を受けたときの動作
ipcMain.on ( 'notifyComment', (ev, message)=>{
    console.log('comment received.')
    //メッセージが配列で送られてくる
    //形式：[[slice_id,created,user_image,name,message,screen_id],[],...]
    //TODO ログがONの場合は、配列をそのままログ出力関数に投げる
    //ボードが開いている場合は、配列をそのまま投げる
    if(boardWindowFlag==1){
      boardWindow.webContents.send('notifyComment',message);
    }
    //ビューワーが開いている場合は、配列をそのまま投げる
    if(viewerWindowFlag==1){
      viewerWindow.webContents.send('notifyComment',message);
    }
});



// メインのウインドウを開いていく
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 486, height: 190,resizable: false,
    webPreferences:{
      nodeIntegration: true,
      nodeIntegrationInWorker: true
    }
  });

  //メインのウインドウのファイル定義
  mainWindow.loadURL(`file://${__dirname}/mameCommentMain.html`);

  // Open the DevTools.(後で削除する)
//  mainWindow.webContents.openDevTools();
  
  // Windowが閉じたときの動作について定義
  mainWindow.on('closed', function () {
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
  });
  mainWindow.webContents.send('initialSetting',mameCommentSettingData);
}



//ボードを開く
function createBoardWindow(){
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

  //ボードのファイル定義
  boardWindow.loadURL(`file://${__dirname}/mameCommentBoard.html`);

  // Open the DevTools.(後で削除する)
//  boardWindow.webContents.openDevTools()

  // ウインドウを閉じる前に位置を保存する
  boardWindow.on('close', function () {
    boardBounds=boardWindow.getBounds();
    mameCommentSettingData.boardX=boardBounds.x;
    mameCommentSettingData.boardY=boardBounds.y;
    mameCommentSettingData.boardWidth=boardBounds.width;
    mameCommentSettingData.boardHeight=boardBounds.height;
    mameCommentSettingData.writeToIni();
  })
  
  // ウインドウが閉じたときの動作
  boardWindow.on('closed', function () {
    boardWindowClosed();
  })

}

//ボードウインドウから開いた通知を受信したときの動作
ipcMain.on('boardReady', (ev,message)=>{
  //設定ウインドウが無事開けたので、フラグをONにする
  console.log('board window opened');
  boardWindowFlag=1;
  //ボードウインドウに設定情報を渡す
  console.log('send update event.');
  boardWindow.webContents.send('settingUpdate',mameCommentSettingData);
  //メインウインドウに、設定が開いたことを通知する
  mainWindow.webContents.send('windowResponse','boardOpened');

});

//ボードを閉じる
function closeBoardWindow(){
  boardWindow.close();
}

//ボードが閉じたときに実行する処理
function boardWindowClosed(){
  //ウインドウをnullにする
  boardWindow=null;

  //メインウインドウが開いている場合は、メインウインドウにボードが閉じたことを通知する
  if(mainWindowFlag==1){
    mainWindow.webContents.send('windowResponse','boardClosed');
  }

  //ボードが無事閉じられたので、フラグをOFFにする
  boardWindowFlag=0;
}


//ビューワーを開く
function createViewerWindow(){
  let viewerOption={
    x: parseInt(mameCommentSettingData.viewerX), y: parseInt(mameCommentSettingData.viewerY),
    width: parseInt(mameCommentSettingData.viewerWidth), height: parseInt(mameCommentSettingData.viewerHeight),
    webPreferences:{
      nodeIntegration: true
    }
  }
  viewerWindow = new BrowserWindow(viewerOption);

  //ビューワーのファイル定義
  viewerWindow.loadURL(`file://${__dirname}/mameCommentViewer.html`);

  // Open the DevTools.(後で削除する)
//  viewerWindow.webContents.openDevTools()

  // ウインドウを閉じる前に位置を保存する
  viewerWindow.on('close', function (e) {
    e.preventDefault();
    viewerBounds=viewerWindow.getBounds();
    mameCommentSettingData.viewerX=viewerBounds.x;
    mameCommentSettingData.viewerY=viewerBounds.y;
    mameCommentSettingData.viewerWidth=viewerBounds.width;
    mameCommentSettingData.viewerHeight=viewerBounds.height;
    viewerWindow.webContents.send('getColumnData','');
  })
  
}

//ビューワーウインドウから開いた通知を受信したときの動作
ipcMain.on('viewerReady', (ev,message)=>{
  //設定ウインドウが無事開けたので、フラグをONにする
  console.log('viewer window opened');
  viewerWindowFlag=1;
  //ビューワーウインドウに設定情報を渡す
  console.log('send update event.');
  viewerWindow.webContents.send('settingUpdate',mameCommentSettingData);
  //メインウインドウに、設定が開いたことを通知する
  mainWindow.webContents.send('windowResponse','viewerOpened');
});

//ビューワーウインドウからコメント送信のリクエストを受信したときの動作
ipcMain.on('submitComment',(ev,message)=>{
  console.log('submit request received.');
  if(getFlag==1){
    console.log('submit request.');
    console.log(movie_id+','+mameCommentSettingData.tokenId);
    //メインウインドウにPOSTしてもらう
    mainWindow.webContents.send('postRequest',message);
  }else{
    console.log('worker is not active.');
  }
});


//ビューワーを閉じる
function closeViewerWindow(){
  viewerWindow.close();
}

//ビューワーが閉じるときに列の幅データが送られてくるはずなので、その処理
ipcMain.on('sendViewerColumnData',(ev,message)=>{
  let data=JSON.parse(message);
  mameCommentSettingData.viewerTime=data.time;
  mameCommentSettingData.viewerName=data.name;
  mameCommentSettingData.viewerImage=data.image;
  mameCommentSettingData.writeToIni();
  viewerWindow.destroy();
  viewerWindowClosed();
});


//ビューワーが閉じたときに実行する処理
function viewerWindowClosed(){
  console.log('viewer window closed.');
  //ウインドウをnullにする
  viewerWindow=null;

  //メインウインドウが開いている場合は、メインウインドウにビューワーが閉じたことを通知する
  if(mainWindowFlag==1){
    mainWindow.webContents.send('windowResponse','viewerClosed');
  }

  //ビューワーが無事閉じられたので、フラグをOFFにする
  viewerWindowFlag=0;
}



//設定を開く
function createSettingWindow(){
  settingWindow = new BrowserWindow({
    width: 640.0, height: 430.0,
    webPreferences:{
      nodeIntegration: true
    }

  });

  //設定のファイル定義
  settingWindow.loadURL(`file://${__dirname}/mameCommentSetting.html`);

  // Open the DevTools.(後で削除する)
//  settingWindow.webContents.openDevTools()

  // ウインドウが閉じたときの動作
  settingWindow.on('closed', function () {
    settingWindowClosed();
  })

}

//設定ウインドウから開いた通知を受信したときの動作
ipcMain.on('settingReady', (ev,message)=>{
  //設定ウインドウが無事開けたので、フラグをONにする
  console.log('setting window opened');
  settingWindowFlag=1;
  //設定ウインドウに設定情報を渡す
  console.log('send update event.');
  settingWindow.webContents.send('settingUpdate',mameCommentSettingData);
  //メインウインドウに、設定が開いたことを通知する
  mainWindow.webContents.send('windowResponse','settingOpened');
});

//設定変更を受信したときの動作
ipcMain.on('settingUpdate', (ev,message)=>{
  console.log('setting update received.');
  mameCommentSettingData.setFromJson(message);
});


//設定を閉じる
function closeSettingWindow(){
  settingWindow.close();
}

//設定が閉じたときに実行する処理
function settingWindowClosed(){
  //ウインドウをnullにする
  settingWindow=null;

  //メインウインドウが開いている場合は、メインウインドウに設定が閉じたことを通知する
  if(mainWindowFlag==1){
    mainWindow.webContents.send('windowResponse','settingClosed');
  }
  //設定が無事閉じられたので、フラグをOFFにする
  settingWindowFlag=0;
}


//登録を開く
function createRegistWindow(){
  registWindow = new BrowserWindow({
    width: 640.0, height: 640.0,
    webPreferences:{
      nodeIntegration: true,
      webviewTag: true
    }
  });
  //ボードのファイル定義
  registWindow.loadURL(`file://${__dirname}/mameCommentRegist.html`);
  
  // Open the DevTools.(後で削除する)
//  registWindow.webContents.openDevTools();
}

//登録からURLを取得したときの動作
ipcMain.on('tokenUrlInfo', (ev,message)=>{
  console.log('token url received.');
  settingWindow.webContents.send('tokenUrlInfo',message);
});