
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("IconDevSelector", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView,
  View
} from 'react-native';

import { Background }  from '../components/Background'
import { background, colors, screenWidth } from "../styles";

import { NavigationUtil } from "../../util/NavigationUtil";
import { TopBarUtil } from "../../util/TopBarUtil";
import { LiveComponent } from "../LiveComponent";
import { DevIconSelection } from "./DevIconSelection";

/*
Lights
*/


let miscLights = [ "fiCS1-idea", "fiCS1-illuminated", "fiCS1-light-bulb", "fiCS1-lightbulb", "fiE-idea", "fiHS-light-bulb", "fiHS-light-bulb-1", "fiHS-light-bulb-2", "fiHS-light-bulb-3", "fiHS-light-bulb-4", "fiHS-light-bulb-5", "fiHS-light-bulb-6", "fiHS-light-bulb-7", "fiHS-light-bulb-8", "fiHS-light-bulb-9", "c1-bulb", "c1-theaterLight", "fiCS1-flashlight" ]

let furnitureLights = [
  "fiCS1-desk", "fiCS1-furniture-and-household-11", "fiCS1-lamp", "fiCS1-night-stand", "fiHS-armchair-7", "fiCS1-furniture-and-household", "fiCS1-living-room-1", "fiCS1-living-room", "fiHS-bookcase-1", "fiHS-chest-of-drawers-7", "fiHS-desk-1", "fiCS1-desk-1"
];

let standingLights = [
  "fiCS1-desk-lamp", "fiCS1-desk-lamp-1", "fiCS1-desk-lamp-2", "fiCS1-floor", "fiCS1-floor-1", "fiCS1-floor-2", "fiCS1-floor-3", "fiCS1-furniture-and-household-1", "fiCS1-furniture-and-household-2", "fiCS1-furniture-and-household-3", "fiCS1-furniture-and-household-4", "fiCS1-furniture-and-household-5", "fiCS1-furniture-and-household-6", "fiCS1-furniture-and-household-7", "fiCS1-lamp-1", "fiCS1-lamp-3", "fiCS1-lamp-4", "fiCS1-lamp-5", "fiCS1-lamp-6", "fiCS1-lamp-7", "fiCS1-lamp-8", "fiCS1-lamp-9", "fiCS1-lamp-10", "fiCS1-lamp-11", "fiCS1-lamp-12", "fiCS1-lamp-13", "fiCS1-lamp-14", "fiCS1-lamp-15", "fiCS1-lamp-22", "fiCS1-lamps", "fiCS1-light", "fiCS1-light-1", "fiCS1-light-2", "fiCS1-light-3", "fiCS1-light-4", "fiCS1-street-lamp", "fiCS1-street-lamp-1", "fiCS1-street-lamp-2", "fiCS1-table-lamp", "fiHS-hanger-2", "fiHS-lamp", "fiHS-lamp-1", "fiHS-lamp-2", "fiHS-lamp-5", "fiHS-lamp-6", "fiHS-lamp-7", "fiHS-living-room", "fiHS-shower-1", "c1-deskLight", "c1-lamp1", "c1-lamp3", "c1-lamp5", "c1-lamp6", "c1-desklamp", "c1-studiolight", "c1-standingLamp"
];

let ceilingLights = [
  "fiCS1-bar", "fiCS1-chandelier", "fiCS1-chandelier-1", "fiCS1-chandeliers", "fiCS1-flame", "fiCS1-dining-table", "fiCS1-furniture-and-household-10", "fiCS1-furniture-and-household-13", "fiCS1-furniture-and-household-14", "fiCS1-furniture-and-household-15", "fiCS1-invention", "fiCS1-indoor", "fiCS1-lamp-16", "fiCS1-lamp-17", "fiCS1-lamp-18", "fiCS1-lamp-19", "fiCS1-lamp-20", "fiCS1-lamp-21", "fiCS1-light-6", "fiCS1-spotlight", "fiCS1-spotlight-1", "fiCS1-spotlight-2", "fiCS1-stage", "c1-lamp2", "c1-christmasLights", "fiHS-lights", "fiCS1-furniture-and-household-9", "fiCS1-lamp-2", "fiHS-chandelier", "fiHS-lamp-4", "c1-lamp7"
];

