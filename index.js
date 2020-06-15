const ELIN_READABLE_SLOT = {
		title: 'Title',
		weapon: 'Weapon (1)',
		body: 'Body (2)',
		hand: 'Hands (3)',
		feet: 'Feet (4)',
		head: 'Circlet (5)',
		face: 'Mask (6)',
		underwear: 'Underwear (7)',
		styleWeapon: 'Style Weapon (8)',
		styleHead: 'Style Head (9)',
		styleFace: 'Style Face (10)',
		styleBody: 'Style Body (11)',
		styleBack: 'Style Back (12)',
		styleFootprint: 'Footprints (13)',
		emVehicle: 'Ground Mount (14)',
		emVehicleFlying: 'Flying Mount (15)'
	},
	SLOT_ALIAS = {
		1: 'weapon',
		weapon: 'weapon',
		2: 'body',
		body: 'body',
		chest: 'body',
		armor: 'body',
		3: 'hand',
		hand: 'hand',
		hands: 'hand',
		gloves: 'hand',
		4: 'feet',
		feet: 'feet',
		foot: 'feet',
		footwear: 'feet',
		boots: 'feet',
		5: 'head',
		circlet: 'head',
		6: 'face',
		mask: 'face',
		7: 'underwear',
		underwear: 'underwear',
		innerwear: 'underwear',
		panties: 'underwear',
		pantsu: 'underwear',
		8: 'styleWeapon',
		styleweapon: 'styleWeapon',
		stylehead: 'styleHead',
		costumehead: 'styleHead',
		9: 'styleHead',
		head: 'styleHead',
		hat: 'styleHead',
		10: 'styleFace',
		styleface: 'styleFace',
		face: 'styleFace',
		costumeface: 'styleFace',
		11: 'styleBody',
		stylebody: 'styleBody',
		costumebody: 'styleBody',
		costume: 'styleBody',
		12: 'styleBack',
		styleback: 'styleBack',
		back: 'styleBack',
		cape: 'styleBack',
		wings: 'styleBack',
		13: 'styleFootprint',
		stylefootprint: 'styleFootprint',
		stylefootprints: 'styleFootprint',
		costumefootprint: 'styleFootprint',
		costumefootprints: 'styleFootprint',
		footprint: 'styleFootprint',
		footprints: 'styleFootprint',
		stamp: 'styleFootprint',
		trace: 'styleFootprint',
		14: 'emVehicle',
		mount: 'emVehicle',
		groundmount: 'emVehicle',
		15: 'emVehicleFlying',
		airmount: 'emVehicle',
		fmount: 'emVehicleFlying',
		flymount: 'emVehicleFlying',
		flyingmount: 'emVehicleFlying'
	},
	SLOT_INTERNAL = {
		weapon: 1,
		body: 3,
		hand: 4,
		feet: 5,
		underwear: 11,
		head: 12,
		face: 13,
		styleHead: 14,
		styleFace: 15,
		styleWeapon: 16,
		styleBody: 17,
		styleBack: 18,
		styleFootprint: 21
	},
	SLOT_VEHICLE = ['emVehicle', 'emVehicleFlying'],
	SLOT_DYEABLE = ['body', 'hand', 'feet', 'underwear', 'styleBody'],
	SLOT_BUFFER = ['details', 'shape'],
	ABNORMALITY_PANTSU = 7000019,
	CONTRACT_DYE = 43,
	CONTRACT_STYLE_SHOP = 50,
	CONTRACT_DRESSING_ROOM = 77,
	HOOK_READ = { order: -500 },
	HOOK_WRITE = { order: 100, filter: { fake: null } }

const path = require('path'),
	fs = require('fs'),
	{ Customize } = require('tera-data-parser').types,
	UI = require('../ui'),
	costumesDir = path.join(__dirname, 'characters')

