module Gui {
	interface StringMap<T> {
		[key: string]: T;
	}

	type Completions = StringMap<string[]>;
	type EditValueMap = StringMap<string|number>;

	export class Main {
		private ca: CytoscapeApi.CytoscapeApi;
		private sim: SimHandler;
		private simStartTime: number;

		constructor() {
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
			this.ca = new CytoscapeApi.CytoscapeApi();

			this.ca.on("add", this.addService.bind(this));
			this.ca.on("link", this.linkNode.bind(this));
			this.ca.on("delete", this.deleteNode.bind(this));	
			this.ca.on("edit", this.editNode.bind(this));

			this.ca.addSTP();

			// Initialize the simulation handler
			this.sim = new SimHandler();
			this.sim.on("start", this.simStart.bind(this));
			this.sim.on("done", this.simDone.bind(this));
			this.sim.on("progress", this.simProgress.bind(this));

			// Hook up events
			$("#menuSave").on("click", this.saveClick.bind(this));
			$("#menuLoad").on("click", this.loadClick.bind(this));
			$("#menuSimulateStart").on("click", this.simulateStartClick.bind(this));
			$("#menuSimulateStop").on("click", this.simulateStopClick.bind(this));
			$("#menuResetZoom").on("click", this.resetZoomClick.bind(this));
			$("#btnClear").on("click", this.clearClick.bind(this));
			$("#addDevice").on("click", this.onAddDevice.bind(this));
			$("#addService").on("click", this.onAddService.bind(this));

			// Hook up hotkeys
			$(document).on('keypress', null, "d", this.onHotkey.bind(this, "d"));
			$(document).on('keypress', null, "s", this.onHotkey.bind(this, "s"));
			$(document).on('keypress', null, "l", this.onHotkey.bind(this, "l"));
		}