let wallMountedLights = [
  "fiCS1-furniture-and-household-8", "fiCS1-lamp-23", "fiCS1-lamp-24", "fiCS1-lamppost", "fiCS1-light-5", "fiHS-lamp-3", "fiCS1-street-lamp-3", "fiCS1-streetlight"
];

let app = [
  "fiCS1-system","fiCS1-streaming","fiCS1-family-tree","fiCS1-smartwatch","fiCS1-message","fiCS1-chat","fiCS1-email","fiCS1-employee","fiCS1-baby-changing","fiCS1-customer-service","fiCS1-chat-1","fiCS1-location","fiCS1-contacts","fiCS1-customer-service-1","fiCS1-chat-2","fiCS1-email-1","fiCS1-customer","fiCS1-chat-3","fiCS1-customer-1","fiCS1-chat-4","fiCS1-chat-5","fiCS1-chat-6","fiCS1-chat-7","fiCS1-pie-chart","fiCS1-analytics","fiCS1-antivirus","fiCS1-analytics-1","fiCS1-analytics-2","fiCS1-analytics-3","fiCS1-analytics-4","fiCS1-house","fiCS1-shield","fiCS1-search","fiCS1-placeholder","fiCS1-box","fiCS1-blueprint","fiE-add","fiE-add-1","fiE-add-2","fiE-add-3","fiE-alarm","fiE-alarm-1","fiE-alarm-clock","fiE-alarm-clock-1","fiE-app","fiE-back","fiE-battery","fiE-battery-1","fiE-battery-2","fiE-attachment","fiE-battery-3","fiE-battery-4","fiE-battery-5","fiE-battery-6","fiE-battery-7","fiE-battery-8","fiE-battery-9","fiE-binoculars","fiE-blueprint","fiE-bluetooth","fiE-bluetooth-1","fiE-bookmark","fiE-bookmark-1","fiE-briefcase","fiE-broken-link","fiE-calculator","fiE-calculator-1","fiE-calendar","fiE-calendar-1","fiE-calendar-2","fiE-calendar-3","fiE-calendar-4","fiE-calendar-5","fiE-calendar-6","fiE-calendar-7","fiE-checked","fiE-checked-1","fiE-clock","fiE-clock-1","fiE-close","fiE-cloud","fiE-cloud-computing","fiE-cloud-computing-1","fiE-cloud-computing-2","fiE-cloud-computing-3","fiE-cloud-computing-4","fiE-cloud-computing-5","fiE-command","fiE-albums","fiE-archive","fiE-archive-1","fiE-archive-2","fiE-archive-3","fiE-compact-disc-2","fiE-compass","fiE-compose","fiE-controls","fiE-controls-1","fiE-controls-2","fiE-controls-3","fiE-controls-4","fiE-controls-5","fiE-controls-6","fiE-controls-7","fiE-controls-8","fiE-controls-9","fiE-database","fiE-database-1","fiE-database-2","fiE-database-3","fiE-diamond","fiE-diploma","fiE-dislike","fiE-dislike-1","fiE-divide","fiE-divide-1","fiE-division","fiE-document","fiE-download","fiE-edit","fiE-edit-1","fiE-eject","fiE-eject-1","fiE-equal","fiE-equal-1","fiE-equal-2","fiE-error","fiE-exit","fiE-exit-1","fiE-exit-2","fiE-eyeglasses","fiE-fast-forward","fiE-fast-forward-1","fiE-fax","fiE-file","fiE-file-1","fiE-file-2","fiE-film","fiE-fingerprint","fiE-flag","fiE-flag-1","fiE-flag-2","fiE-flag-3","fiE-flag-4","fiE-focus","fiE-folder","fiE-folder-1","fiE-folder-10","fiE-folder-11","fiE-folder-12","fiE-folder-13","fiE-folder-14","fiE-folder-15","fiE-folder-16","fiE-folder-17","fiE-folder-18","fiE-folder-19","fiE-folder-2","fiE-folder-3","fiE-folder-4","fiE-folder-5","fiE-folder-6","fiE-folder-7","fiE-folder-8","fiE-folder-9","fiE-forbidden","fiE-funnel","fiE-garbage","fiE-garbage-1","fiE-garbage-2","fiE-gift","fiE-help","fiE-hide","fiE-hold","fiE-home","fiE-home-1","fiE-home-2","fiE-hourglass",
  "fiE-hourglass-1","fiE-hourglass-2","fiE-hourglass-3","fiE-house","fiE-id-card","fiE-id-card-1","fiE-id-card-2","fiE-id-card-3","fiE-id-card-4","fiE-id-card-5","fiE-incoming","fiE-infinity","fiE-info","fiE-internet","fiE-key","fiE-lamp","fiE-layers","fiE-layers-1","fiE-like","fiE-like-1","fiE-like-2","fiE-link","fiE-list","fiE-list-1","fiE-lock","fiE-lock-1","fiE-locked","fiE-locked-1","fiE-locked-2","fiE-locked-3","fiE-locked-4","fiE-locked-5","fiE-locked-6","fiE-login","fiE-magic-wand","fiE-magnet","fiE-magnet-1","fiE-magnet-2","fiE-map","fiE-map-1","fiE-map-2","fiE-map-location","fiE-megaphone","fiE-megaphone-1","fiE-menu","fiE-menu-1","fiE-menu-2","fiE-menu-3","fiE-menu-4","fiE-minus","fiE-minus-1","fiE-more","fiE-more-1","fiE-more-2","fiE-multiply","fiE-multiply-1","fiE-music-player","fiE-music-player-1","fiE-music-player-2","fiE-music-player-3","fiE-mute","fiE-muted","fiE-navigation","fiE-navigation-1","fiE-network","fiE-newspaper","fiE-next","fiE-note","fiE-notebook","fiE-notebook-1","fiE-notebook-2","fiE-notebook-3","fiE-notebook-4","fiE-notebook-5","fiE-notepad","fiE-notepad-1","fiE-notepad-2","fiE-notification","fiE-paper-plane","fiE-paper-plane-1","fiE-pause","fiE-pause-1","fiE-percent","fiE-percent-1","fiE-perspective","fiE-photo-camera","fiE-photo-camera-1","fiE-photos","fiE-picture","fiE-time","fiE-trash","fiE-umbrella","fiE-unlink","fiE-unlocked","fiE-unlocked-1","fiE-unlocked-2","fiE-upload","fiE-user","fiE-user-1","fiE-user-2","fiE-user-3","fiE-user-4","fiE-user-5","fiE-user-6","fiE-user-7","fiE-users","fiE-users-1","fiE-video-camera","fiE-video-player","fiE-video-player-2","fiE-view","fiE-view-1","fiE-view-2","fiE-volume-control","fiE-volume-control-1","fiE-warning","fiE-windows","fiE-windows-1","fiE-windows-2","fiE-windows-3","fiE-windows-4","fiE-wireless-internet","fiE-worldwide","fiE-worldwide-1","fiE-zoom-in","fiE-zoom-out",
  "fiE-smartphone-11","fiE-smartphone-2","fiE-smartphone-3","fiE-smartphone-4","fiE-smartphone-5","fiE-smartphone-6","fiE-smartphone-7","fiE-smartphone-8","fiE-smartphone-9","fiE-speaker","fiE-speaker-1","fiE-speaker-2","fiE-speaker-3","fiE-speaker-4","fiE-speaker-5","fiE-speaker-6","fiE-speaker-7","fiE-speaker-8","fiE-spotlight","fiE-star","fiE-star-1","fiE-stop","fiE-stop-1","fiE-stopwatch","fiE-stopwatch-1","fiE-stopwatch-2","fiE-stopwatch-3","fiE-stopwatch-4","fiE-street","fiE-street-1","fiE-substract","fiE-substract-1","fiE-success","fiE-switch","fiE-switch-1","fiE-switch-2","fiE-switch-3","fiE-switch-4","fiE-switch-5","fiE-switch-6","fiE-switch-7","fiE-tabs","fiE-tabs-1","fiE-target","fiE-television","fiE-play-button","fiE-play-button-1","fiE-plus","fiE-power","fiE-previous","fiE-price-tag","fiE-push-pin","fiE-radar","fiE-reading","fiE-record","fiE-repeat","fiE-repeat-1","fiE-restart","fiE-resume","fiE-rewind","fiE-rewind-1","fiE-route","fiE-save","fiE-search","fiE-search-1","fiE-send","fiE-server-1","fiE-server-2","fiE-server-3","fiE-settings","fiE-settings-1","fiE-settings-2","fiE-settings-3","fiE-settings-4","fiE-settings-5","fiE-settings-6","fiE-settings-7","fiE-settings-8","fiE-settings-9","fiE-share","fiE-share-1","fiE-share-2","fiE-shuffle","fiE-shuffle-1","fiE-shutdown","fiE-sign","fiE-sign-1","fiE-skip","fiE-smartphone","fiE-smartphone-1","fiE-smartphone-10",
  "fiE-pin", "fiE-placeholder", "fiE-placeholder-1", "fiE-placeholder-2", "fiE-placeholder-3", "fiE-placeholders","fiHS-garage", "fiHS-ottoman", "fiHS-pipe", "fiHS-pipe-1", "fiHS-pipe-2", "fiHS-pipe-3", "fiHS-pipe-4", "fiHS-pipe-5", "fiHS-pipe-6", "fiHS-radiator", "fiHS-valve-1", "fiHS-radiator-1", "fiHS-radiator-2", "fiHS-valve-2", "fiHS-wall"
];