function ElinMagic(mod, data) {
	if (!fs.existsSync(costumesDir)) fs.mkdirSync(costumesDir)
	const ui = new UI(mod)

	const { itemVehicle, vehicles, nameVehicle, dbItem } = data;

	let myUser = null,
		invenChunks = null,
		invenChunksTemp = [],
		inContract = -1,
		inDye = null,
		myCostume = null,
		enable = true,
		locked = false

	const cmds = {
		$default() { message(`Unknown command "${this}".`) },
		help() {
			message(`Commands (for detailed help see readme.txt):
	<FONT COLOR="#FFFFFF">help</FONT> = Display this message.
	<FONT COLOR="#FFFFFF">show</FONT> = Print currently equipped Elin Magic costume.
	<FONT COLOR="#FFFFFF">off / on</FONT> = Temporarily disable or re-enable Elin Magic.
	<FONT COLOR="#FFFFFF">equip [id]</FONT> = Equip an item (ID can be found on teralore.com or through the Dressing Room).
	<FONT COLOR="#FFFFFF">hide [slot]</FONT> = Equip an invisible item to the specified slot.
	<FONT COLOR="#FFFFFF">unequip [slot]</FONT> = Unequip an item via slot number or alias name.
	<FONT COLOR="#FFFFFF">enchant / glow [0-15|hide]</FONT> = Set weapon enchantment glow.
	<FONT COLOR="#FFFFFF">unenchant / unglow</FONT> = Set weapon enchantment to default.
	<FONT COLOR="#FFFFFF">dye [slot] [#color]</FONT> = Dye slot specified hex color (ARGB). Omit color to use the limited ingame dye UI.
	<FONT COLOR="#FFFFFF">undye [slot]</FONT> = Reset dye to default.
	<FONT COLOR="#FFFFFF">tag / text ["text"]</FONT> = Set custom name tag (on items that support this).
	<FONT COLOR="#FFFFFF">title [id]</FONT> = Equip a title via achievement ID (can be found on teralore.com).
	<FONT COLOR="#FFFFFF">untitle</FONT> = Reset title to default.
	<FONT COLOR="#FFFFFF">ui / shape</FONT> = Open advanced character editor.
	<FONT COLOR="#FFFFFF">unchar / unface / unbody</FONT> = Reset character/face/body to default.
	<FONT COLOR="#FFFFFF">reset</FONT> = Reset your costume to default.`)
		},
		show() { message(`Current costume${enable ? '' : ' (hidden)'}: ${describeCostume()}`) },
		onOff(on) {
			enable = Boolean(on)
			updateMyCostume()
			message(enable ? 'Enabled.' : 'Disabled.')
		},
		equip(id) {
			let mount = id[0] === 'm',
				slot = null

			if(!mount) {
				id = Number(id)

				let info = dbItem[id]
				if(info) slot = info

				if(itemVehicle[id]) id = itemVehicle[id]
			}
			else {
				id = Number(id.slice(1))

				let flying = vehicles[id]
				if(flying !== undefined) slot = SLOT_VEHICLE[flying ? 1 : 0]
			}

			if(!slot) {
				message(mount ? 'Mount not found.' : 'Item not found.')
				return
			}

			editCostume(true, slot, id)
		},
		hide(slot) {
			slot = checkSlot(slot)
			if(!slot) return
			if(SLOT_VEHICLE.includes(slot)) {
				message('That slot cannot be hidden.')
				return
			}
			editCostume(true, slot, 0)
		},
		unequip(slot) {
			slot = checkSlot(slot)
			if(!slot) return
			editCostume(true, slot)
		},
		enchant(level) {
			level = parseInt(level)
			editCostume(true, 'weaponEnchant', level >= 0 ? level : -1)
		},
		unenchant() { editCostume(true, 'weaponEnchant') },
		dye(slotArg, color) {
			const slot = checkSlot(slotArg)
			if(!slot) return
			if(!SLOT_DYEABLE.includes(slot)) {
				message('That slot cannot be dyed.')
				return
			}
			if(color) {
				if(color[0] === '#') color = color.slice(1)

				color = parseInt(color, 16)

				if(isNaN(color)) {
					message(`Usage: ${this} ${slotArg} #55FF77BB`)
					return
				}

				editCostume(true, slot + 'Dye', color || undefined)
			}
			else {
				let item = myCostume ? myCostume[slot] : undefined
				if(item === undefined) item = myUser[slot]
				if(!item) {
					message('That slot is empty.')
					return
				}
				sendLocked('S_REQUEST_CONTRACT', 1, {
					senderId: mod.game.me.gameId,
					recipientId: mod.game.me.gameId,
					type: CONTRACT_DYE,
					id: -100,
					senderName: mod.game.me.name,
					recipientName: mod.game.me.name
				})
				mod.send('S_ITEM_COLORING_BAG', 1, {
					unk: 40,
					unk1: 0x235ACCDF,
					item,
					dye: 206
				})
				inDye = slot + 'Dye'
			}
		},
		undye(slot) {
			slot = checkSlot(slot)
			if(!slot) return
			editCostume(true, slot + 'Dye')
		},
		tag(str) { editCostume(true, 'styleBodyString', str !== undefined && str.length ? str : undefined) },
		title(id) { editCostume(true, 'title', Number(id)) },
		untitle(id) { editCostume(true, 'title') },
		ui() { ui.open() },
		unchar() { editCostume(true, 'appearance') },
		unface() { editCostume(true, 'details') },
		unbody() { editCostume(true, 'shape') },
		reset() { editCostume(true, null) }
	}

	function checkSlot(slot) {
		slot = slot ? SLOT_ALIAS[slot.toLowerCase()] : null
		if(!slot) message('Unknown slot.')
		return slot
	}

	mod.command.add(['elin', 'em'], Object.assign(cmds, { // Aliases
		$none: cmds.help,
		on() { cmds.onOff(true) },
		off() { cmds.onOff(false) },
		unhide: cmds.unequip,
		glow: cmds.enchant,
		unglow: cmds.unenchant,
		text: cmds.tag,
		shape: cmds.ui,
		unshape: cmds.unbody
	}))

	ui.get('/vars', (req, res) => {
		const emVars = Object.assign({}, myUser, myCostume)

		for(let slot of ['appearance']) {
			let obj = emVars[slot]

			delete emVars[slot]

			for(let key in obj) emVars[slot + '.' + key] = obj[key]
		}
		for(let slot of ['details', 'shape']) {
			let buf = emVars[slot]

			delete emVars[slot]

			for(let i = 0; i < buf.length; i++) emVars[slot + '.' + i] = buf[i]
		}

		res.writeHead(200)
		res.end(`window.emVars = ${JSON.stringify(emVars, (key, value) => typeof value === 'bigint' ? undefined : value)}`)
	})

	ui.post('/ipc', (req, res) => {
		let chunks = []

		req
		.on('data', data => { chunks.push(data) })
		.on('end', () => {
			try {
				let kv = JSON.parse(Buffer.concat(chunks)),
					key = kv[0],
					value = kv[1]

				if(key.includes('.')) {
					key = key.split('.')

					const i = key[1]
					key = key[0]

					if(key === 'appearance') {
						if(myCostume && myCostume[key]) value = myCostume[key]
						else value = new Customize(myUser[key])

						value[i] = kv[1]
					}
					else {
						if(myCostume && myCostume[key]) value = myCostume[key]
						else value = Buffer.from(myUser[key])

						value[i] = kv[1]
					}
				}

				editCostume(false, key, value)
			}
			catch(e) { console.log(e) }

			res.status(200).end()
		})
	})

	ui.use(UI.static(path.join(__dirname, 'ui')))

	mod.hook('S_GET_USER_LIST', 17, HOOK_WRITE, event => {
		myUser = myCostume = null

		let modified

		for(let c of event.characters) {
			let costume = loadCostume(mod.serverId, c.id)

			if(costume) {
				let styleBody = costume.styleBody || c.styleBody,
					styleBodyString = costume.styleBodyString

				Object.assign(c, costume, {
					customStrings: styleBody && styleBodyString ? [{
						id: styleBody,
						string: styleBodyString
					}] : []
				}, costume && costume.underwear ? {
					styleBody: costume.underwear,
					styleBodyDye: costume.underwearDye
				} : null)

				modified = true
			}
		}

		return modified
	})

	mod.hook('S_LOGIN', 14, HOOK_WRITE, event => {
		updateUser(event)

		enable = true
		myCostume = loadCostume(mod.serverId, mod.game.me.playerId)

		if(myCostume) {
			Object.assign(event, myCostume)
			return true
		}
	})

	mod.hook('S_SPAWN_ME', 'raw', () => {
		if(enable)
			process.nextTick(() => {
				updateCustomString(myUser, myCostume)
				updateAbnormals(mod.game.me.gameId, myCostume, true)
			})
	})

	mod.hook('S_CREATURE_LIFE', 3, event => {
		if(mod.game.me.is(event.gameId) && enable)
			process.nextTick(() => { updateAbnormals(mod.game.me.gameId, myCostume, true) })
	})

	mod.hook('S_UNICAST_TRANSFORM_DATA', 6, HOOK_WRITE, event => {
		if(locked) return

		if(event.type === 0) return transformUpdate(event) // Only hook un-transform
	})

	mod.hook('S_USER_WEAPON_APPEARANCE_CHANGE', 2, HOOK_WRITE, event => {
		if(event.abnormalityEffect === 0) return transformUpdate(event) // Only hook un-transform
	})

	for(let packet of [
		['S_USER_EXTERNAL_CHANGE', 7],
		['S_APPLY_TITLE', 3]
	])
		mod.hook(...packet, HOOK_WRITE, transformUpdate)

	mod.hook('S_ITEM_CUSTOM_STRING', 2, HOOK_WRITE, event => {
		if(locked) return

		let costume = getCostume(event.gameId)

		if(costume && (costume.styleBody || costume.styleBodyString)) return false
	})

	mod.hook('S_MOUNT_VEHICLE', 2, HOOK_WRITE, event => {
		let costume = getCostume(event.gameId)

		if(costume) {
			let id = modifyMount(event.id, costume)

			if(id !== event.id) {
				event.id = id
				return true
			}
		}
	})

	mod.hook('S_ITEMLIST', 3, HOOK_READ, event => {
		// Cache inventory so we can restore it later on
		invenChunksTemp.push(event)

		if(event.lastInBatch && !event.more) {
			invenChunks = invenChunksTemp
			invenChunksTemp = []
		}
	})

	mod.hook('S_REQUEST_CONTRACT', 1, HOOK_WRITE, event => {
		if(locked) return

		if(event.type === CONTRACT_DRESSING_ROOM && enable && myCostume) {
			// Pull default equipment from inventory
			const items = new Map(mod.game.inventory.equipment.slots)

			// Overwrite modified costume slots
			for(let slot in SLOT_INTERNAL) {
				const iSlot = SLOT_INTERNAL[slot]
				let item = items.get(iSlot)

				if(myCostume[slot] !== undefined) {
					if(myCostume[slot] === 0) {
						items.delete(iSlot)
						item = null
					}
					else if(!item)
						items.set(iSlot, item = {
							id: myCostume[slot],
							dbid: iSlot,
							ownerId: mod.game.me.gameId,
							slot: iSlot,
							amount: 1,
							soulboundStatus: 1,
							passivitySets: [{}]
						})
					else
						item.id = myCostume[slot]
				}

				if(item) {
					const enchant = myCostume[slot + 'Enchant'],
						dye = myCostume[slot + 'Dye'],
						string = myCostume[slot + 'String']

					if(enchant !== undefined) item.enchant = enchant
					if(dye !== undefined) item.dye = dye
					if(string !== undefined) item.customString = string
				}
			}

			// Serialize a minimal inventory for the game to pull appearance data from
			mod.send('S_ITEMLIST', 3, {
				gameId: mod.game.me.gameId,
				container: 14,
				first: true,
				more: false,
				lastInBatch: true,
				items: [...items.values()]
			})
		}

		inContract = event.type
	})

	mod.hook('C_CANCEL_CONTRACT', 1, HOOK_READ, event => {
		if(event.id === -100) {
			closeDye()
			updateMyCostume() // Client tries to revert the user's appearance
			return false
		}
	})

	mod.hook('S_CANCEL_CONTRACT', 'event', HOOK_WRITE, () => {
		if(locked) return

		if(enable && myCostume) {
			if(inContract === CONTRACT_STYLE_SHOP)
				process.nextTick(updateMyCostume) // Client tries to revert the user's appearance
			else if(inContract === CONTRACT_DRESSING_ROOM)
				process.nextTick(() => {
					// Restore inventory now that the client is (probably) done with it
					// This is more efficient than sending an appearance packet because no unnecessary models are loaded
					for(let chunk of invenChunks) mod.send('S_ITEMLIST', 3, chunk)
				})
		}

		inContract = -1
	})

	mod.hook('C_ITEM_COLORING_SET_COLOR', 2, HOOK_READ, event => {
		if(inDye) {
			let slot = inDye
			closeDye()
			editCostume(true, slot, event.color)
			return false
		}
	})

	mod.hook('C_REQUEST_NONDB_ITEM_INFO', 2, HOOK_READ, event => {
		if(inContract === CONTRACT_DRESSING_ROOM) {
			const itemName = mod.game.data.items.get(event.item);
			if(itemName) {
				// Display hovered item ID/name both onscreen and as a link in chat for convenience
				let msg = makeLink(event.item, `${event.item}: ${itemName}`)

				mod.send('S_DUNGEON_EVENT_MESSAGE', 2, {
					message: msg,
					type: 2
				})
				message(msg)
			}

			mod.send('S_REPLY_NONDB_ITEM_INFO', 1, { item: event.item })
			return false
		}
	})

	// Close the script-generated ingame dyeing UI
	function closeDye() {
		inDye = null
		sendLocked('S_CANCEL_CONTRACT', 1, {
			type: CONTRACT_DYE,
			id: -100
		})
	}

	// Checks the mount type and overrides it if the costume includes it, returning the possibly modified ID
	function modifyMount(id, emData) {
		if (id && emData) {
			if (vehicles[id]) {
				if (emData.emVehicleFlying)
					return emData.emVehicleFlying
			} else if (emData.emVehicle) {
				return emData.emVehicle
			}
		}

		return id
	}

	function transformUpdate(event) {
		if(locked) return

		updateUser(event)

		let costume = getCostume(event.gameId)

		if(costume) {
			Object.assign(event, costume)
			return true
		}
	}

	// Updates the specified user's default costume
	function updateUser(event) {
		// Sanitize
		let cloned = false

		// Workaround S_UNICAST_TRANSFORM_DATA - title is 32bit in all other packets
		if (typeof event.title === 'bigint') {
			event = Object.assign({}, event, { title: Number(event.title & 0xffffffffn) })
			cloned = true
		}

		for(let key in event)
			if(key.startsWith('unk')) {
				if(!cloned) {
					event = Object.assign({}, event)
					cloned = true
				}
				delete event[key]
			}

		// Update user
		if(mod.game.me.is(event.gameId)) {
			if(!myUser) myUser = {}
			Object.assign(myUser, event)
		}
	}

	// Returns the custom costume for specified gameId if enabled for that user, null otherwise
	function getCostume(gid) {
		if(mod.game.me.is(gid)) return enable ? myCostume : null
		return null
	}

	// Modify the user's costume via command, etc.
	function editCostume(msg, slot, value) {
		if(!slot) myCostume = null
		else if(value === undefined) {
			if(myCostume) delete myCostume[slot]
		}
		else {
			if(!myCostume) myCostume = {}
			myCostume[slot] = value
		}

		updateMyCostume()
		saveCostume(mod.serverId, mod.game.me.playerId, myCostume)

		if(msg) message(!slot ? 'Costume reset' : `Costume updated: ${describeCostume()}`)
	}

	function updateMyCostume() { updateCostume(false, myUser, enable ? myCostume : null) }

	function updateCostume(spawn, serverData, emData) {
		const mergedData = Object.assign({}, serverData, emData)

		if (spawn) sendLocked('S_SPAWN_USER', 15, Object.assign(mergedData, { mount: modifyMount(serverData.mount, emData) }))
		else sendLocked('S_UNICAST_TRANSFORM_DATA', 6, mergedData)

		sendLocked('S_APPLY_TITLE', 3, mergedData) // S_UNICAST_TRANSFORM_DATA doesn't like title change if not transforming

		updateCustomString(mergedData)
		updateAbnormals(serverData.gameId, emData)
	}

	function updateCustomString(serverData, emData) {
		const data = !emData ? serverData : Object.assign({}, serverData, emData)

		if(data.styleBody)
			sendLocked('S_ITEM_CUSTOM_STRING', 2, {
				gameId: data.gameId,
				customStrings: [{
					dbid: data.styleBody,
					string: data.styleBodyString || ''
				}]
			})
	}

	function updateAbnormals(gameId, emData, spawn) {
		if (emData && emData.underwear)
			mod.send('S_ABNORMALITY_BEGIN', 4, {
				target: gameId,
				source: gameId,
				id: ABNORMALITY_PANTSU,
				duration: 1000*24*60*60*1000 - 1000, // 999day - Prevents perpetual flashing in UI
				stacks: 1
			})
		else if(!spawn)
			mod.send('S_ABNORMALITY_END', 1, {
				target: gameId,
				id: ABNORMALITY_PANTSU
			})
	}

	function describeCostume() {
		if(!myCostume) return 'Nothing'

		let desc = ''

		for(let slot in ELIN_READABLE_SLOT) {
			const id = myCostume[slot],
				enchant = myCostume[slot + 'Enchant'],
				dye = myCostume[slot + 'Dye'],
				string = myCostume[slot + 'String']

			if(id !== undefined || enchant !== undefined || dye !== undefined) {
				let link = '',
					ext = []

				if(id === undefined) link = '[Default]'
				else if(id === 0) link = '[Hidden]'
				else if(SLOT_VEHICLE.includes(slot)) link = `[m${id}: ${nameVehicle[id] || '???'}]`
				else if(SLOT_INTERNAL[slot]) link = makeLink(id, `${id}: ${mod.game.data.items.get(id).name}`)
				else link = String(id)

				if(enchant !== undefined) ext.push(enchant !== -1 ? '+' + enchant : 'enchant hidden')
				if(dye !== undefined) ext.push(`dyed #${dye.toString(16).toUpperCase().padStart(8, '0')}`)
				if(string !== undefined) ext.push(`tag "${string}"`)

				desc += `\n* ${ELIN_READABLE_SLOT[slot]}: ${link}`
				if(ext.length) desc += ` (${ext.join(', ')})`
			}
		}

		return desc
	}

	function message(msg) { mod.command.message('[Elin Magic] ' + msg) }

	function sendLocked(...args) {
		locked = true
		const success = mod.send(...args)
		locked = false

		return success
	}
}

