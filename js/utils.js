// ************ Number formatting ************

function addCommas(s){
	if (s.length <= 3) return s
	let rem = s.length % 3
	if (rem == 0) rem = 3
	return s.slice(0, rem) + "," + addCommas(s.slice(rem))
}


function exponentialFormat(num, precision) {
	let e = num.log10().floor()
	let m = num.div(Decimal.pow(10, e))
	if (m.toStringWithDecimalPlaces(precision) == 10) {
		m = new Decimal(1)
		e = e.add(1)
	}
	let end = e.toStringWithDecimalPlaces(0)
	if (!end.includes("e")) end = addCommas(end)
	let start = ""
	if (e.lt(1e9)) start = m.toStringWithDecimalPlaces(precision)
	return start + "e" + end
}

function commaFormat(num, precision) {
	if (num === null || num === undefined) return "NaN"
	if (num.lt(Decimal.pow(10, precision * -1))) return (0).toFixed(precision)
	return addCommas(num.toStringWithDecimalPlaces())
}


function regularFormat(num, precision) {
	if (num === null || num === undefined) return "NaN"
	if (num.mag < Math.pow(10, -precision)) return (0).toFixed(precision)
	return num.toStringWithDecimalPlaces(precision)
}

function fixValue(x, y = 0) {
	return x || new Decimal(y)
}

function sumValues(x) {
	x = Object.values(x)
	if (!x[0]) return new Decimal(0)
	return x.reduce((a, b) => Decimal.add(a, b))
}

function format(decimal, precision=2,) {
	decimal = new Decimal(decimal)
	if (isNaN(decimal.sign)||isNaN(decimal.layer)||isNaN(decimal.mag)) {
		player.hasNaN = true;
		Decimal(0)
		
		return "NaN"
	}
	if (decimal.sign<0) return "-"+format(decimal.neg(), precision)
	if (decimal.mag == Number.POSITIVE_INFINITY) return "Infinity"
	if (decimal.gte("eeee10")) {
		var slog = decimal.slog()
		if (slog.gte(1e5)) return "F" + formatWhole(slog.floor())
		if (slog.gte(1e4)) return Decimal.pow(10, slog.sub(slog.floor())).toStringWithDecimalPlaces(0) + "F" + commaFormat(slog.floor(), 0)
		if (slog.gte(100)) return Decimal.pow(10, slog.sub(slog.floor())).toStringWithDecimalPlaces(2) + "F" + commaFormat(slog.floor(), 0)
		else return Decimal.pow(10, slog.sub(slog.floor())).toStringWithDecimalPlaces(4) + "F" + commaFormat(slog.floor(), 0)
	} else if (decimal.gte("ee20")) return "e" + format(decimal.log10(), precision)
	else if (decimal.gte("ee12")) return "e" + format(decimal.log10(), 4)
	else if (decimal.gte(1e9)) return exponentialFormat(decimal, precision)
	else if (decimal.gte(1e3)) return commaFormat(decimal, 0)
	else return regularFormat(decimal, precision)
}

function formatWhole(decimal) {
	decimal = new Decimal(decimal)
	if (decimal.gte(1e9)) return format(decimal, 2)
	if (decimal.lte(0.98) && !decimal.eq(0)) return format(decimal, 2)
	return format(decimal, 0)
}

function formatTime(s) {
	if (s<60) return format(s)+"s"
	else if (s<3600) return formatWhole(Math.floor(s/60))+"m "+format(s%60)+"s"
	else return formatWhole(Math.floor(s/3600))+"h "+formatWhole(Math.floor(s/60)%60)+"m "+format(s%60)+"s"
}

function toPlaces(x, precision, maxAccepted) {
	x = new Decimal(x)
	let result = x.toStringWithDecimalPlaces(precision)
	if (new Decimal(result).gte(maxAccepted)) {
		result = new Decimal(maxAccepted-Math.pow(0.1, precision)).toStringWithDecimalPlaces(precision)
	}
	return result
}
// ************ Save stuff ************

