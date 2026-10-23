import {ready} from '../comum/integracao.js';
import {mountMissionBoard} from '../comum/mission-board.js';
ready.then(()=>mountMissionBoard(document.querySelector('#missions-app'))).catch(e=>document.querySelector('#missions-app').textContent=e.message);
