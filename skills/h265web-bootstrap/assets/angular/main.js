import 'zone.js';
import '@angular/compiler';
import {Component, ElementRef, inject, provideZoneChangeDetection} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';
import {createDemo} from '../common/h265web-demo.js';
import {demoConfig} from '../demo-config.js';
import '../common/player.css';

// A small JIT demo. Existing Angular CLI/AOT apps use their own normal component build.
class Player {
  element = inject(ElementRef);
  ngAfterViewInit() { this.demo = createDemo(this.element.nativeElement.querySelector('.angular-player'), demoConfig); }
  ngOnDestroy() { void this.demo?.destroy().catch(error => console.error(error.message)); }
}
Component({selector: 'app-root', standalone: true,
  template: '<main><h1>h265web.js 播放示例</h1><div class="angular-player"></div></main>'})(Player);
bootstrapApplication(Player, {providers: [provideZoneChangeDetection()]});
