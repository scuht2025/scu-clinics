import './index.css';
import { App } from './renderer/components/App';

// Initialize the application
async function initializeApp() {
  try {
    const app = new App();
    await app.initialize();
  } catch (error) {
    console.error('Failed to initialize application:', error);
    document.body.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
        <div style="text-align: center; color: #ef4444;">
          <h2>خطأ في تحميل التطبيق</h2>
          <p>فشل في تهيئة التطبيق. يرجى إعادة تشغيل البرنامج.</p>
          <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px; background: #0d9488; color: white; border: none; border-radius: 5px; cursor: pointer;">
            إعادة المحاولة
          </button>
        </div>
      </div>
    `;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

console.log('🏥 Clinic Management System initialized');