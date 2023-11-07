var ParentMethods = {
    GetFullName: function (args){
        return args[0] + ' ' + args[1];
    },
    SayHellloFromParent: function(){
        return "Hi lovely Client!" 
    },
    Alert: function(args){
        alert(args[0]);
    }
}