'use strict';

var Events = oo.Base({
	_init: function() {
		this.events = {};
	},

	on: function(eventName, callback)	{
		this.events[eventName] = callback;
	},

	off: function(eventName, callback) {
		delete this.events[eventName];
	},

	get: function(eventName) {
		return this.events[eventName];
	},

	trigger: function(eventName, eventData) {
		if (eventName in this.events) {
			this.events[eventName](eventData);
		}
	},

	pass: function(eventName, passToTarget) {
		var eventFunc = passToTarget.get(eventName);
		if (eventFunc) this.events[eventName] = eventFunc;
	}
});