var logSave = false
function save() {
	localStorage.setItem(modInfo.id, btoa(JSON.stringify(player)))
	if (logSave) console.log("saved at " + new Date().getTime())
}

function startPlayerBase() {
	return {
		tab: "tree",
		time: Date.now(),
		autosave: true,
		notify: {},
		msDisplay: "always",
		offlineProd: true,
		versionType: modInfo.id,
		version: VERSION.num,
		beta: VERSION.beta,
		timePlayed: 0,
		keepGoing: false,
		hasNaN: false,
		hideChallenges: false,
		showStory: true,
		points: modInfo.initialStartPoints,
		subtabs: {},
	}
}

function getStartPlayer() {
	playerdata = startPlayerBase()
	
	if (addedPlayerData) {
		extradata = addedPlayerData()
		for (thing in extradata)
			playerdata[thing] = extradata[thing]
	}

	playerdata.infoboxes = {}
	for (layer in layers){
		playerdata[layer] = layers[layer].startData()
		playerdata[layer].buyables = getStartBuyables(layer)
		if (playerdata[layer].clickables == undefined) playerdata[layer].clickables = getStartClickables(layer)
		playerdata[layer].spentOnBuyables = new Decimal(0)
		playerdata[layer].upgrades = []
		playerdata[layer].milestones = []
		playerdata[layer].achievements = []
		playerdata[layer].challenges = getStartChallenges(layer)
		if (layers[layer].tabFormat != undefined && !Array.isArray(layers[layer].tabFormat)) {
			playerdata.subtabs[layer] = {}
			playerdata.subtabs[layer].mainTabs = Object.keys(layers[layer].tabFormat)[0]
		}
		if (layers[layer].microtabs != undefined) {
			if (playerdata.subtabs[layer] == undefined) playerdata.subtabs[layer] = {}
			for (item in layers[layer].microtabs) {
				playerdata.subtabs[layer][item] = Object.keys(layers[layer].microtabs[item])[0]
			}
		}
		if (layers[layer].infoboxes != undefined) {
			if (playerdata.infoboxes[layer] == undefined) playerdata.infoboxes[layer] = {}
			for (item in layers[layer].infoboxes) {
				playerdata.infoboxes[layer][item] = false
			}
		}
	}
	return playerdata
}


function getStartBuyables(layer){
	let data = {}
	if (layers[layer].buyables) {
		for (id in layers[layer].buyables) {
			if (!isNaN(id)) data[id] = new Decimal(0)
		}
	}
	return data
}

function getStartClickables(layer){
	let data = {}
	if (layers[layer].clickables) {
		for (id in layers[layer].clickables) {
			if (!isNaN(id)) data[id] = ""
		}
	}
	return data
}

function getStartChallenges(layer){
	let data = {}
	if (layers[layer].challenges) {
		for (id in layers[layer].challenges) {
			if (!isNaN(id)) data[id] = 0
		}
	}
	return data
}

function fixSave() {
	defaultData = getStartPlayer()
	fixData(defaultData, player)

	for (layer in layers) {
		if (player[layer].best !== undefined) player[layer].best = new Decimal(player[layer].best)
		if (player[layer].total !== undefined) player[layer].total = new Decimal(player[layer].total)

		if (layers[layer].tabFormat != undefined && !Array.isArray(layers[layer].tabFormat)) {
			if(!Object.keys(layers[layer].tabFormat).includes(player.subtabs[layer].mainTabs)) player.subtabs[layer].mainTabs = Object.keys(layers[layer].tabFormat)[0]
		}
		if (layers[layer].microtabs != undefined) {
			for (item in layers[layer].microtabs)
				if(!Object.keys(layers[layer].microtabs[item]).includes(player.subtabs[layer][item])) player.subtabs[layer][item] = Object.keys(layers[layer].microtabs[item])[0]
		}
	}
}

