/**
 * Main App component
 */

import { Navigation } from './Navigation';
import { PrescriptionForm } from './PrescriptionForm';
import { AdminInterface } from './AdminInterface';
import { PrescriptionsList } from './PrescriptionsList';
import { ReportsEditor } from './ReportsEditor';
import { ReportsList } from './ReportsList';
import { UpdateNotification } from './UpdateNotification';
import { EventManager } from '../utils/EventManager';
import { StateManager } from '../utils/StateManager';

export class App {
  private container: HTMLElement;
  private navigation: Navigation;
  private stateManager: StateManager;
  private eventManager: EventManager;
  private updateNotification: UpdateNotification;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'app-container';
    
    this.stateManager = new StateManager();
    this.eventManager = new EventManager();
    this.navigation = new Navigation(this.eventManager);
    this.updateNotification = new UpdateNotification();
    
    this.setupEventListeners();
  }

  async initialize(): Promise<void> {
    try {
      // Create navigation
      this.container.appendChild(this.navigation.render());

      // Create main content area
      const mainContent = document.createElement('div');
      mainContent.id = 'main-content';
      this.container.appendChild(mainContent);

      // Add to document
      document.body.appendChild(this.container);

     

      // Load initial view
      await this.loadView('prescription');
      
      console.log('🏥 Clinic Management System initialized');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showError('Failed to initialize application');
    }
  }


  private setupEventListeners(): void {
    this.eventManager.on('navigation:change', (view: string) => {
      this.loadView(view);
    });

    this.eventManager.on('prescription:saved', () => {
      // Success alert removed for streamlined user experience
    });

    this.eventManager.on('prescription:error', (error: string) => {
      this.showError(error);
    });
  }

  private async loadView(view: string): Promise<void> {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    try {
      
      switch (view) {
        case 'prescription':
          const prescriptionForm = new PrescriptionForm(this.eventManager, this.stateManager);
          mainContent.innerHTML = await prescriptionForm.render();
          await prescriptionForm.initialize();
          break;
          
        case 'prescriptions-list':
          const prescriptionsList = new PrescriptionsList(this.eventManager, this.stateManager);
          mainContent.innerHTML = await prescriptionsList.render();
          await prescriptionsList.initialize();
          break;
          
        case 'reports':
          const reportsEditor = new ReportsEditor(this.eventManager, this.stateManager);
          mainContent.innerHTML = await reportsEditor.render();
          await reportsEditor.initialize();
          break;

        case 'reports-list':
          const reportsList = new ReportsList(this.eventManager, this.stateManager);
          mainContent.innerHTML = await reportsList.render();
          await reportsList.initialize();
          break;
          
        case 'admin':
          const adminInterface = new AdminInterface(this.eventManager, this.stateManager);
          mainContent.innerHTML = await adminInterface.render();
          await adminInterface.initialize();
          break;
          
        default:
          throw new Error(`Unknown view: ${view}`);
      }
    } catch (error) {
      console.error(`Error loading view ${view}:`, error);
      this.showError(`Failed to load ${view} view`);
    }
  }


  private showError(message: string): void {
    this.showNotification(message, 'error');
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}