// Note: We have to break large links into chunks because Scaleform renderer glitches otherwise
function makeLink(id, text) {
	let str = ''
	while(text.length > 0) {
		str += `<FONT COLOR="#FFFFFF"><ChatLinkAction param="1#####${id}">${str.length === 0 ? '&lt;' : ''}${text.slice(0, 20)}${text.length <= 20 ? '&gt;' : ''}</ChatLinkAction></FONT>`
		text = text.slice(20)
	}
	return str
}

function saveCostume(sid, pid, info) {
	if(info) {
		info = Object.assign({}, info)

		for(let slot of SLOT_BUFFER)
			if(info[slot])
				info[slot] = info[slot].toString('base64')

		fs.writeFileSync(path.join(costumesDir, `${sid}-${pid}.json`), JSON.stringify(info))
	}
	else
		try {
			fs.unlinkSync(path.join(costumesDir, `${sid}-${pid}.json`))
		}
		catch(e) {}
}

function loadCostume(sid, pid) {
	try {
		let info = JSON.parse(fs.readFileSync(path.join(costumesDir, `${sid}-${pid}.json`)))

		for(let slot of SLOT_BUFFER)
			if(info[slot])
				info[slot] = Buffer.from(info[slot], 'base64')

		return info
	}
	catch(e) { return null }
}