function fixData(defaultData, newData) {
	for (item in defaultData){
		if (defaultData[item] == null) {
			if (newData[item] === undefined)
				newData[item] = null
		}
		else if (Array.isArray(defaultData[item])) {
			if (newData[item] === undefined)
				newData[item] = defaultData[item]
			else fixData(defaultData[item], newData[item])
		}
		else if (defaultData[item] instanceof Decimal) { // Convert to Decimal
			if (newData[item] === undefined)
				newData[item] = defaultData[item]
			else newData[item] = new Decimal(newData[item])
		}
		else if ((!!defaultData[item]) && (typeof defaultData[item] === "object")) {
			if (newData[item] === undefined || (typeof defaultData[item] !== "object")) {
				newData[item] = defaultData[item]
			} else fixData(defaultData[item], newData[item])
		}
		else {
			if (newData[item] === undefined) newData[item] = defaultData[item]
		}
	}	
}

function load() {
	let get = localStorage.getItem(modInfo.id);
	if (get===null || get===undefined) player = getStartPlayer()
	else player = Object.assign(getStartPlayer(), JSON.parse(atob(get)))
	fixSave()

	player.tab = "tree"
	if (player.offlineProd) {
		if (player.offTime === undefined) player.offTime = { remain: 0 }
		player.offTime.remain += (Date.now() - player.time) / 1000
	}
	player.time = Date.now();
	versionCheck();
	changeTheme();
	changeTreeQuality();
	updateLayers()
	setupModInfo()

	setupTemp();
	updateCurrentDepthValues()
	updateGamesRewards()
	updateTemp();
	updateTemp();
	loadVue();
}

function setupModInfo() {
	modInfo.changelog = changelog
	modInfo.winText = winText ? winText : `Congratulations! You have reached the end and beaten this game, but for now...`

}

function fixNaNs() {
	NaNcheck(player)
}

function NaNcheck(data) {
	for (item in data){
		if (data[item] == null) {
		}
		else if (Array.isArray(data[item])) {
			NaNcheck(data[item])
		}
		else if (data[item] !== data[item] || data[item] === decimalNaN){
			if (NaNalert === true || confirm ("Invalid value found in player, named '" + item + "'. Please let the creator of this mod know! Would you like to try to auto-fix the save and keep going?")){
				NaNalert = true
				data[item] = (data[item] !== data[item] ? 0 : decimalZero)
			}
			else {
				clearInterval(interval);
				player.autosave = false;
				NaNalert = true;
			}
		}
		else if (data[item] instanceof Decimal) { // Convert to Decimal
		}
		else if ((!!data[item]) && (data[item].constructor === Object)) {
			NaNcheck(data[item])
		}
	}	
}


function exportSave() {
	let str = btoa(JSON.stringify(player))
	
	const el = document.createElement("textarea");
	el.value = str;
	document.body.appendChild(el);
	el.select();
    	el.setSelectionRange(0, 99999);
	document.execCommand("copy");
	document.body.removeChild(el);
}

function importSave(imported=undefined, forced=false) {
	if (imported===undefined) imported = prompt("Paste your save here")
	try {
		tempPlr = Object.assign(getStartPlayer(), JSON.parse(atob(imported)))
		if(tempPlr.versionType != modInfo.id && !forced && !confirm("This save appears to be for a different mod! Are you sure you want to import?")) // Wrong save (use "Forced" to force it to accept.)
			return
		player = tempPlr;
		player.versionType = modInfo.id
		fixSave()	
		save()
		window.location.reload()
	} catch(e) {
		return;
	}
}

function versionCheck() {
	let setVersion = true
	
	if (player.versionType===undefined||player.version===undefined) {
		player.versionType = modInfo.id
		player.version = 0
	}
	
	if (setVersion) {
		if (player.versionType == modInfo.id && VERSION.num > player.version) player.keepGoing = false
		player.versionType = getStartPlayer().versionType
		player.version = VERSION.num
		player.beta = VERSION.beta
	}
}

