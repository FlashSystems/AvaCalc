define(["require","exports"],function(e,i){"use strict";Object.defineProperty(i,"__esModule",{value:!0});var t=function(){return function(e,i,t){this.error=t,this.availability=e,this.singlePointsOfFailure=i}}();i.Result=t;var s=function(){function e(e,i){this.deviceMask=new Array(e),this.deviceAva=new Array(e),this.deviceNoSpof=new Array(e),this.visitedDevices=new Array(e),this.requiredSvcCount=new Array(i),this.activeSvcCount=new Array(i),this.activeSvcMap=new Array(i),this.availability=0,this.singlePointsOfFailure=[],this.deviceMask.fill(!0),this.requiredSvcCount.fill(0)}return e.prototype.reset=function(){this.visitedDevices.fill(!1),this.activeSvcCount.fill(0);for(var e=0;e<this.activeSvcMap.length;e++)this.activeSvcMap[e]={}},e}(),r=function(){function e(e,i,t){this.parents=[],this.childrenOfType={},this.serviceName=i,this.serviceId=e.getNextServiceId(),this.capacityPct=t}return e.prototype.addChild=function(e){e.addParent(this)},e.prototype.addParent=function(e){this.parents.push(e)},e.prototype.getName=function(){return this.serviceName},e.prototype.id=function(){return this.serviceId},e.prototype.getCapacityPct=function(){return this.capacityPct},e.prototype.isActive=function(e){return e.activeSvcCount[this.serviceId]>e.requiredSvcCount[this.serviceId]},e.prototype.initCtx=function(e){for(var i=0,t=this.parents;i<t.length;i++){var s=t[i];this.serviceName in e.activeSvcMap[s.id()]||(e.requiredSvcCount[s.id()]++,e.activeSvcMap[s.id()][this.serviceName]=0)}},e.prototype.propagateActivation=function(e){if(this.isActive(e))for(var i=0,t=this.parents;i<t.length;i++)t[i].simulateContribute(e,this)},e.prototype.simulateDeviceActivate=function(e){e.activeSvcCount[this.serviceId]++,this.propagateActivation(e)},e.prototype.simulateContribute=function(e,i){var t=i.getName();t in e.activeSvcMap[this.serviceId]||(e.activeSvcMap[this.serviceId][t]=0),e.activeSvcMap[this.serviceId][t]<100&&(e.activeSvcMap[this.serviceId][t]+=i.getCapacityPct(),e.activeSvcMap[this.serviceId][t]>=100&&(e.activeSvcCount[this.serviceId]++,this.propagateActivation(e)))},e}();i.Service=r;var c=function(){function e(e,i,t){this.children=[],this.services=[],this.stpInstance=e,this.ava=i,this.selfRedundant=t,this.deviceId=this.stpInstance.getNextDeviceId()}return e.prototype.newDevice=function(e,i){void 0===i&&(i=!1);var t=this.stpInstance.newDevice(e,i);return this.link(t),t},e.prototype.newService=function(e,i){if(this.services.some(function(i){return i.getName()===e}))throw"Duplicate service name";var t=new r(this.stpInstance,e,i);return this.services.push(t),t},e.prototype.link=function(e,i){void 0===i&&(i=!1),this.children.push(e),i||e.link(this,!0)},e.prototype.id=function(){return this.deviceId},e.prototype.initCtx=function(e){if(!e.visitedDevices[this.deviceId]){e.visitedDevices[this.deviceId]=!0,e.deviceAva[this.deviceId]=this.ava,e.deviceNoSpof[this.deviceId]=this.selfRedundant,this.children.sort(function(e,i){return i.services.length-e.services.length});for(var i=0,t=this.services;i<t.length;i++)t[i].initCtx(e);for(var s=0,r=this.children;s<r.length;s++)r[s].initCtx(e)}},e.prototype.simulate=function(e,i){if(!e.visitedDevices[this.deviceId]&&(e.visitedDevices[this.deviceId]=!0,e.deviceMask[this.deviceId])){for(var t=0,s=this.services;t<s.length;t++)s[t].simulateDeviceActivate(e);if(null==i||!i.isActive(e))for(var r=0,c=this.children;r<c.length;r++)c[r].simulate(e,i)}},e}();i.Device=c;var n=function(){function e(){this.numDevices=0,this.numServices=0,this.rootDevice=new c(this,1,!0),this.rootService=new r(this,".",100)}return e.prototype.getNextDeviceId=function(){var e=this.numDevices;return this.numDevices++,e},e.prototype.getNextServiceId=function(){var e=this.numServices;return this.numServices++,e},e.prototype.getRootDevice=function(){return this.rootDevice},e.prototype.getRootService=function(){return this.rootService},e.prototype.newDevice=function(e,i){if(isNaN(e)||!isFinite(e)||e<0||e>1)throw"Invalid argument";return new c(this,e,i)},e.prototype.recurseMask=function(e,i,t,s,r,c){var n,v;if(c[s]){if(e.reset(),this.getRootService().simulateDeviceActivate(e),this.getRootDevice().simulate(e,0==t?null:this.getRootService()),v=this.getRootService().isActive(e),0===t){for(var o=0,a=0,h=e.visitedDevices;a<h.length;a++)h[a]&&o++;if(o!==e.visitedDevices.length)throw"Not all devices are reachable from the STP. Please check the connections between the devices and the STP.";if(!1===v)throw"Your design does not work with all devices available. Please check the capacity of the services."}if(!v&&1===t)for(d=1;d<this.numDevices;d++)if(!e.deviceMask[d]&&!e.deviceNoSpof[d]){e.singlePointsOfFailure.push(d);break}n=e.visitedDevices.slice()}else v=!0,n=c;if(v){for(var u=1,d=0;d<this.numDevices;d++)e.deviceMask[d]?u*=e.deviceAva[d]:u*=1-e.deviceAva[d];(t>0||1==s)&&(e.availability=e.availability+u);for(var p=0==t?r:1,d=s;d<this.numDevices;d+=p)i&&i(d,this.numDevices),e.deviceMask[d]&&(e.deviceMask[d]=!1,this.recurseMask(e,void 0,t+1,d,r,n),e.deviceMask[d]=!0)}},e.prototype.calculate=function(e,i,r){var c=new s(this.numDevices,this.numServices);if(e<=i)throw"Invalid number of threads or thread number.";c.reset(),this.rootDevice.initCtx(c);try{return this.recurseMask(c,r,0,i+1,e,new Array(this.numDevices).fill(!0)),new t(c.availability,c.singlePointsOfFailure)}catch(e){return new t(0,[],e)}},e}();i.Stp=n});