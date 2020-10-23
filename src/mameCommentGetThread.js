const MameCommentTwitCasting=require('./mameCommentTwitCasting');
const MameCommentSettingData=require('./mameCommentSettingData');
let mameCommentTwitCasting=new MameCommentTwitCasting();

var getUserName;
var mameCommentSettingData;
var movieData;


function sleep(msec){
    return new Promise(function(resolve){
        setTimeout(function() {resolve()},msec);
    });
}

function chkMovie(){
    movieData=mameCommentTwitCasting.getMovieData(getUserName,mameCommentSettingData.tokenId);
    if(movieData==undefined||movieData==null||movieData[0]==''||movieData[0]==null){
        return movie_id='ユーザーが見つかりませんでした。';
    }
    if(movieData[1]==false){
//        return movie_id='ユーザーは現在放送中ではありません。';
//test logic
        return movieData[0];
    }
    return movieData[0];
}

var stopFlg=0;
async function start(){
    var movie_id=chkMovie();
    if(movie_id=='ユーザーが見つかりませんでした。'||movie_id=='ユーザーは現在放送中ではありません。'){
        self.postMessage('error,'+movie_id);
    }else{
        self.postMessage('started,'+movie_id);
        var last_id=0;
        //初回取得分はスキップ
        var commentsArray=mameCommentTwitCasting.getCommentData(movie_id,last_id,mameCommentSettingData.tokenId);
        if(commentsArray.length!=0){
            last_id=commentsArray[commentsArray.length-1][0];
        //    self.postMessage(commentsArray);
        }
        while(true){
            if(stopFlg===1){
                break;
            }
            var commentsArray=mameCommentTwitCasting.getCommentData(movie_id,last_id,mameCommentSettingData.tokenId);
            if(commentsArray.length!=0){
                last_id=commentsArray[commentsArray.length-1][0];
                self.postMessage(commentsArray);
            }
            await sleep(1000);
        }
    }
    self.postMessage('stopped');
}

self.addEventListener('message',(message)=>{
    if(message.data=='startRequest'){
        start();
    }else if(message.data=='stopRequest'){
        stopFlg=1;
    }else{
        if(typeof message.data == 'string'){
            var messageData=message.data.split(';');
            if(messageData[0]=='user'){
                getUserName=messageData[1];
                if(messageData.length>2){
                    for(i=2;i<messageData.length;i++){
                        getUserName=getUserName+";"+messageData[i];
                    }
                }
            }
        }else{
            mameCommentSettingData=message.data;
        }
    }
});