var saveInterval = setInterval(function() {
	if (player===undefined) return;
	if (gameEnded&&!player.keepGoing) return;
	if (player.autosave) save();
}, 5000)

// ************ Themes ************

const themes = {
	1: "aqua"
}
const theme_names = {
	aqua: "Aqua"
}

function changeTheme() {
	let aqua = player.theme == "aqua"
	colors_theme = colors[player.theme || "default"]
	document.body.style.setProperty('--background', aqua ? "#001f3f" : "#0f0f0f")
	document.body.style.setProperty('--background_tooltip', aqua ? "rgba(0, 15, 31, 0.75)" : "rgba(0, 0, 0, 0.75)")
	document.body.style.setProperty('--color', aqua ? "#bfdfff" : "#dfdfdf")
	document.body.style.setProperty('--points', aqua ? "#dfefff" : "#ffffff")
	document.body.style.setProperty("--locked", aqua ? "#c4a7b3" : "#bf8f8f")
}

function getThemeName() {
	return player.theme ? theme_names[player.theme] : "Default"
}

function switchTheme() {
	if (player.theme === undefined) player.theme = themes[1]
	else {
		player.theme = themes[Object.keys(themes)[player.theme] + 1]
		if (!player.theme) delete player.theme
	}
	changeTheme()
	resizeCanvas()
}

// ************ Options ************

function toggleOpt(name) {
	if (name == "oldStyle" && styleCooldown>0) return;

	player[name] = !player[name]
	if (name == "hqTree") changeTreeQuality()
	if (name == "oldStyle") updateStyle()
}

var styleCooldown = 0;


function updateStyle() {
	styleCooldown = 1;
	let css = document.getElementById("styleStuff")
	css.href = player.oldStyle?"oldStyle.css":"style.css"
	needCanvasUpdate = true;
}

function changeTreeQuality() {
	var on = player.hqTree
	document.body.style.setProperty('--hqProperty1', on ? "2px solid" : "4px solid")
	document.body.style.setProperty('--hqProperty2a', on ? "-4px -4px 4px rgba(0, 0, 0, 0.25) inset" : "-4px -4px 4px rgba(0, 0, 0, 0) inset")
	document.body.style.setProperty('--hqProperty2b', on ? "0px 0px 20px var(--background)" : "")
	document.body.style.setProperty('--hqProperty3', on ? "2px 2px 4px rgba(0, 0, 0, 0.25)" : "none")
}

function toggleAuto(toggle) {
	player[toggle[0]][toggle[1]] = !player[toggle[0]][toggle[1]] 
}

function adjustMSDisp() {
	let displays = ["always", "automation", "incomplete", "never"];
	player.msDisplay = displays[(displays.indexOf(player.msDisplay)+1)%4]
}

function milestoneShown(layer, id) {
	complete = player[layer].milestones.includes(id)
	auto = layers[layer].milestones[id].toggles

	switch(player.msDisplay) {
		case "always": 
			return true;
			break;
		case "automation": 
			return (auto)||!complete
			break;
		case "incomplete":
			return !complete
			break;
		case "never": 
			return false;
			break;
	}
	return false;
}



// ************ Big Feature related ************

function respecBuyables(layer) {
	if (!layers[layer].buyables) return
	if (!layers[layer].buyables.respec) return
	if (!confirm("Are you sure you want to respec? This will force you to do a \"" + (tmp[layer].name ? tmp[layer].name : layer) + "\" reset as well!")) return
	run(layers[layer].buyables.respec, layers[layer].buyables)
	updateBuyableTemp(layer)
	document.activeElement.blur()
}

function canAffordUpgrade(layer, id) {
	let upg = tmp[layer].upgrades[id]
	let cost = tmp[layer].upgrades[id].cost
	return canAffordPurchase(layer, upg, cost) 
}

function hasUpgrade(layer, id){
	return (player[layer].upgrades.includes(toNumber(id)) || player[layer].upgrades.includes(id.toString()))
}

