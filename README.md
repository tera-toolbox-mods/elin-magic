## Usage
Saved costumes are stored in the `elin-magic\characters\` directory.

All commands start with `/toolbox elin` or `/toolbox em`, for example:
```
/toolbox elin equip 99579
/toolbox em equip 99579
```

Commands list:
```
help                        = Display list of commands.
show                        = Print currently equipped Elin Magic costume.
off / on                    = Temporarily disable or re-enable Elin Magic.
equip [id]                  = Equip an item (ID can be found on teralore.com or through the Dressing Room).
hide [slot]                 = Equip an invisible item to the specified slot.
unequip [slot]              = Unequip an item via slot number or alias name.
enchant / glow [0-15|hide]  = Set weapon enchantment glow.
unenchant / unglow          = Set weapon enchantment to default.
dye [slot] [#color]         = Dye slot specified hex color (ARGB). Omit color to use the limited ingame dye UI.
undye [slot]                = Reset dye to default.
tag / text ["text"]         = Set custom name tag (on items that support this).
title                       = Equip a title via achievement ID (can be found on teralore.com).
untitle                     = Reset title to default.
ui / shape                  = Open advanced character editor.
unchar / unface / unbody    = Reset character/face/body to default.
reset                       = Reset your costume to default.
```

## Known limitations/issues
* Some costumes that have name tags do not actually support custom text. If text is not displayed, check the item's description or try a different one.
* You cannot equip items in the wrong slot. You *can*, however, equip some items meant for other classes (within race restriction).
* Costume may appear default after exiting certain shops. Re-equipping a piece of gear or typing "/toolbox em on" will restore your custom costume. If this happens, please contact Pinkie Pie on Discord (Pinkie Pie#7969) and provide information.

UI is currently in beta and you may experience minor bugs while using it. Known issues include:
* Incorrect name, guild logo, title, or craft mastery icons. (Relogging fixes these).
* "unX" commands do not update the UI while it is open.