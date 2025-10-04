/**
 * Navigation component
 */

import { EventManager } from '../utils/EventManager';

export class Navigation {
  private eventManager: EventManager;
  private currentTab: string = 'prescription';

  constructor(eventManager: EventManager) {
    this.eventManager = eventManager;
  }

  render(): HTMLElement {
    const nav = document.createElement('nav');
    nav.className = 'main-navigation no-print';
    
    nav.innerHTML = `
      <div class="nav-tabs">
        <button class="nav-tab active" data-view="prescription">الروشتات</button>
        <button class="nav-tab" data-view="prescriptions-list">قائمة الروشتات</button>
        <button class="nav-tab" data-view="reports">كتابة تقرير</button>
        <button class="nav-tab" data-view="reports-list">قائمة التقارير</button>
        <button class="nav-tab" data-view="admin">إعدادات النظام</button>
      </div>
    `;

    this.setupEventListeners(nav);
    return nav;
  }

  private setupEventListeners(nav: HTMLElement): void {
    const tabs = nav.querySelectorAll('.nav-tab');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const view = target.dataset.view;
        
        if (view && view !== this.currentTab) {
          this.switchTab(view, tabs);
          this.eventManager.emit('navigation:change', view);
        }
      });
    });
  }

  private switchTab(view: string, tabs: NodeListOf<Element>): void {
    tabs.forEach(tab => {
      tab.classList.remove('active');
      if ((tab as HTMLElement).dataset.view === view) {
        tab.classList.add('active');
      }
    });
    this.currentTab = view;
  }
}