function hasMilestone(layer, id){
	return (player[layer].milestones.includes(toNumber(id)) || player[layer].milestones.includes(id.toString()))
}

function hasAchievement(layer, id){
	return (player[layer].achievements.includes(toNumber(id)) || player[layer].achievements.includes(id.toString()))
}

function hasChallenge(layer, id){
	return challengeCompletions(layer, id)
}

function challengeCompletions(layer, id){
	return (player[layer].challenges[id])
}

function getBuyableAmount(layer, id){
	return (player[layer].buyables[id])
}

function setBuyableAmount(layer, id, amt){
	player[layer].buyables[id] = amt
}

function getClickableState(layer, id){
	return (player[layer].clickables[id])
}

function setClickableState(layer, id, state){
	player[layer].clickables[id] = state
}

function upgradeEffect(layer, id){
	return (tmp[layer].upgrades[id].effect)
}

function challengeEffect(layer, id){
	return (tmp[layer].challenges[id].effect)
}

function buyableEffect(layer, id){
	return (tmp[layer].buyables[id].effect)
}

function clickableEffect(layer, id){
	return (tmp[layer].clickables[id].effect)
}

function achievementEffect(layer, id){
	return (tmp[layer].achievements[id].effect)
}

function canAffordPurchase(layer, thing, cost) {
	if (thing.currencyInternalName != undefined){
		let name = thing.currencyInternalName
		if (thing.currencyLocation != undefined){
			return !(thing.currencyLocation[name].lt(cost)) 
		} else if (thing.currencyLayer != undefined){
			let lr = thing.currencyLayer
			return !(player[lr][name].lt(cost)) 
		} else {
			return !(player[name].lt(cost))
		}
	} else {
		return player[layer].points.gte(cost)
	}
}

function buyUpgrade(layer, id) {
	buyUpg(layer, id)
}

function buyUpg(layer, id) {
	if (!tmp[layer].upgrades || !tmp[layer].upgrades[id]) return
	let upg = tmp[layer].upgrades[id]
	if (!player[layer].unlocked) return
	if (!tmp[layer].upgrades[id].unlocked) return
	if (player[layer].upgrades.includes(id)) return
	if (upg.canAfford === false) return
	let pay = layers[layer].upgrades[id].pay
	if (pay !== undefined)
		run(pay, layers[layer].upgrades[id])
	else 
		{
		let cost = tmp[layer].upgrades[id].cost

		if (upg.currencyInternalName){
			let name = upg.currencyInternalName
			if (upg.currencyLocation){
				if (upg.currencyLocation[name].lt(cost)) return
				upg.currencyLocation[name] = upg.currencyLocation[name].sub(cost)
			}
			else if (upg.currencyLayer){
				let lr = upg.currencyLayer
				if (player[lr][name].lt(cost)) return
				player[lr][name] = player[lr][name].sub(cost)
			}
			else {
				if (player[name].lt(cost)) return
				player[name] = player[name].sub(cost)
			}
		}
		else {
			if (player[layer].points.lt(cost)) return
			player[layer].points = player[layer].points.sub(cost)	
		}
	}
	player[layer].upgrades.push(id);
	if (upg.onPurchase != undefined)
		run(upg.onPurchase, upg)
}

/*
function buyMaxBuyable(layer, id) {
	if (!player[layer].unlocked) return
	if (!tmp[layer].buyables[id].unlocked) return
	if (!tmp[layer].buyables[id].canAfford) return
	if (!layers[layer].buyables[id].buyMax) return

	run(layers[layer].buyables[id].buyMax, layers[layer].buyables[id])
	updateBuyableTemp(layer)
}
*/

function buyBuyable(layer, id) {
	if (!player[layer].unlocked) return
	if (!tmp[layer].buyables[id].unlocked) return
	if (!tmp[layer].buyables[id].canAfford) return
	/*
	if (layers[layer].buyables[id].buyMax && canBuyMax(layer, id)) {
		buyMaxBuyable(layer, id)
		return
	}
	*/

	run(layers[layer].buyables[id].buy, layers[layer].buyables[id])
	updateBuyableTemp(layer)
}

