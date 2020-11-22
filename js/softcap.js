/*

This code is taken from NG+++ on which I, pg132, am a contributor

*/

/*
To make a new softcap using this function
1) Create an element of softcap_data which contains
  - The name of it (string, used in displays only)
  - Integers starting from 1 which are dicts
    - These dicts contains a function name, starting value
      and other variables from softcap_vars based on which function you choose
2) Add to getSoftcapAmtFromId like the other functions, except after the =>
   put whatever function takes the output result of said softcap (to see which ones were active)
3a) In updateSoftcapStatsTab add a entry like the others with a name
3b) Go to index.html and find were all the others are stored and store it in a similar fasion
4) Smile :)
*/

var softcap_data = {
	a_eff: {
		1: {
			func: "log",
			start: 10,
			mul: 10,
			active(){
				return !hasUpgrade("a", 33)
			},
		},
		2: {
			func: "pow",
			start: 1e4,
			pow: .5,
			derv: true
		},
	},
	b_eff: {
		1: {
			func: "log",
			start: 10,
			mul: 10,
		},
	},
	c_eff: {
		1: {
			func: "pow",
			start: 30,
			pow: .8,
			derv: true
		},
	},
	b_upg11: {
		1: {
			func: "log",
			start: 10,
			mul: 10,
		},
		2: {
			func: "pow",
			start: 20,
			pow: .3,
			derv: true
		},
	},
	a_buy13: {
		1: {
			func: "log",
			start: 10,
			mul: 5,
			add: 5
		},
		2: {
			func: "pow",
			start: 15,
			pow: .3,
			derv: true
		}
	}
}

var softcap_vars = {
	pow: ["start", "pow", "derv"],
	log: ["pow", "mul", "add", "start"],
}

var softcap_funcs = {
	pow(x, start, pow, derv = false) {
		x = Decimal.div(x, start).pow(pow)
		if (derv && pow != 0) x = x.sub(1).div(pow).add(1)
		x = x.times(start)
		return x
	},
	log(x, pow = 1, mul = 1, add = 0) { 
		let x2 = Decimal.pow(x.log10().times(mul).add(add), pow)
		return Decimal.min(x, x2)
	},
}

function do_softcap(x, data, num) {
	var data = data[num]
	if (data === undefined) return "stop"

	var func = data.func
	var vars = softcap_vars[func]

	var start = 0
	var v = [data[vars[0]], data[vars[1]], data[vars[2]], data[vars[3]], data.active]
	for (let i = 0; i < 5; i++) {
		if (typeof v[i] == "function") v[i] = v[i]()
		if (vars[i] == "start") start = v[i]
	}

	if (v[3] === false) return x 

	var canSoftcap = false
	if (!start || x.gt(start)) canSoftcap = true

	if (canSoftcap) return softcap_funcs[func](x, v[0], v[1], v[2])
	return "stop"
}

function softcap(x, id) { 
	x = new Decimal(x)
	var data = softcap_data[id]

	if (data == undefined) {
		console.log("there is no softcap at " + id)
		return
	}

	var sc = 1
	var stopped = false
	while (true) {
		var y = do_softcap(x, data, sc)
		sc++
		if (y !== "stop") x = y
		else break
	}
	return x
}