		private editDialog(dialog: JQuery<Node>, values: EditValueMap, autoComplete: Completions, okCallback: (values: EditValueMap) => boolean): void {
			for (let property in values) {
				let inputBox = dialog.find("input[data-link=" + property + "]")
				inputBox.val(values[property]);

				// If the input box has the autocomplete class initialize the autocomplete
				// function with the values from the autoComplete object.
				if (inputBox.hasClass("autocomplete")) {
					if (property in autoComplete) {
						let completions: StringMap<null> = {};

						for (let value of autoComplete[property]) {
							completions[value] = null;
						}

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
				if ((<KeyboardEvent>e.originalEvent).keyCode == 13) {
					e.stopPropagation();
					dialog.find("a.btn-ok").click();
				}
			});

			dialog.find("a.btn-ok").off("click").on("click", () => {
				for (let property in values) {
					values[property] = <string>(dialog.find("input[data-link=" + property + "]").val());
				}

				let result: boolean;

				try {
					result = okCallback(values);
				}
				catch(ex) {
					result = ex;
				}

				if (result === true) {
					dialog.modal("close");
				} else {
					Materialize.toast('<span class="mdi mdi-textbox">' + result + "</span>", 3000, "error") 
				}
			});

			dialog.modal("open", {
				'ready': (modal: JQuery<Node>) => {
					modal.find("input.autofocus").first().focus();
				}
			});
		}

		/**
		 * parentNodes: An Array of Cytoscape parent nodes.
		 */
		private addService(parentNodes: CytoscapeApi.CyDevice | CytoscapeApi.CyDevice[]): void {
			if (!$.isArray(parentNodes)) parentNodes = [ parentNodes ];

			let service = new CytoscapeApi.CyService()

			let completions: Completions = {
				'name': this.ca.getNameCompletions(service)
			};

			this.editDialog($("#dlgEditService"), service.getData(), completions, (data: StringMap<string>) => {
				for (let parentNode of <CytoscapeApi.CyDevice[]>parentNodes) {
					this.ca.addService(parentNode, service);
				}

				return true;
			});
		}

		private saveClick(): void {
			$.savefile.file("text/json", "design.avac", this.ca.save());
		}

		private loadClick(): void {
			$("#loadFile").off("change").on("change", (e: JQuery.Event<HTMLElement & { files: Blob[] } >): void => {
				let reader = new FileReader();

				reader.onload = ((e: FileReaderEvent): void => {
					this.ca.load(e.target.result);
				});

				reader.readAsText(e.target.files[0], "UTF-8");
			}).click();
		}

		private simulateStartClick(): void {
			$("#menuSimulateStart").parent().hide();
			$("#menuSimulateStop").parent().show();
			this.sim.run(this.ca.getModel());
		}

		private simulateStopClick(): void {

		}

		private linkNode(node: CytoscapeApi.CyNode): void {
			this.ca.startLinking(node);
		}

		private deleteNode(node: CytoscapeApi.CyNode): void {
			this.ca.deleteNode(node);
		}

		private editNode(node: CytoscapeApi.CyNode): void {
			let completions = {
				'name': this.ca.getNameCompletions(node)
			};

			let editDialog: JQuery<Node>;

			if (node instanceof CytoscapeApi.CyService) {
				editDialog = $("#dlgEditService");
			} else if (node instanceof CytoscapeApi.CyDevice) {
				editDialog = $("#dlgEditDevice");
			}

			this.editDialog(editDialog, node.getData(), completions, (data: StringMap<string>) => {
				node.commit();

				return true;
			});
		}

		private simStart(): void {
			this.simStartTime = (new Date()).getTime();

			$("#progressBar").css("width", "0%");
			$("#simProgress").animate({
				'height': "64px"
			})
		}

		private formatDuration(ms: number): string {
			let minutes = 0;
			let seconds = 0;

			minutes = Math.floor(ms / (60*1000));
			ms -= minutes * 60 * 1000;

			seconds = Math.floor(ms / 1000);
			ms -= seconds * 1000;

			let result = "";
			if (minutes > 0) result += minutes.toString() + "m ";
			if ((seconds > 0) || (minutes > 0)) result += seconds.toString() + "s ";
			result += ms.toString() + "ms";

			return result;
		}

		private showDowntime(dst: JQuery<Node>, hoursPerWeek: number, weeks: number, ava: number): void {
			let downtime = 60 * hoursPerWeek * (1 - ava) * weeks;

			let days = 0;
			let hours = 0;
			let minutes = 0;

			days = Math.floor(downtime / (24*60));
			downtime -= days * 24 * 60;

			hours = Math.floor(downtime / 60);
			downtime -= hours * 60;

			minutes = Math.floor(downtime);

			let result = "";
			if (days > 0) result += days.toString() + "d ";
			if ((days > 0) || (hours > 0)) result += hours.toString() + "h ";
			result += minutes.toString() + "m";

			dst.text(result);
		}

		private simDone(result: Model.SimResult): void {
			let duration = (new Date()).getTime() - this.simStartTime;

			console.log(result);

			$("#simProgress").animate({
				'height': "0"
			})

			if (result.error) {
				$("#simErrorText").text(result.error);
				$("#simError").modal("open");
			} else {
				$("#simAva").text((result.availability * 100).toFixed(5));
				$("#simDuration").text(this.formatDuration(duration));

				let avaWeeks = [ 52, 4, 1];
				avaWeeks.forEach((weeks) => {
					this.showDowntime($("#ava7x24w" + weeks.toString()), 7*24, weeks, result.availability);
					this.showDowntime($("#ava5x10w" + weeks.toString()), 5*10, weeks, result.availability);
					this.showDowntime($("#ava6x8w" + weeks.toString()), 6*8, weeks, result.availability);
					this.showDowntime($("#ava5x8w" + weeks.toString()), 5*8, weeks, result.availability);
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
					for (let id of result.singlePointsOfFailure) {
						let node = this.ca.getNodeById(id);
						
						$("#spofs").append($("<li></li>", {
							'class': "spof",
							'text': node.getName()
						}));
					}

					// Show the single point of failure information on the availablity tab.
					$("#simSpofLine").show();
					$("#simSpofCount").text(result.singlePointsOfFailure.length);
				}

				// Make sure that the simResultAva Tab is shown when the dialog opens
				$("#simResultTabs").tabs('select_tab', 'simResultAva');
				$("#simResult").modal("open", {
					'ready': (modal: JQuery<Node>) => {
						// THe tab will not be selected correctly if it is selected before the dialog opens.
						modal.find("#simResultTabs").first().tabs('select_tab', 'simResultAva');
					}
				});
			}

			// Restore the simulation button
			$("#menuSimulateStop").parent().hide();
			$("#menuSimulateStart").parent().show();
		}

		private simProgress(progress: number): void {
			$("#progressBar").css("width", progress.toString() + "%");
		}

		private onAddDevice(): void {
			let device = new CytoscapeApi.CyDevice();

			let completions = {
				'name': this.ca.getNameCompletions(device)
			};

			this.editDialog($("#dlgEditDevice"), device.getData(), completions, (data: StringMap<string>) => {
				this.ca.addDevice(device);

				return true;
			});
		}

		private onAddService(): void {
			// Remove all nodes that are not devices
			let selectedNodes = this.ca.getSelected().filter((node) => {
				return node instanceof CytoscapeApi.CyDevice;
			});

			if (selectedNodes.length > 0)
			{
				this.addService(selectedNodes);
			}
			else
			{
				Materialize.toast('<span class="mdi mdi-alert">Please select a parent device first.</span>', 3000, "error") 
			}
		}

		private resetZoomClick(): void {
			this.ca.resetZoom();
		}

		private clearClick(): void {
			this.ca.clear();
			this.ca.addSTP();
		}

		private onHotkey(key: string): void {
			// Hotkeys only work if no modal is visible
			if ($(".modal:visible").length === 0) {
				switch (key) {
					case "d":
						this.onAddDevice();
						break;
					case "s":
						this.onAddService();
						break;
					case "l":
						let selectedNodes = this.ca.getSelected();
						if (selectedNodes.length === 1) this.linkNode(selectedNodes[0]);
						break;
				}
			}
		}
	}
}