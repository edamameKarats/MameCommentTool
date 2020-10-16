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
    timeTarget.style.width=mameCommentSettingData.viewerTime;
    nameTarget.style.width=mameCommentSettingData.viewerName;
    imageTarget.style.width=mameCommentSettingData.viewerImage;
}


function sendButtonClicked(){
    var bottom=isBottom();
    var textArea=document.getElementById('commentText');
    let table=document.getElementById('commentTable');
    let newRow=table.insertRow();
    let newCell=newRow.insertCell();
    let newText=document.createTextNode('time');
    newCell.appendChild(newText);
    newCell=newRow.insertCell();
    newText=document.createTextNode('image');
    newCell.appendChild(newText);
    newCell=newRow.insertCell();
    newText=document.createTextNode('name');
    newCell.appendChild(newText);
    newCell=newRow.insertCell();
    newText=document.createTextNode('id');
    newCell.appendChild(newText);
    newCell=newRow.insertCell();
    newText=document.createTextNode('comment');
    newCell.appendChild(newText);
    textArea.value='';
    if(bottom){
        scroll();
    }
}

function writeCommentFromArray(commentArray){
    var bottom=isBottom();
    //形式：[[slice_id,created,user_image,name,message,screen_id],[],...]
    for(var i=0;i<commentArray.length;i++){
        let unixTimeValue=commentArray[i][1];
        let localTime = (new Date(unixTimeValue * 1000)).toLocaleTimeString();
        let imageUrlValue=commentArray[i][2];
        let nameValue=commentArray[i][3];
        let idValue=commentArray[i][5];
        let commentValue=commentArray[i][4];
        writeComment(localTime,imageUrlValue,nameValue,idValue,commentValue);
    }
    if(bottom){
        scroll();
    }
}

function writeComment(time,image,name,id,comment){
    let table=document.getElementById('commentBody');
    if(table.children.length==0){
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
    console.log(resultValue);
    if(resultValue>-10){
        return true;
    }else{
        return false;
    }
}


//コメント通知が来たときの処理
ipcRenderer.on('notifyComment',(ev,message)=>{
    console.log('receive');
    writeCommentFromArray(message);
});

//画面を閉じるときに呼んでもらう関数
ipcRenderer.on('getColumnData',(ev,message)=>{
    console.log('send column.');
    ipcRenderer.send('sendViewerColumnData','{"time":"'+timeTarget.style.width+'","name":"'+nameTarget.style.width+'","image":"'+imageTarget.style.width+'"}');
});


//準備完了を通知
console.log('send viewerReady event.');
ipcRenderer.send('viewerReady','');

//準備完了後、メインから設定情報が飛んできたら反映する
ipcRenderer.on('settingUpdate',(ev,message)=>{
    console.log('setting update');
    mameCommentSettingData.setFromJson(message);
    setValueFromSettingData();
});