let rooms_plants        = ["fiCS1-forest", "fiCS1-tree", "fiCS1-sun", "fiCS1-botanical", "fiHS-bonsai", "fiHS-cactus", "fiHS-flower", "fiHS-flower-1", "fiHS-plant", "fiHS-plant-1", "fiHS-plant-2", "fiHS-plant-3", "fiHS-tulips", "fiCS1-vase",'c1-plant','c1-tree','c1-tree-pot',]
let rooms_bathroom      = ["fiCS1-furniture-and-household-12", "fiHS-washing-machine-1", "fiHS-washing-machine", "fiHS-bathtub", "fiHS-bathtub-1", "fiHS-bathtub-2", "fiHS-shower-2", "fiHS-sink", "fiHS-sink-1", "fiCS1-bathroom", "fiCS1-bathroom-1", "fiCS1-toilet", "fiCS1-bathtub", "fiCS1-shower", "fiCS1-faucet", "fiCS1-bathroom-2",'c1-showertub','c1-sink1','c1-sink2','c1-sink3','c1-sink4','c1-toiletroll2','c1-toiletPaper','c1-washingMachine','c1-washingmachine2','c1-medicine','c1-testtube','c1-wcsign','c1-medicine-bottle',"c1-manWomanSign","c1-womanSign","c1-hairDryer","c1-toothbrush","c1-toilet1","c1-toilet2",'c1-rain1',]
let rooms_kitchen       = ["fiCS1-coffee-machine","fiHS-stove", "fiHS-stove-1", "fiHS-tap", "fiCS1-glass", "fiCS1-dinner",'c1-foodWine','c1-cutlery','c1-forkKnife','c1-blender3','c1-cocktailGlass1','c1-cocktailGlass2','c1-drink','c1-boiler','c1-droplet','c1-soup','c1-blender4','c1-dinnerbulb','c1-coffee2','c1-coffee3','c1-coffee1','c1-cupboard','c1-plate','c1-plate2','c1-beer','c1-microwave','c1-oven','c1-oven2',]
let rooms_livingRoom    = ["fiHS-armchair", "fiHS-armchair-1", "fiHS-armchair-2", "fiHS-armchair-3", "fiHS-armchair-4", "fiHS-armchair-5", "fiHS-armchair-6", "fiHS-chair", "fiHS-chair-1", "fiHS-chair-2", "fiHS-chair-3","fiHS-couch", "fiHS-couch-1", "fiHS-sofa-2", "fiHS-sofa-6", "fiHS-sofa-7", "fiHS-livingroom-1", "fiHS-livingroom-2", "fiCS1-couch", "fiCS1-sofa","fiHS-fireplace", "fiHS-fireplace-1", "fiHS-fireplace-2", "fiHS-fireplace-3", "fiHS-television", "fiHS-television-1", "fiHS-television-2", "fiHS-television-3", "fiHS-television-4", "fiCS1-chimney",'c1-rockingChair','c1-tvSetup','c1-tv1','c1-tvSetup2','c1-bookshelf','c1-musicPlayer','c1-couch','c1-chair','c1-bookshelf2','c1-bookshelf2-lines','c1-clock','c1-fireplace','c1-curtains','c1-tv','c1-tv2',]
let rooms_bedRoom       = ["fiHS-bed", "fiHS-bed-1", "fiHS-bed-2", "fiCS1-bunk", "fiCS1-hostel", "fiCS1-bed",'c1-bunkBeds','c1-bed','c1-babyCarriage','c1-bed-couch','c1-bedpost','c1-massage','c1-baby','c1-makeupTable','c1-mannequin','c1-closet1','c1-closet2','c1-closet3','c1-closet4','c1-closet5','c1-closet6','c1-shirt2','c1-shirt3',]
let rooms_office        = ["fiCS1-desk-5", "fiCS1-chair", "fiCS1-desk-chair", "fiCS1-desk-chair-1", "fiCS1-desk-2", "fiCS1-desk-3", "fiCS1-desk-4", "fiE-agenda", "fiE-picture-1", "fiE-picture-2", "fiHS-desk", "fiHS-desk-2", "fiHS-office-chair-10", "fiHS-office-chair-11", "fiHS-office-chair-2", "fiHS-office-chair-3", "fiHS-office-chair-4", "fiHS-office-chair-5", "fiHS-office-chair-6", "fiHS-office-chair-7", "fiHS-office-chair-8", "fiHS-office-chair-9", 'c1-officeChair','c1-desk','c1-archive','c1-computerDesk','c1-laptop',]
let rooms_garage        = ['c1-car1','c1-drill1','c1-powerSaw','c1-grinder','c1-drill2','c1-garage','c1-weights','c1-circular-saw','c1-hammer','c1-motorbike','c1-bike',]
let rooms_games         = ["fiCS1-knight", "fiCS1-queen", "fiCS1-rook", "fiCS1-symbols", "fiCS1-game-console", "fiCS1-gamer", "fiCS1-game-console-1", "fiCS1-game-controller", "fiCS1-game-controller-1", "fiCS1-game-console-2", "c1-console", "c1-controller1", "c1-controller2", "c1-controller3", "c1-controller4", 'c1-dvd','c1-console','c1-controller2','c1-controller3','c1-lab','c1-microscope','c1-robot','c1-movieCamera','c1-theaterLight','c1-weight','c1-projector',]
let rooms_miscellaneous = ["fiHS-window", "fiHS-window-2", "fiHS-window-3", "fiHS-window-4", "fiHS-window-5", "fiHS-window-7", "fiHS-window-8", "fiHS-window-9", "fiCS1-bag",'c1-iron1','c1-dude','c1-dudette','c1-wheel-chair','c1-wheelchair','c1-people','c1-pool','c1-leaf','c1-stars','c1-swimming','c1-chess-horse','c1-arrow-target','c1-meditation','c1-swimming-circle','c1-court','c1-cinema','c1-chatBubbles','c1-house','c1-alarmClock','c1-brain','c1-xmastree','c1-cat','c1-skull','c1-nuclear-circle','c1-fence',]
let rooms_hallway       = ["fiHS-door-2", "fiHS-door-3", "fiHS-door-4", "fiHS-door-5", "fiHS-door-6", "fiCS1-dungeon","fiHS-hanger", "fiHS-hanger-1", "fiHS-stairs", "fiHS-stairs-1", "fiCS1-stairs", "fiCS1-stairs-1",'c1-door-plant','c1-tree-thing','c1-stairs','c1-door-plant-lines','c1-signpost',]
let rooms_music         = ["fiCS1-speakers", "fiCS1-drum", "fiCS1-electric-guitar", "fiCS1-violin", "fiE-microphone", "fiE-microphone-1", "fiCS1-turntable-1", "fiCS1-music", "fiCS1-turntable", "fiCS1-workstation",'c1-rec','c1-speakers1','c1-speaker2','c1-speakers3','c1-band','c1-drums','c1-musicalNotes','c1-musicNote','c1-musicCompose','c1-dance2',]
let rooms_furniture     = ["fiHS-bookshelf-4", "fiHS-chest-of-drawers", "fiHS-chest-of-drawers-1", "fiHS-chest-of-drawers-2", "fiHS-chest-of-drawers-5", "fiHS-chest-of-drawers-6", "fiHS-closet-2", "fiHS-closet-3", "fiHS-closet-4", "fiHS-dressing", "fiHS-wardrobe", "fiHS-wardrobe-1", "fiHS-wardrobe-2","fiHS-bookshelf", "fiHS-bookshelf-1", "fiHS-bookshelf-2", "fiHS-bookshelf-3", "fiHS-desk-3", "fiHS-dressing-2", "fiHS-library", "fiHS-nightstand", "fiHS-nightstand-1", "fiHS-nightstand-2", "fiHS-table", "fiHS-table-1", "fiHS-table-2", "fiHS-table-3", "fiHS-table-4", "fiHS-table-5", "fiHS-table-6", "fiCS1-flower"]

