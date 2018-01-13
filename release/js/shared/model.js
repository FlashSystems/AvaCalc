define(["require","exports"],function(t,i){"use strict";Object.defineProperty(i,"__esModule",{value:!0});!function(t){t[t.Device=0]="Device",t[t.Service=1]="Service"}(i.LinkType||(i.LinkType={}));var e=function(){function t(t){this.id=t}return t.prototype.toJSON=function(){return{_class:"Stp",id:this.id}},t.fromJSON=function(i){return new t(i.id)},t}();i.Stp=e;var n=function(){function t(t,i,e){this.id=t,this.name=i,this.capacity=e}return t.prototype.toJSON=function(){return{_class:"Service",id:this.id,name:this.name,capacity:this.capacity}},t.fromJSON=function(i){return new t(i.id,i.name,i.capacity)},t}();i.Service=n;var r=function(){function t(t,i,e){this.serviceList=[],this.id=t,this.ava=i,this.selfRedundant=e}return Object.defineProperty(t.prototype,"services",{get:function(){return this.serviceList.slice()},enumerable:!0,configurable:!0}),t.prototype.addService=function(t){this.serviceList.push(t)},t.prototype.toJSON=function(){return{_class:"Device",id:this.id,ava:this.ava,selfRedundant:this.selfRedundant,services:this.serviceList}},t.fromJSON=function(i){for(var e=new t(i.id,i.ava,i.selfRedundant),n=0,r=i.services;n<r.length;n++){var s=r[n];e.addService(s)}return e},t}();i.Device=r;var s=function(){function t(t,i,e){this.type=t,this.from=i,this.to=e}return t.prototype.toJSON=function(){return{"_class:":"Link",type:this.type,from:this.from,to:this.to}},t.fromJSON=function(i){return new t(i.type,i.from,i.to)},t}();i.Link=s;var o=function(){function t(t){this.deviceList=[],this.linkList=[],this.stp=t}return Object.defineProperty(t.prototype,"devices",{get:function(){return this.deviceList.slice()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"links",{get:function(){return this.linkList.slice()},enumerable:!0,configurable:!0}),t.prototype.addDevice=function(t){this.deviceList.push(t)},t.prototype.addLink=function(t){this.linkList.push(t)},t.prototype.toJSON=function(){return{_class:"Model",stp:this.stp,devices:this.deviceList,links:this.linkList}},t.fromJSON=function(i){for(var e=new t(i.stp),n=0,r=i.devices;n<r.length;n++){var s=r[n];e.addDevice(s)}for(var o=0,c=i.links;o<c.length;o++){var u=c[o];e.addLink(u)}return e},t}();i.Model=o;var c=function(){function t(t,i,e){this.error=e,this.availability=t,this.singlePointsOfFailure=i}return t.prototype.combine=function(i){return null!=this.error?this:null!=i.error?i:new t(this.availability+i.availability,this.singlePointsOfFailure.concat(i.singlePointsOfFailure))},t.prototype.toJSON=function(){return{_class:"Result",availability:this.availability,singlePointsOfFailure:this.singlePointsOfFailure,error:this.error}},t.fromJSON=function(i){return new t(i.availability,i.singlePointsOfFailure,i.error)},t}();i.SimResult=c,i.inflater=function(t,i){if(!(i instanceof Object&&"_class"in i))return i;switch(i._class){case"Model":return o.fromJSON(i);case"Link":return s.fromJSON(i);case"Device":return r.fromJSON(i);case"Service":return n.fromJSON(i);case"Stp":return e.fromJSON(i);case"Result":return c.fromJSON(i)}}});