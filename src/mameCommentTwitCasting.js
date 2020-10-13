class MameCommentTwitCasting {

    getSelfData(ACCESS_TOKEN){
        var result=[];
        var resultString=this.verifyCredentialsWrapper(ACCESS_TOKEN);
        if(resultString.error==undefined||resultString.error==null||resultString.error==''){
            var userJson=resultString.user;
            result.push(userJson.name);
            result.push(userJson.screen_id);
            result.push(userJson.image);
        }else{
            result.push("Error");
            result.push("Error");
            result.push("./resources/blank.jpg");
        }
        return result;
    }


    getMovieData(screen_id,ACCESS_TOKEN){
        var result=[];
        if(screen_id==undefined||screen_id==null||screen_id==""){
            return null;
        }
        var resultJson=this.getUserInfoWrapper(screen_id,ACCESS_TOKEN);
        var userJson=resultJson.user;
        result.push(userJson.last_movie_id);
        result.push(userJson.is_live);
        return result;
    }

    getCommentData(movie_id,slice_id,ACCESS_TOKEN){
        var result=[];
        var tmpResult;
        var tmpComment;
        var tmpResult=new Map();

        var resultJson=this.getCommentsWrapper(movie_id,slice_id,ACCESS_TOKEN);
        var commentsJson=resultJson.comments;
        for(var i=0;i<commentsJson.length;i++){
            var commentJson=commentsJson[i];
            var commentUserJson=commentJson.from_user;
            tmpComment=[commentJson.id,commentJson.created,commentUserJson.image,commentUserJson.name,commentJson.message,commentUserJson.screen_id];
            tmpResult.set(commentJson.created,tmpComment);
        }
        var keys=Array.from(tmpResult.keys(tmpResult));
        keys.sort(this.compareFunc);
        for(var i=0;i<keys.length;i++){
            result.push(tmpResult.get(keys[i]));
        }
        return result;
    }

    postCommentData(movie_id,comment,sns,ACCESS_TOKEN){
        var result=false;
        var postData='{"comment" : "'+comment+'", "sns" : "'+sns+'"}';
        var resultString=this.postCommentWrapper(movie_id,postData,ACCESS_TOKEN);
        var jsonObject=JSON.parse(resultString.replace(/\n/g,'\\n'));
        if(jsonObject.comment.created!=null&&jsonObject.comment.ceated!=undefined&&jsonObject.comment.created!=''){
            result=true;
        }
        return result;
    }


    getUserInfoWrapper(screen_id,ACCESS_TOKEN){
        var result;
        result=this.execGetRequest('https://apiv2.twitcasting.tv/users/'+screen_id,ACCESS_TOKEN);
        return result;
    }


    verifyCredentialsWrapper(ACCESS_TOKEN){
        var result;
        result=this.execGetRequest('https://apiv2.twitcasting.tv/verify_credentials',ACCESS_TOKEN);
        return result;
    }

    getCommentsWrapper(movie_id,slice_id,ACCESS_TOKEN){
        var result;
        if(slice_id=="0"){
            result=this.execGetRequest('https://apiv2.twitcasting.tv/movies/'+movie_id+'/comments?limit=50',ACCESS_TOKEN);
        }else{
            result=this.execGetRequest('https://apiv2.twitcasting.tv/movies/'+movie_id+'/comments?slice_id='+slice_id+'&limit=50',ACCESS_TOKEN);
        }
        return result;
    }

    postCommentWrapper(movie_id,comment,ACCESS_TOKEN){
        var result;
        result=this.execPostRequest('https://apiv2.twitcasting.tv/movies/'+movie_id+'/comments',comment,ACCESS_TOKEN);
        return result;
    }

    execGetRequest(url,ACCESS_TOKEN){
        if(url==undefined||url==null||url==""){
            return null;
        }
        if(ACCESS_TOKEN==undefined||ACCESS_TOKEN==null||ACCESS_TOKEN==""){
            return null;
        }
        var xmlHttpRequest=new XMLHttpRequest();
        xmlHttpRequest.open('GET',url,false);
        xmlHttpRequest.setRequestHeader('Accept','application/json');
        xmlHttpRequest.setRequestHeader('X-Api-Version','2.0');
        xmlHttpRequest.setRequestHeader('Authorization','Bearer '+ACCESS_TOKEN);
//        xmlHttpRequest.responseType = 'json';
        xmlHttpRequest.send( null );
        return JSON.parse(xmlHttpRequest.response);
    }

    execPostRequest(url,data,ACCESS_TOKEN){
        if(url==undefined||url==null||url==""){
            return null;
        }
        if(data==undefined||data==null||data==""){
            return null;
        }
        if(ACCESS_TOKEN==undefined||ACCESS_TOKEN==null||ACCESS_TOKEN==""){
            return null;
        }
        var xmlHttpRequest=new XMLHttpRequest();
        xmlHttpRequest.open('GET',url,false);
        xmlHttpRequest.setRequestHeader('Accept','application/json');
        xmlHttpRequest.setRequestHeader('X-Api-Version','2.0');
        xmlHttpRequest.setRequestHeader('Authorization','Bearer '+ACCESS_TOKEN);
//        xmlHttpRequest.responseType = 'json';
        xmlHttpRequest.send( data );
        return JSON.parse(xmlHttpRequest.response);
    }

    compareFunc(a,b){
        return a-b;
    }
}

module.exports = MameCommentTwitCasting;