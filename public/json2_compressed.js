if(!this.JSON){
this.JSON={};
}
(function(){
function f(n){
return n<10?"0"+n:n;
}
if(typeof Date.prototype.toJSON!=="function"){
Date.prototype.toJSON=function(_2){
return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null;
};
String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(_3){
return this.valueOf();
};
}
var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,_5=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,_6,_7,_8={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r","\"":"\\\"","\\":"\\\\"},_9;
function quote(_a){
_5.lastIndex=0;
return _5.test(_a)?"\""+_a.replace(_5,function(a){
var c=_8[a];
return typeof c==="string"?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4);
})+"\"":"\""+_a+"\"";
}
function str(_d,_e){
var i,k,v,_12,_13=_6,_14,_15=_e[_d];
if(_15&&typeof _15==="object"&&typeof _15.toJSON==="function"){
_15=_15.toJSON(_d);
}
if(typeof _9==="function"){
_15=_9.call(_e,_d,_15);
}
switch(typeof _15){
case "string":
return quote(_15);
case "number":
return isFinite(_15)?String(_15):"null";
case "boolean":
case "null":
return String(_15);
case "object":
if(!_15){
return "null";
}
_6+=_7;
_14=[];
if(Object.prototype.toString.apply(_15)==="[object Array]"){
_12=_15.length;
for(i=0;i<_12;i+=1){
_14[i]=str(i,_15)||"null";
}
v=_14.length===0?"[]":_6?"[\n"+_6+_14.join(",\n"+_6)+"\n"+_13+"]":"["+_14.join(",")+"]";
_6=_13;
return v;
}
if(_9&&typeof _9==="object"){
_12=_9.length;
for(i=0;i<_12;i+=1){
k=_9[i];
if(typeof k==="string"){
v=str(k,_15);
if(v){
_14.push(quote(k)+(_6?": ":":")+v);
}
}
}
}else{
for(k in _15){
if(Object.hasOwnProperty.call(_15,k)){
v=str(k,_15);
if(v){
_14.push(quote(k)+(_6?": ":":")+v);
}
}
}
}
v=_14.length===0?"{}":_6?"{\n"+_6+_14.join(",\n"+_6)+"\n"+_13+"}":"{"+_14.join(",")+"}";
_6=_13;
return v;
}
}
if(typeof JSON.stringify!=="function"){
JSON.stringify=function(_16,_17,_18){
var i;
_6="";
_7="";
if(typeof _18==="number"){
for(i=0;i<_18;i+=1){
_7+=" ";
}
}else{
if(typeof _18==="string"){
_7=_18;
}
}
_9=_17;
if(_17&&typeof _17!=="function"&&(typeof _17!=="object"||typeof _17.length!=="number")){
throw new Error("JSON.stringify");
}
return str("",{"":_16});
};
}
if(typeof JSON.parse!=="function"){
JSON.parse=function(_1a,_1b){
var j;
function walk(_1d,key){
var k,v,_21=_1d[key];
if(_21&&typeof _21==="object"){
for(k in _21){
if(Object.hasOwnProperty.call(_21,k)){
v=walk(_21,k);
if(v!==undefined){
_21[k]=v;
}else{
delete _21[k];
}
}
}
}
return _1b.call(_1d,key,_21);
}
_1a=String(_1a);
cx.lastIndex=0;
if(cx.test(_1a)){
_1a=_1a.replace(cx,function(a){
return "\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4);
});
}
if(/^[\],:{}\s]*$/.test(_1a.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,""))){
j=eval("("+_1a+")");
return typeof _1b==="function"?walk({"":j},""):j;
}
throw new SyntaxError("JSON.parse");
};
}
}());

