function getFullName(){
    var fullname =  $Parent.GetFullName("Muhammed Emin","KARABOĞA");
    document.getElementById("fullNameParagrah").innerText = "Result: " + fullname;
}


function sayHelloParagraph(){
    var text = $Parent.SayHellloFromParent();
    document.getElementById("sayHelloParagraph").innerText = "Result: " + text;
}