async function loadData(mod) {
	let mountskills = {};
	(await mod.queryData('/SkillData@huntingZoneId=?&templateId=?/Skill@type=?/', [0, 9999, 'mount'], true, true, ['id', 'vehicleId'])).forEach(result => {
		const mount = result.children.find(child => child.name === 'Mount');
		if (mount)
			mountskills[result.attributes.id] = mount.attributes.vehicleId;
	});

	let nameVehicle = {};
	(await mod.queryData('/StrSheet_UserSkill/String@class=?&gender=?&race=?&name!=?/', ['Common', 'Common', 'Common', ''], true, false, ['id', 'name'])).forEach(result => {
		if (mountskills[result.attributes.id])
			nameVehicle[mountskills[result.attributes.id]] = result.attributes.name;
	});

	let itemVehicle = {};
	const skillbooks = await mod.queryData('/ItemData/Item@linkSkillId!=?&combatItemType=?/', [0, 'skillbook'], true, false, ['id', 'linkSkillId']);
	for (const skillbook of skillbooks) {
		if (mountskills[skillbook.attributes.linkSkillId])
			itemVehicle[skillbook.attributes.id] = mountskills[skillbook.attributes.linkSkillId];
	}

	let vehicles = {};
	(await mod.queryData('/VehicleData/Vehicle/', [], true, false, ['id', 'flyingDataId'])).forEach(result => {
		vehicles[result.attributes.id] = result.attributes.flyingDataId !== 0;
	});

	const partToSlot = {
		weapon: 'weapon',
		body: 'body',
		hand: 'hand',
		feet: 'feet',
		accessoryhair: 'head',
		accessoryface: 'face',
		underwear: 'underwear',
		style_weapon: 'styleWeapon',
		style_body: 'styleBody',
		style_back: 'styleBack',
		style_hair: 'styleHead',
		style_face: 'styleface'
	};
	let equipmentSlots = {};
	(await mod.queryData('/EquipmentData/Equipment/', [], true, false, ['equipmentId', 'part'])).forEach(result => {
		if (result.attributes.part)
			equipmentSlots[result.attributes.equipmentId] = partToSlot[result.attributes.part.toLowerCase()];
	});

	let dbItem = {};
	(await mod.queryData('/ItemData/Item@linkEquipmentId!=?/', [0], true, false, ['id', 'linkEquipmentId'])).forEach(result => {
		dbItem[result.attributes.id] = equipmentSlots[result.attributes.linkEquipmentId];
	});

	return { itemVehicle, nameVehicle, vehicles, dbItem };
}

exports.NetworkMod = function(mod) {
	mod.game.initialize('inventory');

	let userListPacket = null;
	let delayHook = mod.hook('C_GET_USER_LIST', 'raw', (_, data) => {
		userListPacket = data;
		return false;
	});

	loadData(mod).then(data => {
		ElinMagic(mod, data);

		mod.unhook(delayHook);
		if (userListPacket !== null) {
			mod.toServer(userListPacket);
			userListPacket = null;
		}
	});
}
