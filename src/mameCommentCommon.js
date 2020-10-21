const fs=require('fs');

class MameCommentCommon{
    openLog(fileName,mode){
        return fs.openSync(__dirname+'/'+fileName,mode);
    }

    closeLog(fd){
        fs.closeSync(fd);
        fd=null;
    }

    writeLog(logMessage,fd){
        if (fd!=null){
            var nowDate=new Date();
            var year=nowDate.getFullYear();
            var month=('0'+ (nowDate.getMonth()+1)).slice(-2);
            var day=('0'+nowDate.getDay()).slice(-2);
            var hour=('0'+nowDate.getHours()).slice(-2);
            var min=('0'+nowDate.getMinutes()).slice(-2);
            var sec=('0'+nowDate.getSeconds()).slice(-2);
            this.writeLogWoTime(year+'/'+month+'/'+day+' '+hour+':'+min+':'+sec+' '+logMessage,fd);
        }
    }

    writeLogWoTime(logMessage,fd){
        fs.writeFileSync(fd,logMessage+'\n','utf8');
        console.log(logMessage);
    }

}
module.exports = MameCommentCommon;