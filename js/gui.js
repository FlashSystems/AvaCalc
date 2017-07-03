var gui={
	onInit: function() {
		// Initialize Cytoscape
		this.cy = cytoscape({
			container: $("#cycanvas")
		});
	},

	onAddDevice: function() {
		this.cy.add(
		{ // node nparent
			group: "nodes",
			data: { id: "container0", position: { x: 200, y: 100 } }
		});

		this.cy.add({
			group: "nodes",
			parent: "container0",
			position: { x: 200, y: 200 }
		});
	}
};