function clickClickable(layer, id) {
	if (!player[layer].unlocked) return
	if (!tmp[layer].clickables[id].unlocked) return
	if (!tmp[layer].clickables[id].canClick) return

	run(layers[layer].clickables[id].onClick, layers[layer].clickables[id])
	updateClickableTemp(layer)
}

// Function to determine if the player is in a challenge
function inChallenge(layer, id){
	let challenge = player[layer].activeChallenge
	if (challenge == null) return
	id = toNumber(id)
	if (challenge == id) return true

	if (!layers[layer].challenges[challenge].countsAs) return
	
	return tmp[layer].challenges[challenge].countsAs.includes(id)
}

// ************ Misc ************

var onTreeTab = true
function showTab(name) {
	if (LAYERS.includes(name) && !layerunlocked(name)) return
	if (player.tab === name && isPlainObject(tmp[name].tabFormat)) {
		player.subtabs[name].mainTabs = Object.keys(layers[name].tabFormat)[0]
	}
	var toTreeTab = name == "none"
	player.tab = name
	if (player.navTab == "none" && (tmp[name].row !== "side") && (tmp[name].row !== "otherside")) player.lastSafeTab = name
	delete player.notify[name]
	needCanvasUpdate = true
	document.activeElement.blur()
}

function showNavTab(name) {
	if (LAYERS.includes(name) && !layerunlocked(name)) return

	var toTreeTab = name == "tree"
	player.tab = name
	
	if (toTreeTab != onTreeTab) {
		document.getElementById("treeTab").className = toTreeTab ? "fullWidth" : "col left"
		onTreeTab = toTreeTab
		resizeCanvas()
	}
	delete player.notify[name]
}

function notifyLayer(name) {
	if (player.tab == name || !layerunlocked(name)) return
	player.notify[name] = 1
}

function nodeShown(layer) {
	if (layerShown(layer)) return true
	switch(layer) {
		case "idk":
			return player.l.unlocked
			break;
	}
	return false
}

function layerunlocked(layer) {
	return LAYERS.includes(layer) && (player[layer].unlocked || (tmp[layer].baseAmount.gte(tmp[layer].requires) && tmp[layer].layerShown))
}

function keepGoing() {
	player.keepGoing = true;
	showTab("tree")
}

function toNumber(x) {
	if (x.mag !== undefined) return x.toNumber()
	if (x + 0 !== x) return parseFloat(x)
	return x
}

function updateMilestones(layer){
	for (id in layers[layer].milestones){
		if (!(player[layer].milestones.includes(id)) && layers[layer].milestones[id].done()){
			player[layer].milestones.push(id)
			if (tmp[layer].milestonePopups || tmp[layer].milestonePopups === undefined) doPopup("milestone", tmp[layer].milestones[id].requirementDescription, "Milestone Gotten!", 3, tmp[layer].color);
		}
	}
}

function updateAchievements(layer){
	for (id in layers[layer].achievements){
		if (!isNaN(id) && !(player[layer].achievements.includes(id)) && layers[layer].achievements[id].done()) {
			player[layer].achievements.push(id)
			if (layers[layer].achievements[id].onComplete) layers[layer].achievements[id].onComplete()
			if (tmp[layer].achievementPopups || tmp[layer].achievementPopups === undefined) doPopup("achievement", tmp[layer].achievements[id].name, "Achievement Gotten!", 3, tmp[layer].color);
		}
	}
}

