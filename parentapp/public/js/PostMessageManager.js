var PostMessageManager = {
    Instances:{
        // parent tan gelen key/value mantığı ile request nesnelerini depolayan objedir 
        Responses:{}
    },
    Method: {
        CreateRequestMessage: function (methodName, args, callBack){
            var requestObject = {
                RequestId: this.CreateRequestId(),
                MethodName: methodName,
                Arguments: args,
                CallBack: callBack,
                Origin: window.location.origin
            };

            return {Message: PostMessageManager.Constants.ParentHeader + JSON.stringify(requestObject),RequestId:requestObject.RequestId};
        },
        CreateResponseMessage: function (requestId, result){
            var responseObject = {
                RequestId: requestId,
                Result: result
            };

            return PostMessageManager.Constants.ChildHeader + JSON.stringify(responseObject)
        },
        ChildListener: function (){
           var childListenerFunc = function (event) {
                if(PostMessageManager.ValidationMethods.CheckMessageHeaders(event.data,true)){
                    var parentMessage = JSON.parse(event.data.split(PostMessageManager.Constants.ChildHeader)[1]);
                    PostMessageManager.Instances.Responses[parentMessage.RequestId]=parentMessage;
                }
            };
            console.info("Child Listener registered on: " + window.location.href);
            window.addEventListener("message", childListenerFunc);
        },
        SendResultToSource: function(evnt,responseMessage){
            evnt.source.postMessage(responseMessage,evnt.origin)
        },
        SendRequestToParent: function(methodName, args){
            var wnd = window.top;
            var parentRequestMessage = this.CreateRequestMessage(methodName,args, null);
            wnd.postMessage(parentRequestMessage.Message,'http://localhost:3000');
            return parentRequestMessage.RequestId;
        },
        GetResponseFromParent: async function(requestId){
            await this.WaitResponseWithPromise();
            // while((Date.now() - startTime < 2000)) {
            //     if(PostMessageManager.Instances.Responses[requestId]){
            //         return PostMessageManager.Instances.Responses[requestId].Result;
            //     }
            // }
            console.log("whiledan çıktı.");

            return PostMessageManager.Instances.Responses[requestId] ? PostMessageManager.Instances.Responses[requestId].Result : null;
        },
        WaitResponseWithPromise: async function(requestId){
            var startTime = Date.now();
            
            return  new Promise (function(resolve, reject){
                while((Date.now() - startTime < 2000)){
                    if(PostMessageManager.Instances.Responses[requestId]){
                        resolve(PostMessageManager.Instances.Responses[requestId].Result);
                        return;
                    }
                }
                reject();
            });
        },
        HandleParentPostMessage: function (event) {
            var childMessage = JSON.parse(event.data.split(PostMessageManager.Constants.ParentHeader)[1]);
            var result = null;
            if(!ParentMethods[childMessage.MethodName]){
                result = "";
            }else{
                result = ParentMethods[childMessage.MethodName](childMessage.Arguments);
            }
            if (childMessage.CallBack){
                childMessage.CallBack();
            }
            var responseObjectStr = this.CreateResponseMessage(childMessage.RequestId, result);
            this.SendResultToSource(event, responseObjectStr)
        },
        ParentListener: function (){
            console.info("Parent Listener registered on: " + window.location.href);
            window.addEventListener("message", function (event){
                if(PostMessageManager.ValidationMethods.CheckMessageHeaders(event.data,false)){
                    PostMessageManager.Method.HandleParentPostMessage(event);   
                }
            });
        },
        CreateRequestId: function () {  
           return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {  
              var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);  
              return v.toString(16);  
           });  
        }
    },
    ValidationMethods:{
        // isForChild argument i ile hangi window için kontrol edileceğini önceden söylüyoruz.
        CheckMessageHeaders: function (data, forChild){
            if(!data || typeof data !== "string"){
                return false;
            }

            if(forChild === true){
                return data.indexOf(PostMessageManager.Constants.ChildHeader) !== -1;
            }
                
            return data.indexOf(PostMessageManager.Constants.ParentHeader) !== -1;
        }
    },
    Constants: {
        ParentHeader: "PaReNtHeAdEr",
        ChildHeader: "ChIlDhEaDeR"
    },
    Listen: function (){
        if(window.name =="parent"){
            PostMessageManager.Method.ParentListener();
            return;
        }
        PostMessageManager.Method.ChildListener();
        // parent veya iframe göre listener işlemini başlatır.
        // window name property si üzerinden hangi window a ait olduğunu anlayacağız.
    }
};
PostMessageManager.Listen();
async function CallMethodViaPostMessage(methodName,args){
    let requestId = PostMessageManager.Method.SendRequestToParent(methodName,args);
    var result = await PostMessageManager.Method.GetResponseFromParent(requestId);
    return result;
}

async function CallParentMethod(methodName, args){
    if(window.name == "parent"){
        return ParentMethods[methodName](args);
    }
    return CallMethodViaPostMessage(methodName,args);
}

var $Parent= {
    GetFullName : async function (name, surname){
        return CallParentMethod("GetFullName",[name, surname]);
    },
    SayHellloFromParent: function (){
        return CallParentMethod("SayHellloFromParent",null);
    },
    Alert: function(text){
        CallParentMethod("Alert", [text])
    }
}