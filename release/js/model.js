"use strict";var Model;!function(t){!function(t){t[t.Device=0]="Device",t[t.Service=1]="Service"}(t.LinkType||(t.LinkType={}));var i=function(){function t(t){this.id=t}return t.prototype.toJSON=function(){return{_class:"Stp",id:this.id}},t.fromJSON=function(i){return new t(i.id)},t}();t.Stp=i;var e=function(){function t(t,i,e){this.id=t,this.name=i,this.capacity=e}return t.prototype.toJSON=function(){return{_class:"Service",id:this.id,name:this.name,capacity:this.capacity}},t.fromJSON=function(i){return new t(i.id,i.name,i.capacity)},t}();t.Service=e;var r=function(){function t(t,i){this.serviceList=[],this.id=t,this.ava=i}return Object.defineProperty(t.prototype,"services",{get:function(){return this.serviceList.slice()},enumerable:!0,configurable:!0}),t.prototype.addService=function(t){this.serviceList.push(t)},t.prototype.toJSON=function(){return{_class:"Device",id:this.id,ava:this.ava,services:this.serviceList}},t.fromJSON=function(i){for(var e=new t(i.id,i.ava),r=0,n=i.services;r<n.length;r++){var s=n[r];e.addService(s)}return e},t}();t.Device=r;var n=function(){function t(t,i,e){this.type=t,this.from=i,this.to=e}return t.prototype.toJSON=function(){return{"_class:":"Link",type:this.type,from:this.from,to:this.to}},t.fromJSON=function(i){return new t(i.type,i.from,i.to)},t}();t.Link=n;var s=function(){function t(t){this.deviceList=[],this.linkList=[],this.stp=t}return Object.defineProperty(t.prototype,"devices",{get:function(){return this.deviceList.slice()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"links",{get:function(){return this.linkList.slice()},enumerable:!0,configurable:!0}),t.prototype.addDevice=function(t){this.deviceList.push(t)},t.prototype.addLink=function(t){this.linkList.push(t)},t.prototype.toJSON=function(){return{_class:"Model",stp:this.stp,devices:this.deviceList,links:this.linkList}},t.fromJSON=function(i){for(var e=new t(i.stp),r=0,n=i.devices;r<n.length;r++){var s=n[r];e.addDevice(s)}for(var o=0,c=i.links;o<c.length;o++){var a=c[o];e.addLink(a)}return e},t}();t.Model=s;var o=function(){function t(t,i,e){this.error=e,this.availability=t,this.singlePointsOfFailure=i}return t.prototype.combine=function(i){return null!=this.error?this:null!=i.error?i:new t(this.availability+i.availability,this.singlePointsOfFailure.concat(i.singlePointsOfFailure))},t.prototype.toJSON=function(){return{_class:"Result",availability:this.availability,singlePointsOfFailure:this.singlePointsOfFailure,error:this.error}},t.fromJSON=function(i){return new t(i.availability,i.singlePointsOfFailure,i.error)},t}();t.SimResult=o,t.inflater=function(t,c){if(!(c instanceof Object&&"_class"in c))return c;switch(c._class){case"Model":return s.fromJSON(c);case"Link":return n.fromJSON(c);case"Device":return r.fromJSON(c);case"Service":return e.fromJSON(c);case"Stp":return i.fromJSON(c);case"Result":return o.fromJSON(c)}}}(Model||(Model={}));