let unused        = ["fiHS-bookcase","fiHS-cactus-1", "fiHS-stool-1", "fiHS-stool-2", "fiHS-toilet", "fiHS-couch-4", "fiHS-couch-5", "fiHS-couch-9", "fiHS-sofa", "fiHS-sofa-1", "fiHS-sofa-15", "fiHS-sofa-18", "fiHS-couch-7", "fiHS-sofa-11", "fiHS-sofa-12", "fiHS-couch-2", "fiHS-sofa-4", "fiHS-sofa-5", "fiHS-sofa-13", "fiHS-livingroom", "fiHS-stool", "fiHS-office-chair", "fiHS-closet-1", "fiHS-chest-of-drawers-4", "fiHS-dressing-1", "fiCS1-bookcase", "fiHS-door-1", "fiCS1-door-1" ];

let devices_tools       = ["fiCS1-saw", "fiCS1-drill", 'c1-drill1',  'c1-powerSaw',  'c1-grinder',  'c1-drill2',  'c1-circularSaw',  'c1-hammer',]
let devices_games       = ["fiCS1-knight", "fiCS1-queen", "fiCS1-rook", "fiCS1-symbols", "fiCS1-game-console", "fiCS1-gamer", "fiCS1-game-console-1", "fiCS1-game-controller", "fiCS1-game-controller-1", "fiCS1-game-console-2"]
let devices_tech        = ["fiCS1-flash", "fiCS1-servers", "fiCS1-electric-device", "fiE-video-camera-1", "fiE-video-player-1", "fiE-wifi", "fiE-wifi-1", "fiHS-air-conditioner", "fiHS-air-conditioner-1", "fiHS-cooler", "c1-dvd", "c1-fan2", "c1-lab", "c1-microscope", "c1-atom", "c1-recycler", "c1-nuclear", "c1-appleLogo", "fiHS-vacuum-cleaner", "c1-vacuum", "c1-vacuum2", "c1-robot", "c1-wifiLogo", "c1-router", "c1-musicPlayer", "c1-speakers1", "c1-speakers3", "c1-speaker2", "c1-speaker"]
let devices_office      = ["fiCS1-printer", "fiCS1-printer-1", "fiE-print", 'c1-scanner',  'c1-scanner2',  'c1-hdd1',  'c1-hdd2',  'c1-transmitHdd',  'c1-laptop',  'c1-screen',  'c1-computer',  'c1-pc',  'c1-printer',  'c1-monitor',  'c1-archive',  'c1-fan',  'c1-alarm1',  'c1-alarm2',  'c1-airco',  'c1-airco2',  'c1-alarmClock',  'c1-cube1',  'c1-cube2',]
let devices_bedRoom     = ['c1-shirt1',  'c1-weight',  'c1-shirt2',  'c1-shirt3',  'c1-iron',  "fiHS-iron",  'c1-speechbubble',  'c1-bedOnWheels',  'c1-baby',  'c1-babyCarriage',]
let devices_misc        = [ "fiHS-radiator-3", "fiHS-radiator-4", "fiHS-sandwich-maker", "fiHS-vacuum-cleaner", "fiHS-valve", "fiHS-window", "fiHS-window-1", "fiHS-window-6",  'c1-chatBubbles','c1-people','c1-pool','c1-crosshairs','c1-crosshairsPin','c1-Pin','c1-skull','c1-xmastree','c1-house','c1-safety-pin','c1-wheel-barrow','c1-squiggly','c1-stars','c1-wheel-barrow-lines','c1-massage','c1-weights','c1-cinema','c1-fireplace','c1-curtains','c1-nuclear-circle','c1-meditation','c1-makeupTable','c1-iron1','c1-musicNote','c1-musicCompose','c1-dance2','c1-movieCamera','c1-band','c1-drums','c1-musicalNotes','c1-mannequin','c1-radiator','c1-thermometer','c1-wheelchair2','c1-recordPlayer','c1-waterSensor','c1-windSensor',]
let devices_kitchen     = ["fiCS1-coffee-cup", "fiCS1-coffee-machine", "fiCS1-tea-cup", "fiHS-blender", "fiHS-boiler", "fiHS-dishwasher", "fiHS-food-steamer", "fiHS-fridge", "fiHS-fridge-1", "fiHS-fridge-2", "fiHS-heater", "fiHS-hood", "fiHS-juicer", "fiHS-meat-grinder", "fiHS-microwave", "fiHS-microwave-1", "fiHS-mixer", "fiHS-mixer-1", "fiHS-mixer-2", "fiHS-mixer-3", "fiHS-sewing-machine", "fiHS-coffee-machine", "fiHS-cooker"  ,'c1-foodWine',  'c1-blender1',  'c1-blender2',  'c1-blender3',  'c1-fridge',  'c1-fridge2',  'c1-fridge3',  'c1-fridge4',  'c1-inductionCooker',  'c1-forkKnife',  'c1-cocktailGlass1',  'c1-drink',  'c1-boiler',  'c1-coffee1',  'c1-plate',  'c1-beer',  'c1-cocktailGlass2',  'c1-blender4',  'c1-dinnerbulb',  'c1-plate2',  'c1-coffee2',  'c1-soup',  'c1-oven',  'c1-oven2',  'c1-oven3',  'c1-cleaver',  'c1-coffeepot',  'c1-coffee3',  'c1-coffeemachine',  'c1-coffee4',  'c1-coffeebean',  'c1-mixer',  'c1-toaster',  'c1-exhaustHood',  'c1-exhaustHood2',  'c1-microwave',]
let devices_rides       = [ 'c1-car1',  'c1-bike',  'c1-motorbike',]
let devices_furniture   = ['c1-stellingkast', 'c1-chillChair1',  'c1-chillChair2',  'c1-portrait',  'c1-closet1',  'c1-closet2',  'c1-closet3',  'c1-desk',  'c1-bed',  'c1-tvSetup',  'c1-rockingChair',  'c1-bunkBeds',  'c1-officeChair',  'c1-tvSetup2',  'c1-computerDesk',  'c1-cupboard',  'c1-couch',  'c1-chair',  'c1-bookshelf',  'c1-bed-couch',]
let devices_sockets     = ["c1-socket", "c1-socket2", "fiCS1-plugin", "fiCS1-socket", "fiCS1-socket-1", "fiCS1-socket-2", "fiCS1-socket-3", "fiCS1-socket-4", "fiCS1-plugin-1", "fiCS1-socket-5", "fiCS1-socket-6", "fiCS1-plug", "fiCS1-plugin-2"]
let devices_screens     = ["fiE-television-1", "fiCS1-television", "fiCS1-imac", "fiCS1-monitor", "c1-tv", "c1-tv1", "c1-tv2", "c1-projector"]
let devices_music       = ["fiCS1-headphones", "fiCS1-headphones-1", "fiCS1-speakers", "fiCS1-workstation", "fiCS1-turntable", "fiCS1-music", "fiCS1-turntable-1", "fiCS1-drum", "fiCS1-electric-guitar", "fiCS1-violin", "fiE-compact-disc", "fiE-compact-disc-1", "fiE-microphone", "fiE-microphone-1", "fiE-server"]
let devices_outside     = ["fiCS1-forest", "fiCS1-tree", "fiCS1-sun", "fiCS1-botanical",  'c1-cat',  'c1-horse',  'c1-frost1',  'c1-frost2',  'c1-rain1',  'c1-fire1',  'c1-weather1',  'c1-tree',  'c1-sun',  'c1-sunrise',  'c1-leaf',  'c1-plant',  'c1-droplet',  'c1-tree-pot',  'c1-arrow-target',  'c1-garage',]
let devices_bathroom    =  ["fiCS1-furniture-and-household-12", "fiHS-washing-machine", "fiHS-washing-machine-1", "fiHS-water-heater",  'c1-sink1',  'c1-sink2',  'c1-sink3',  'c1-sink4',  'c1-washingMachine',  'c1-toiletPaper',  'c1-toiletroll2',  'c1-showertub',  'c1-washingmachine2',  'c1-wcsign',  'c1-swimming-circle',  'c1-medicine',  'c1-testtube',  'c1-medicine-bottle',  'c1-wheel-chair',  'c1-hairDryer',  'c1-hairIron',  'c1-hairIron2',  'c1-hairCurler',  'c1-iron2',  'c1-shaver1',  'c1-shaver2',  'c1-toothbrush',]