function addTime(diff, layer) {
	let data = player
	let time = data.timePlayed
	if (layer) {
		data = data[layer]
		time = data.time
	}

	//I am not that good to perfectly fix that leak. ~ DB Aarex
	if (time + 0 !== time) {
		console.log("Memory leak detected. Trying to fix...")
		time = toNumber(time)
		if (isNaN(time) || time == 0) {
			console.log("Couldn't fix! Resetting...")
			time = layer ? player.timePlayed : 0
			if (!layer) player.timePlayedReset = true
		}
	}
	time += toNumber(diff)

	if (layer) data.time = time
	else data.timePlayed = time
}

document.onkeydown = function(e) {
	if (player===undefined) return;
	if (gameEnded&&!player.keepGoing) return;
	let shiftDown = e.shiftKey
	let ctrlDown = e.ctrlKey
	let key = e.key
	if (ctrlDown) key = "ctrl+" + key
	if (onFocused) return
	if (ctrlDown && hotkeys[key]) e.preventDefault()
	if(hotkeys[key]){
		if (player[hotkeys[key].layer].unlocked)
			hotkeys[key].onPress()
	}
}

var onFocused = false
function focused(x) {
	onFocused = x
}

function prestigeButtonText(layer)
{
	if (layers[layer].prestigeButtonText !== undefined)
		return layers[layer].prestigeButtonText()
	else if(tmp[layer].type == "normal")
		return `${ player[layer].points.lt(1e3) ? (tmp[layer].resetDescription !== undefined ? tmp[layer].resetDescription : "Reset for ") : ""}+<b>${formatWhole(tmp[layer].resetGain)}</b> ${tmp[layer].resource} ${tmp[layer].resetGain.lt(100) && player[layer].points.lt(1e3) ? `<br><br>Next at ${ (tmp[layer].roundUpCost ? formatWhole(tmp[layer].nextAt) : format(tmp[layer].nextAt))} ${ tmp[layer].baseResource }` : ""}`
	else if (tmp[layer].type== "static")
		return `${tmp[layer].resetDescription !== undefined ? tmp[layer].resetDescription : "Reset for "}+<b>${formatWhole(tmp[layer].resetGain)}</b> ${tmp[layer].resource}<br><br>${player[layer].points.lt(30) ? (tmp[layer].baseAmount.gte(tmp[layer].nextAt)&&(tmp[layer].canBuyMax !== undefined) && tmp[layer].canBuyMax?"Next:":"Req:") : ""} ${formatWhole(tmp[layer].baseAmount)} / ${(tmp[layer].roundUpCost ? formatWhole(tmp[layer].nextAtDisp) : format(tmp[layer].nextAtDisp))} ${ tmp[layer].baseResource }		
		`
	else if (tmp[layer].type == "none")
		return ""
	else
		return "You need prestige button text"
}





function isFunction(obj) {
	return !!(obj && obj.constructor && obj.call && obj.apply);
  };
  
document.title = modInfo.name



// Variables that must be defined to display popups
var activePopups = [];
var popupID = 0;

// Function to show popups
function doPopup(type="none",text="This is a test popup.",title="",timer=3, color="") {
	switch(type) {
		case "achievement":
			popupTitle = "Achievement Unlocked!";
			popupType = "achievement-popup"
			break;
		case "challenge":
			popupTitle = "Challenge Complete";
			popupType = "challenge-popup"
			break;
		default:
			popupTitle = "Something Happened?";
			popupType = "default-popup"
			break;
	}
	if(title != "") popupTitle = title;
	popupMessage = text;
	popupTimer = timer; 

	activePopups.push({"time":popupTimer,"type":popupType,"title":popupTitle,"message":(popupMessage+"\n"),"id":popupID, "color":color})
	popupID++;
}


//Function to reduce time on active popups
function adjustPopupTime(diff) {
	for(popup in activePopups) {
		activePopups[popup].time -= diff;
		if(activePopups[popup]["time"] < 0) {
			activePopups.splice(popup,1); // Remove popup when time hits 0
		}
	}
}

function run(func, target, args=null){
	if (!!(func && func.constructor && func.call && func.apply)){
		let bound = func.bind(target) 
		return bound(args)
	}
	else
		return func;
}