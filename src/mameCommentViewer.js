const ipcRenderer = require( 'electron' ).ipcRenderer;

const MameCommentSettingData = require('./mameCommentSettingData');
let mameCommentSettingData=new MameCommentSettingData();



//TODO いずれはここで言語によって切り替えたい(切り替えるときは再起動前提)
const dictionary =require('./dictionary/ja');
document.getElementById("TIME").innerText=dictionary["TIME"];
document.getElementById("IMAGE").innerText=dictionary["IMAGE"];
document.getElementById("NAME").innerText=dictionary["NAME"];
document.getElementById("COMMENT").innerText=dictionary["COMMENT"];
document.getElementById("sendButton").value=dictionary["SEND_COMMENT"];

//ボタンの文字サイズはWindowsとMacで違うので、サイズを少し小さくしておく
document.getElementById("sendButton").style.fontSize='13px';



const timeTarget = document.getElementsByName("timeHead")[0];
const timeObserver = new MutationObserver(() => {
    const timeChange =document.getElementsByName("timeColumn");
    timeChange[0].style.width=timeTarget.style.width;
});
const timeOptions = {
    attriblutes: true,
    attributeFilter: ["style"]
};
timeObserver.observe(timeTarget, timeOptions);

const imageTarget = document.getElementsByName("imageHead")[0];
const imageObserver = new MutationObserver(() => {
    const imageChange =document.getElementsByName("imageColumn");
    imageChange[0].style.width=imageTarget.style.width;
});
const imageOptions = {
    attriblutes: true,
    attributeFilter: ["style"]
};
imageObserver.observe(imageTarget, imageOptions);

const nameTarget = document.getElementsByName("nameHead")[0];
const nameObserver = new MutationObserver(() => {
    const nameChange =document.getElementsByName("nameColumn");
    nameChange[0].style.width=nameTarget.style.width;
});
const nameOptions = {
    attriblutes: true,
    attributeFilter: ["style"]
};
nameObserver.observe(nameTarget, nameOptions);

const commentTarget = document.getElementsByName("commentHead")[0];
const commentObserver = new MutationObserver(() => {
    const commentChange =document.getElementsByName("commentColumn");
    commentChange[0].style.width=commentTarget.style.width;
});
const commentOptions = {
    attriblutes: true,
    attributeFilter: ["style"]
};
commentObserver.observe(commentTarget, commentOptions);

function setValueFromSettingData(){
    ipcRenderer.send('debugLog','Set values from setting data.');
    timeTarget.style.width=mameCommentSettingData.viewerTime;
    nameTarget.style.width=mameCommentSettingData.viewerName;
    imageTarget.style.width=mameCommentSettingData.viewerImage;
}

function showLength(str){
    document.getElementById('countArea').innerHTML = 140 - str.length;
}

function sendButtonClicked(){
    ipcRenderer.send('debugLog','Comment send button clicked.');
    var bottom=isBottom();
    var textArea=document.getElementById('commentText');
    var commentValue=textArea.value;
    if(textArea.value!=''){
        ipcRenderer.send('debugLog','Comment area is not blank. Send submit comment event to main.');
        ipcRenderer.send('debugLog','Comment: '+commentValue);
        ipcRenderer.send('submitComment',commentValue);
    }
    ipcRenderer.send('debugLog','Refresh text area.');
    textArea.value='';
}

function writeCommentFromArray(commentArray){
    ipcRenderer.send('debugLog','Comment array received.');
    var bottom=isBottom();
    //形式：[[slice_id,created,user_image,name,message,screen_id],[],...]
    for(var i=0;i<commentArray.length;i++){
        ipcRenderer.send('debugLog','Start to parse comment No.'+i+'.');
        let unixTimeValue=commentArray[i][1];
        let localTime = (new Date(unixTimeValue * 1000)).toLocaleTimeString();
        let imageUrlValue=commentArray[i][2];
        let nameValue=commentArray[i][3];
        let idValue=commentArray[i][5];
        let commentValue=commentArray[i][4];
        ipcRenderer.send('debugLog','Comment data parsed successfully.');
        writeComment(localTime,imageUrlValue,nameValue,idValue,commentValue);
    }
    if(bottom){
        ipcRenderer.send('debugLog','Comment area was bottom. Exec scroll.');
        scroll();
    }
}