let devicesCollected = [...devices_furniture, ...devices_misc, ...devices_sockets, ...devices_screens, ...devices_music, ...miscLights, ...standingLights, ...ceilingLights, ...wallMountedLights, ...furnitureLights, ...devices_tools,  ...devices_games,  ...devices_tech,  ...devices_office,  ...devices_bedRoom,  ...devices_kitchen,  ...devices_rides,  ...devices_outside,  ...devices_bathroom,]
let roomsCollected = [...rooms_plants,  ...rooms_bathroom,  ...rooms_kitchen,  ...rooms_livingRoom,  ...rooms_bedRoom,  ...rooms_office,  ...rooms_garage,  ...rooms_games,  ...rooms_miscellaneous,  ...rooms_hallway,  ...rooms_music,     ...rooms_furniture,  ]
let appCollected = [...app]

let collectionToPlace = [
];

let totalCollected = [...roomsCollected, ...unused]

let remaining = [];

let duplicates = {}

totalCollected.forEach((c) => {
  if (duplicates[c] === undefined) {
    duplicates[c] = true;
  }
  else {
    console.log("DUPLICATE", c)
  }
})

collectionToPlace.forEach((l) => {
  if (totalCollected.indexOf(l) === -1) {
    remaining.push(l);
    console.log("REMAINING ICON", l)
  }
})


