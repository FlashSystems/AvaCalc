"use strict";var Gui;!function(t){var i=function(){function t(){$(".modal").modal({ready:function(t){var i=t.find("ul.tabs li a.active").first();i.length>0&&i.parent().parent().tabs("select_tab",i.attr("href").substring(1)),t.find("input.autofocus").first().focus()}}),$(".dropdown-button").dropdown({constrainWidth:!1,gutter:0,belowOrigin:!0,alignment:"right"}),$("ul.tabs").tabs(),$(".tooltipped").tooltip({position:"bottom",delay:500}),this.ca=new CytoscapeApi.CytoscapeApi,this.ca.on("add",this.addService.bind(this)),this.ca.on("link",this.linkNode.bind(this)),this.ca.on("delete",this.deleteNode.bind(this)),this.ca.on("edit",this.editNode.bind(this)),this.ca.on("clone",this.cloneNode.bind(this)),this.ca.addSTP(),this.sim=new SimHandler,this.sim.on("start",this.simStart.bind(this)),this.sim.on("done",this.simDone.bind(this)),this.sim.on("progress",this.simProgress.bind(this));var t=this.sim.getNumWorkers();$("#cores").text(t+" "+(t>1?"parallel threads":"thread")),$("#menuSave").on("click",this.saveClick.bind(this)),$("#menuLoad").on("click",this.loadClick.bind(this)),$("#menuSimulateStart").on("click",this.simulateStartClick.bind(this)),$("#menuSimulateStop").on("click",this.simulateStopClick.bind(this)),$("#menuResetZoom").on("click",this.resetZoomClick.bind(this)),$("#btnClear").on("click",this.clearClick.bind(this)),$("#addDevice").on("click",this.onAddDevice.bind(this)),$("#addService").on("click",this.onAddService.bind(this)),$("#alignHorizontal").on("click",this.onAlignH.bind(this)),$("#alignVertical").on("click",this.onAlignV.bind(this)),$("#distributeHorizontal").on("click",this.onDistributeH.bind(this)),$("#distributeVertical").on("click",this.onDistributeV.bind(this)),$(document).on("keypress",null,"d",this.onHotkey.bind(this,"d")),$(document).on("keypress",null,"s",this.onHotkey.bind(this,"s")),$(document).on("keypress",null,"l",this.onHotkey.bind(this,"l")),$(document).on("keypress",null,"c",this.onHotkey.bind(this,"c"))}return t.prototype.editDialog=function(t,i,e,o){for(var n in i){var a=t.find("input[data-link="+n+"]");if(a.val(i[n]),a.hasClass("autocomplete"))if(n in e){for(var s={},r=0,l=e[n];r<l.length;r++)s[l[r]]=null;a.autocomplete({data:s,limit:10,minLength:2})}else console.log("Autocomplete values missing for #"+n)}t.find("input.allowenter").off("keypress").on("keypress",function(i){13==i.originalEvent.keyCode&&(i.stopPropagation(),t.find("a.btn-ok").click())}),t.find("a.btn-ok").off("click").on("click",function(){for(var e in i){var n=t.find("input[data-link="+e+"]");n.length>0&&(i[e]=n.val())}var a;try{a=o(i)}catch(t){a=t}!0===a?t.modal("close"):Materialize.toast('<span class="mdi mdi-textbox">'+a+"</span>",3e3,"error")}),t.modal("open")},t.prototype.addService=function(t){var i=this;$.isArray(t)||(t=[t]);var e=new CytoscapeApi.CyService,o={name:this.ca.getNameCompletions(e)};this.editDialog($("#dlgEditService"),e.getData(),o,function(o){for(var n=0,a=t;n<a.length;n++){var s=a[n];i.ca.addService(s,e)}return!0})},t.prototype.saveClick=function(){$.savefile.file("text/json","design.avac",this.ca.save())},t.prototype.loadClick=function(){var t=this;$("#loadFile").off("change").on("change",function(i){var e=new FileReader;e.onload=function(i){t.ca.load(i.target.result)},e.readAsText(i.target.files[0],"UTF-8")}).click()},t.prototype.simulateStartClick=function(){$("#menuSimulateStart").parent().hide(),$("#menuSimulateStop").parent().show(),this.sim.run(this.ca.getModel())},t.prototype.simulateStopClick=function(){},t.prototype.linkNode=function(t){this.ca.startLinking(t)},t.prototype.deleteNode=function(t){this.ca.deleteNode(t)},t.prototype.editNode=function(t){var i,e={name:this.ca.getNameCompletions(t)};t instanceof CytoscapeApi.CyService?i=$("#dlgEditService"):t instanceof CytoscapeApi.CyDevice&&(i=$("#dlgEditDevice")),this.editDialog(i,t.getData(),e,function(i){return t.commit(),!0})},t.prototype.cloneNode=function(t){var i=this;if(t instanceof CytoscapeApi.CyDevice){var e={name:this.ca.getNameCompletions(t)},o=$("#dlgCloneDevice");this.editDialog(o,t.getData(),e,function(e){var o=t.enumServices();i.ca.addDevice(t);for(var n=0,a=o;n<a.length;n++){var s=a[n];i.ca.addService(t,s)}return!0})}},t.prototype.simStart=function(){$("#progressBar").css("width","0%"),$("#simProgress").animate({height:"64px"});var t=this.sim.getNumWorkers();$("#runningWorkers").text(t+" "+(t>1?"parallel threads":"thread")),this.simStartTime=(new Date).getTime()},t.prototype.formatDuration=function(t){var i=0,e=0;t-=60*(i=Math.floor(t/6e4))*1e3,t-=1e3*(e=Math.floor(t/1e3));var o="";return i>0&&(o+=i.toString()+"m "),(e>0||i>0)&&(o+=e.toString()+"s "),o+=t.toString()+"ms"},t.prototype.showDowntime=function(t,i,e,o){var n=60*i*(1-o)*e,a=0,s=0,r=0;n-=24*(a=Math.floor(n/1440))*60,n-=60*(s=Math.floor(n/60)),r=Math.floor(n);var l="";a>0&&(l+=a.toString()+"d "),(a>0||s>0)&&(l+=s.toString()+"h "),l+=r.toString()+"m",t.text(l)},t.prototype.simDone=function(t){var i=this,e=(new Date).getTime()-this.simStartTime;if($("#simProgress").animate({height:"0"}),t.error)$("#simErrorText").text(t.error),$("#simError").modal("open");else{if($("#simAva").text((100*t.availability).toFixed(5)),$("#simDuration").text(this.formatDuration(e)),[52,4,1].forEach(function(e){i.showDowntime($("#ava7x24w"+e.toString()),168,e,t.availability),i.showDowntime($("#ava5x10w"+e.toString()),50,e,t.availability),i.showDowntime($("#ava6x8w"+e.toString()),48,e,t.availability),i.showDowntime($("#ava5x8w"+e.toString()),40,e,t.availability)}),$("#spofs").empty(),0===t.singlePointsOfFailure.length)$("#spofs").append($("<li></li>",{class:"nospof",text:"No single points of failure found."})),$("#simSpofLine").hide();else{for(var o=0,n=t.singlePointsOfFailure;o<n.length;o++){var a=n[o],s=this.ca.getNodeById(a);$("#spofs").append($("<li></li>",{class:"spof",text:s.getName()}))}$("#simSpofLine").show(),$("#simSpofCount").text(t.singlePointsOfFailure.length)}$("#simResultTabs").tabs("select_tab","simResultAva"),$("#simResult").modal("open")}$("#menuSimulateStop").parent().hide(),$("#menuSimulateStart").parent().show()},t.prototype.simProgress=function(t){$("#progressBar").css("width",t.progress.toString()+"%"),$("#runningWorkers").text(t.activeWorkers+" "+(t.activeWorkers>1?"parallel threads":"thread"))},t.prototype.onAddDevice=function(){var t=this,i=new CytoscapeApi.CyDevice,e={name:this.ca.getNameCompletions(i)};this.editDialog($("#dlgEditDevice"),i.getData(),e,function(e){return t.ca.addDevice(i),!0})},t.prototype.onAddService=function(){var t=this.ca.getSelected().filter(function(t){return t instanceof CytoscapeApi.CyDevice});t.length>0?this.addService(t):Materialize.toast('<span class="mdi mdi-alert">Please select a parent device first.</span>',3e3,"error")},t.prototype.resetZoomClick=function(){this.ca.resetZoom()},t.prototype.clearClick=function(){this.ca.clear(),this.ca.addSTP()},t.prototype.onAlignV=function(){this.ca.alignSelected(CytoscapeApi.AlignMode.Vertical)},t.prototype.onAlignH=function(){this.ca.alignSelected(CytoscapeApi.AlignMode.Horizontal)},t.prototype.onDistributeV=function(){this.ca.distributeSelected(CytoscapeApi.AlignMode.Vertical)},t.prototype.onDistributeH=function(){this.ca.distributeSelected(CytoscapeApi.AlignMode.Horizontal)},t.prototype.onHotkey=function(t){var i=this.ca.getSelected();if(0===$(".modal:visible").length)switch(t){case"d":this.onAddDevice();break;case"s":this.onAddService();break;case"c":1===i.length&&i[0]instanceof CytoscapeApi.CyNode&&this.cloneNode(i[0]);break;case"l":1===i.length&&this.linkNode(i[0])}},t}();t.Main=i}(Gui||(Gui={}));