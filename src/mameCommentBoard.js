const ipcRenderer = require( 'electron' ).ipcRenderer;

let commentArea=document.getElementById('commentArea');
let frontCheck=document.getElementById('frontCheck');

let commentText=[];
let commentIsTransition=[];

const MameCommentSettingData = require('./mameCommentSettingData');
let mameCommentSettingData=new MameCommentSettingData();

//TODO いずれはここで言語によって切り替えたい(切り替えるときは再起動前提)
const dictionary =require('./dictionary/ja');
document.getElementById("BOARD_TRANS_CHANGE").innerText=dictionary["BOARD_TRANS_CHANGE"];
document.getElementById("ALWAYS_ON_TOP").innerText=dictionary["ALWAYS_ON_TOP"];
document.getElementById("CLOSE").innerText=dictionary["CLOSE"];


function setValueFromSettingData(){
    commentArea.style.backgroundColor=mameCommentSettingData.boardBackgroundColor;
    //コメントの文字列がすでにある場合は削除する
    for(var i=0;i<commentText.length;i++){
        if(commentText[i]!=null){
            commentText[i].remove;
        }
    }
    //コメントの文字列は、秒50コメント*5秒で250個用意しておく
    for (var i=0;i<250;i++){
        //コメントの要素はdivで作る
        commentText[i]=document.createElement('div');
        //コメントエリアに追加する
        commentArea.appendChild(commentText[i]);
        //テキストの文字列は空にしておく
        commentText[i].textContent='';

        //TODO 行数可変にするならここらへんを可変にしないとだめ
        //10行表示なので、行数は10で割ったあまりになる
        var rowNum=i%10;
        //画面サイズに応じた自動での位置と、フォントサイズの変更、設定に応じた変更
        commentText[i].style=('position:absolute;top:calc((100% - 55px) / 10 * '+rowNum+' + 31px);font-size:9vh;left:100%;line-height:9vh;color: '+mameCommentSettingData.boardFontColor+';');

        commentIsTransition[i]=false;
        commentArea.appendChild(commentText[i]);
        commentText[i].addEventListener('transitionend',function(){
            var j=commentText.indexOf(this);
            commentIsTransition[j]=false;
            commentText[j].style.transition='all 0s linear';
            commentText[j].style.transform='translateX(0px)';
        });
    }

}


function closeButtonClicked(){
    this.close();
}

function changeTrans(){
    if(commentArea.classList.length==0){
        commentArea.classList.add('trans');
    }else{
        commentArea.classList.remove('trans');
    }
}

function changeFront(){
    ipcRenderer.send( 'topRequest', frontCheck.checked );    
}

async function sendCommentFromArray(arrayString){
    for(var i=0;i<arrayString.length;i++){
        sendComment(arrayString[i][4]);
        await sleep(20);
    }
}

function sendComment(comment){

    //条件に合いそうなものを探していく
    for(var i=0;i<250;i++){
        //現在使用中のものでないものをまず選ぶ
        if(commentIsTransition[i]==false){
            //コメントの中で、改行の数を数える
            var count=(comment.match(/\n/g)||[]).length;
            //TODO 行数可変にするならここをいじる　番号を10で割ったあまりと行数を足した値が10より小さければ、画面内に収まるので選択する
            if(i%10+count<10){
                //使用中に変更する
                commentIsTransition[i]=true;
                //コメントを設定する
                commentText[i].textContent=comment;
                //幅が変になるので、うまく改行するために色々する
                var lines=commentText[i].textContent.split('\n');
                var tmpDiv=document.createElement('div');
                var maxLength=0;
                for(var j=0;j<lines.length;j++){
                    tmpDiv.textContent='';
                    tmpDiv.style='position:absolute;font-size:10vh;white-space: nowrap;left:100%;';
                    commentArea.appendChild(tmpDiv);
                    tmpDiv.textContent=lines[j];
                    if(maxLength<tmpDiv.clientWidth){
                        maxLength=tmpDiv.clientWidth;
                    }
                    commentArea.removeChild(tmpDiv);
                }
                commentText[i].style.width=maxLength+'px';
                //コメントを動かす
                commentText[i].style.transition='all 5s linear';
                commentText[i].style.transform='translateX(-'+(commentArea.clientWidth+commentText[i].clientWidth)+'px)';
                break;
            }
        }
        if(i==249){
            //どこにも引っかからなかった場合(全て使用中だったり、改行が条件に満たなかったり)は、一時的にdivを追加する
            var tmpText=document.createElement('div');
            //画面サイズに応じた自動での位置と、フォントサイズの変更
            tmpText.style=('position:absolute;top:31px;font-size:10vh;left:100%;');
            tmpText.textContent=commnent;
            commentArea.appendChild(tmpText);
            var width=tmpText.width;
            commentArea.removeChild(tmpText);
            tmpText.addEventListener('transitionend',function(){
                //終わったら削除する
                commentArea.removeChild(this);
            });
        }
    }
}

function sleep(msec){
    return new Promise(function(resolve){
        setTimeout(function() {resolve()},msec);
    });
}

//コメントを受け取ったときの処理
ipcRenderer.on('notifyComment',(ev,message)=>{
    sendCommentFromArray(message);
});

//準備完了を通知
console.log('send boardReady event.');
ipcRenderer.send('boardReady','');

//準備完了後、メインから設定情報が飛んできたら反映する
ipcRenderer.on('settingUpdate',(ev,message)=>{
    console.log('setting update');
    mameCommentSettingData.setFromJson(message);
    setValueFromSettingData();
});


