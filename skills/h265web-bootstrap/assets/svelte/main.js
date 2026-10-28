import {mount} from 'svelte';
import Player from './Player.svelte';
import '../common/player.css';
mount(Player, {target: document.getElementById('app')});