export class IconDevSelector extends LiveComponent<{callback(icon: string) : void, icon: string, backgrounds: any}, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Pick_an_Icon"), closeModal: true});
  }

  c1Maps = {};
  chunks = 1;

  constructor(props) {
    super(props);

    this.chunks = props.chunks || 1;
  }

  render() {
    let icons = {
      limited:  remaining,
      plants:       rooms_plants,
      bathroom:     rooms_bathroom,
      kitchen:      rooms_kitchen,
      livingRoom:   rooms_livingRoom,
      bedRoom:      rooms_bedRoom,
      office:       rooms_office,
      garage:       rooms_garage,
      games:        rooms_games,
      miscellaneous:rooms_miscellaneous,
      hallway:      rooms_hallway,
      music:        rooms_music,
      furniture:    rooms_furniture,
      hidden:     [],
    }









    return (
      <Background fullScreen={true} image={background.detailsDark} hideNotifications={true} hideOrangeLine={true} >
        <View style={{backgroundColor: colors.csOrange.hex, height:2, width:screenWidth}} />
        <ScrollView>
          <DevIconSelection
            icons={icons}
            selectedIcon={this.props.icon}
            debug={true}
            offsets={{}}
            callback={(newIcon) => {
              this.props.callback(newIcon);
              NavigationUtil.back();
            }}
          />
        </ScrollView>
      </Background>
    );
  }
}
