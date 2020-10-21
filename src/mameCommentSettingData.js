
const fs=require('fs');

class MameCommentSettingData {
    constructor() {
        this.replyUrl="" ;
        this.tokenId="" ;
        this.logFlg=false ;
        this.logPath="" ;
        this.boardX=0 ;
        this.boardY=0 ;
        this.boardWidth=0 ;
        this.boardHeight=0 ;
        this.boardFontName="" ;
        this.boardLineNum=0 ;
        this.boardFontColor="" ;
        this.boardBackgroundColor="" ;
        this.viewerX=0 ;
        this.viewerY=0 ;
        this.viewerWidth=0 ;
        this.viewerHeight=0 ;
        this.viewerFontName="" ;
        this.viewerFontSize=0 ;
        this.viewerFontColor="" ;
        this.viewerBackgroundColor="" ;
        this.viewerTime="";
        this.viewerImage="";
        this.viewerName="";
    }

    readFromIni(){
        let data=fs.readFileSync(__dirname+'/mameCommentSetting.ini','utf8');
        let ary=data.split('\n');
        for (var i=0;i<ary.length;i++){
            var lineData=ary[i].split('=');
            if(lineData[0]!=''){
                if(eval ("typeof this."+lineData[0]+"!='undefined'")){
                    if(lineData[1]!=""){
                        var lineString='=lineData[1]';
                        if(lineData.length!=2){
                            for(var j=2;j<lineData.length;j++){
                                lineString=lineString+'+\'=\'+lineData['+j+']';
                            }
                        }
                        eval("this."+lineData[0]+lineString);
                    }
                }
            }
        }
    }

    writeToIni(){
        let data='replyUrl='+this.replyUrl+'\n';
        data=data+'tokenId='+this.tokenId+'\n';
        data=data+'logFlg='+this.logFlg+'\n';
        data=data+'logPath='+this.logPath+'\n';
        data=data+'boardX='+this.boardX+'\n';
        data=data+'boardY='+this.boardY+'\n';
        data=data+'boardWidth='+this.boardWidth+'\n';
        data=data+'boardHeight='+this.boardHeight+'\n';
        data=data+'boardLineNum='+this.boardLineNum+'\n';
        data=data+'boardFontColor='+this.boardFontColor+'\n';
        data=data+'boardBackgroundColor='+this.boardBackgroundColor+'\n';
        data=data+'viewerX='+this.viewerX+'\n';
        data=data+'viewerY='+this.viewerY+'\n';
        data=data+'viewerWidth='+this.viewerWidth+'\n';
        data=data+'viewerHeight='+this.viewerHeight+'\n';
        data=data+'viewerTime='+this.viewerTime+'\n';
        data=data+'viewerImage='+this.viewerImage+'\n';
        data=data+'viewerName='+this.viewerName+'\n';
        fs.writeFileSync(__dirname+'/mameCommentSetting.ini',data,'utf8');
    }

    setFromJson(jsonString){
        console.log('set called.');
        var keys=Object.keys(jsonString);
        for(var i=0;i<keys.length;i++){
            if(eval('typeof this.'+keys[i]+'!==\'undefined\'')){
                if(eval('jsonString.'+keys[i]+'!=\'\'')){
                    eval('this.'+keys[i]+'=jsonString.'+keys[i]);
                }
            }
        }
    }

    copyUrlToToken(){
        if(this.replyUrl.match(/access_token=/)){
            console.log('replyURL='+this.replyUrl);
            this.tokenId=(this.replyUrl.split('access_token=')[1]).split('&')[0];
            console.log('replyURL='+this.replyUrl);
        }else{
            this.tokenId='';
        }
    }

}

module.exports = MameCommentSettingData;