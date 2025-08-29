const API_BASE_URL = 'https://api.corpus.swecha.org/api/v1';

export function showAlert(elementId: string, message: string, type: 'danger' | 'info' | 'warning' | 'success' = 'danger') {
    const alertElement = document.getElementById(elementId);
    if (alertElement) {
        alertElement.textContent = message;
        alertElement.className = `alert alert-${type}`;
        alertElement.classList.remove('d-none');
        setTimeout(() => {
            alertElement.classList.add('d-none');
        }, 5000);
    }
}

export function clearToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId'); // Also clear userId
    window.location.href = '/login'; // Assuming a React Router setup or similar for /login
}

export { API_BASE_URL };
