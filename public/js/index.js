import { initAuthForms, renderUserStatus } from './auth.js';

window.addEventListener('DOMContentLoaded', async () => {
  initAuthForms();
  await renderUserStatus();
});