function writeComment(time,image,name,id,comment){
    ipcRenderer.send('debugLog','Start to write comment.');
    let table=document.getElementById('commentBody');
    if(table.children.length==0){
        ipcRenderer.send('debugLog','This is first comment. Create header.');
        let headRow=table.insertRow();

        let headCell=headRow.insertCell();
        let headText=document.createTextNode('---');
        headCell.appendChild(headText);

        headCell=headRow.insertCell();
        headText=document.createTextNode('---');
        headCell.appendChild(headText);

        headCell=headRow.insertCell();
        headText=document.createTextNode('---');
        headCell.appendChild(headText);

        headCell=headRow.insertCell();
        headText=document.createTextNode('---');
        headCell.appendChild(headText);
    }

    let newRow=table.insertRow();
    let newCell=newRow.insertCell();
    let newText=document.createTextNode(time);
    newCell.appendChild(newText);
    newCell.setAttribute('class','form');

    newCell=newRow.insertCell();
    let imageCell=document.createElement('img');
    imageCell.src=image;
    imageCell.width=16;
    imageCell.height=16;
    newCell.appendChild(imageCell);
    newCell.setAttribute('class','form');
//    newText=document.createTextNode(image);
//    newCell.appendChild(newText);

    newCell=newRow.insertCell();
    newText=document.createTextNode(name);
    newCell.appendChild(newText);
    newCell.setAttribute('class','form');

    newCell=newRow.insertCell();
    newCell.setAttribute("name","ids");
    newText=document.createTextNode(id);
    newCell.appendChild(newText);
    newCell.setAttribute('class','form');

    newCell=newRow.insertCell();
    newText=document.createTextNode(comment);
    newCell.appendChild(newText);
    newCell.setAttribute('class','form');
    ipcRenderer.send('debugLog','Comment written successfully.');

}


function scroll(){
    var clientHeight=document.body.clientHeight;
    var tableHeight=document.getElementById('tableArea').clientHeight;
    document.body.scrollTop=tableHeight-clientHeight;
}

function isBottom(){
    var scrollTop=document.body.scrollTop;
    var clientHeight=document.body.clientHeight;
    var tableHeight=document.getElementById('tableArea').clientHeight;
    var resultValue=clientHeight-tableHeight+scrollTop;
    if(resultValue>-10){
        ipcRenderer.send('debugLog','This is bottom.');
        return true;
    }else{
        ipcRenderer.send('debugLog','This is not bottom.');
        return false;
    }
}


//コメント通知が来たときの処理
ipcRenderer.on('notifyComment',(ev,message)=>{
    ipcRenderer.send('debugLog','Notify comment event received.');
    writeCommentFromArray(message);
});

//画面を閉じるときに呼んでもらう関数
ipcRenderer.on('getColumnData',(ev,message)=>{
    ipcRenderer.send('debugLog','Get column data event received.');
    ipcRenderer.send('sendViewerColumnData','{"time":"'+timeTarget.style.width+'","name":"'+nameTarget.style.width+'","image":"'+imageTarget.style.width+'"}');
});


//準備完了を通知
ipcRenderer.send('debugLog','Viewer is readty. Send ready event to main.');
ipcRenderer.send('viewerReady','');
//ついでに、文字カウントを表示しておく
showLength('');

//準備完了後、メインから設定情報が飛んできたら反映する
ipcRenderer.on('settingUpdate',(ev,message)=>{
    ipcRenderer.send('debugLog','Setting update event received.');
    mameCommentSettingData.setFromJson(message);
    setValueFromSettingData();
});



