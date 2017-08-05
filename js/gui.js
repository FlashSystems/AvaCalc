'use strict';

var Gui = oo.Base({
	_init: function() {
		// Initialize Materialize components
		$(".modal").modal();

		$('.dropdown-button').dropdown({
			constrainWidth: false,
			gutter: 0,
			belowOrigin: true,
			alignment: 'right',
		});

		$('ul.tabs').tabs();

		$(".tooltipped").tooltip({
			'position': "bottom",
			'delay': 500
		});

		// Initialize Cytoscape
		this.ca = new CytoscapeApi();

		this.ca.on("add", this._addService.bind(this));
		this.ca.on("link", this._linkNode.bind(this));
		this.ca.on("delete", this._deleteNode.bind(this));	
		this.ca.on("edit", this._editNode.bind(this));

		this.ca.addSTP();

		// Initialize the simulation handler
		this.sim = new SimHandler();
		this.sim.on("start", this._simStart.bind(this));
		this.sim.on("done", this._simDone.bind(this));
		this.sim.on("progress", this._simProgress.bind(this));

		// Hook up events
		$("#menuSave").on("click", this._saveClick.bind(this));
		$("#menuLoad").on("click", this._loadClick.bind(this));
		$("#menuSimulateStart").on("click", this._simulateStartClick.bind(this));
		$("#menuSimulateStop").on("click", this._simulateStopClick.bind(this));
		$("#menuResetZoom").on("click", this._resetZoomClick.bind(this));
		$("#btnClear").on("click", this._clearClick.bind(this));
		$("#addDevice").on("click", this._onAddDevice.bind(this));
		$("#addService").on("click", this._onAddService.bind(this));
	},

	_editDialog: function(dialog, values, autoComplete, okCallback) {
		for (var property in values) {
			var inputBox = dialog.find("input[data-link=" + property + "]")
			inputBox.val(values[property]);

			// If the input box has the autocomplete class initialize the autocomplete
			// function with the values from the autoComplete object.
			if (inputBox.hasClass("autocomplete")) {
				if (property in autoComplete) {
					var completions = {};

					autoComplete[property].forEach((value) => {
						completions[value] = null;
					});

					inputBox.autocomplete({
						'data': completions,
						'limit': 10,
						'minLength': 2
					});
				} else {
					console.log("Autocomplete values missing for #" + property);
				}
			}
		}

		dialog.find("input.allowenter").off("keypress").on("keypress", (e) => {
			// If enter was pressed, intercept and trigger the ok-button
			if (e.originalEvent.keyCode == 13) {
				e.stopPropagation();
				dialog.find("a.btn-ok").click();
			}
		});

		dialog.find("a.btn-ok").off("click").on("click", () => {
			for (var property in values) {
				values[property] = dialog.find("input[data-link=" + property + "]").val();
			}

			try {
				var result = okCallback(values);
			}
			catch(ex) {
				result = ex;
			}

			if (result === true) {
				dialog.modal("close");
			} else {
				Materialize.toast('<i class="material-icons">text_format</i>' + result, 3000, "error") 
			}
		});

		dialog.modal("open", {
			'ready': (modal, trigger) => {
				modal.find("input.autofocus").first().focus();
			}
		});
	},

	/**
	 * parentNodes: An Array of Cytoscape parent nodes.
	 */
	_addService: function(parentNodes) {
		if (!$.isArray(parentNodes)) parentNodes = [ parentNodes ];

		var service = new CyService();

		var completions = {
			'name': this.ca.getNameCompletions(service)
		};

		this._editDialog($("#dlgEditService"), service.getData(), completions, (data) => {
			parentNodes.forEach((parentNode) => {
				this.ca.addService(parentNode, service);
			});

			return true;
		});
	 },

	_saveClick: function() {
		$.savefile.file("text/json", "design.avac", this.ca.save());
	},

	_loadClick: function() {
		$("#loadFile").off("change").on("change", (e) => {
			var reader = new FileReader();

			reader.onload = ((e) => {
				this.ca.load(e.target.result);
			});

			reader.readAsText(e.target.files[0], "UTF-8");
		}).click();
	},

	_simulateStartClick: function() {
		$("#menuSimulateStart").parent().hide();
		$("#menuSimulateStop").parent().show();
		this.sim.run(this.ca.getModel());
	},

	_simulateStopClick: function() {

	},

	_linkNode: function(node) {
		this.ca.startLinking(node);
	},

	_deleteNode: function(node) {
		this.ca.deleteNode(node);
	},

	_editNode: function(node) {
		var completions = {
			'name': this.ca.getNameCompletions(node)
		};

		var editDialog = "";
		if (node.isInstanceOf(CyService)) {
			editDialog = $("#dlgEditService");
		} else if (node.isInstanceOf(CyDevice)) {
			editDialog = $("#dlgEditDevice");
		}

		this._editDialog(editDialog, node.getData(), completions, (data) => {
			node.commit();

			return true;
		});
	},

	_simStart: function() {
		this._simStart = (new Date()).getTime();

		$("#progressBar").css("width", "0%");
		$("#simProgress").animate({
			'height': "64px"
		})
	},

	_formatDuration: function(ms) {
		var minutes = 0;
		var seconds = 0;

		minutes = Math.floor(ms / (60*1000));
		ms -= minutes * 60 * 1000;

		seconds = Math.floor(ms / 1000);
		ms -= seconds * 1000;

		var result = "";
		if (minutes > 0) result += minutes.toString() + "m ";
		if ((seconds > 0) || (minutes > 0)) result += seconds.toString() + "s ";
		result += ms.toString() + "ms";

		return result;
	},

	_showDowntime: function(dst, hoursPerWeek, weeks, ava) {
		var downtime = 60 * hoursPerWeek * (1 - ava) * weeks;

		var days = 0;
		var hours = 0;
		var minutes = 0;

		days = Math.floor(downtime / (24*60));
		downtime -= days * 24 * 60;

		hours = Math.floor(downtime / 60);
		downtime -= hours * 60;

		minutes = Math.floor(downtime);

		var result = "";
		if (days > 0) result += days.toString() + "d ";
		if ((days > 0) || (hours > 0)) result += hours.toString() + "h ";
		result += minutes.toString() + "m";

		dst.text(result);
	},

	_simDone: function(result) {
		var duration = (new Date()).getTime() - this._simStart;

		$("#simProgress").animate({
			'height': "0"
		})

		$("#simAva").text((result.availability * 100).toFixed(5));
		$("#simDuration").text(this._formatDuration(duration));

		var avaWeeks = [ 52, 4, 1];
		avaWeeks.forEach((weeks) => {
			this._showDowntime($("#ava7x24w" + weeks.toString()), 7*24, weeks, result.availability);
			this._showDowntime($("#ava5x10w" + weeks.toString()), 5*10, weeks, result.availability);
			this._showDowntime($("#ava6x8w" + weeks.toString()), 6*8, weeks, result.availability);
			this._showDowntime($("#ava5x8w" + weeks.toString()), 5*8, weeks, result.availability);
		});

		$("#spofs").empty();
		if (result.singlePointsOfFailure.length === 0) {
			$("#spofs").append($("<li></li>", {
				'class': "nospof",
				'text': "No single points of failure found.",
			}));

			// Hide the single point of failure information on the availablity tab.
			$("#simSpofLine").hide();
		} else {
			result.singlePointsOfFailure.forEach((id) => {
				var node = this.ca.getNodeById(id);
				
				$("#spofs").append($("<li></li>", {
					'class': "spof",
					'text': node.getName()
				}));
			});

			// Show the single point of failure information on the availablity tab.
			$("#simSpofLine").show();
			$("#simSpofCount").text(result.singlePointsOfFailure.length);
		}

		$('#simResultTabs').tabs('select_tab', 'simResultAva');
		$("#simResult").modal("open");

		// Restore the simulation button
		$("#menuSimulateStop").parent().hide();
		$("#menuSimulateStart").parent().show();
	},

	_simProgress: function(progress) {
		$("#progressBar").css("width", progress + "%");
	},

	_onAddDevice: function() {
		var device = new CyDevice();

		var completions = {
			'name': this.ca.getNameCompletions(device)
		};

		this._editDialog($("#dlgEditDevice"), device.getData(), completions, (data) => {
			this.ca.addDevice(device);

			return true;
		});
	},

	_onAddService: function() {
		// Remove all nodes that are not devices
		var selectedNodes = this.ca.getSelected().filter((node) => {
			return oo.isInterfaceOf(node, CyDevice);
		});

		if (selectedNodes.length > 0)
		{
			this._addService(selectedNodes);
		}
		else
		{
			Materialize.toast('<i class="material-icons">warning</i>Please select a parent device first.', 3000, "error") 
		}
	},	

	_resetZoomClick: function() {
		this.ca.resetZoom();
	},

	_clearClick: function() {
		this.ca.clear();
		this.ca.addSTP();
	}
});
