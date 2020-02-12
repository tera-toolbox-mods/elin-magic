(function() {
	'use strict'

	Vue.component('sliders', { template: '<table class="sliders"><slot></slot></table>' })
	Vue.component('slider-h', { template: '<tr><td class="slider-h" colspan="2"><slot></slot></td></tr>' })
	Vue.component('slider', {
		props: {
			name: true,
			max: { default: 31 },
			value: true
		},
		template: '<tr><td>{{name}}</td><td class="slider-controls"><input type="text" style="width: 30px" :maxlength="max.toString().length" :value="value" @input="$emit(\'input\', $event.target.value)"> <input type="range" min="0" :max="max" value="0" :value="value" @input="$emit(\'input\', $event.target.value)"></td></tr>'
	})

	window.vue = new Vue({
		el: '#app',
		data: {
			tab: 'appearance',
			emVars: emVars
		},
		computed: {
			race: function() { return Math.floor(this.emVars.templateId / 100) % 100 - 1 },
			gender: function() { return (Math.floor(this.emVars.templateId / 100) - 1) % 2 }
		}
	})

	for(var n in emVars)
		(function() {
			var name = n

			window.vue.$watch(function() { return this.emVars[name] }, function(val) {
				$.post('/ipc', JSON.stringify([name, val]))
			})
		})()
})()