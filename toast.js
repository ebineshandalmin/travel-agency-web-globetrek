const Toast = {
    container: null,
    init() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.cssText = `
            position: fixed; top: 1.5rem; right: 1.5rem; z-index: 9999;
            display: flex; flex-direction: column; gap: 0.75rem;
        `;
        document.body.appendChild(this.container);
    },
    show(message, type = 'success', duration = 3500) {
        this.init();
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        const colors = {
            success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
            error: 'bg-red-50 text-red-800 border-red-200',
            warning: 'bg-amber-50 text-amber-800 border-amber-200',
            info: 'bg-sky-50 text-sky-800 border-sky-200'
        };
        const iconColors = {
            success: 'text-emerald-600',
            error: 'text-red-600',
            warning: 'text-amber-600',
            info: 'text-sky-600'
        };
        const toast = document.createElement('div');
        toast.className = `toast-item ${colors[type]} border rounded-xl shadow-lg px-5 py-4 pr-6 flex items-center gap-3`;
        toast.innerHTML = `<i class="fas ${icons[type]} ${iconColors[type]} text-xl"></i><span class="text-sm font-medium">${message}</span>`;
        this.container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};
const style = document.createElement('style');
style.textContent = `
@keyframes toast-in { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
.toast-item { animation: toast-in 0.3s ease-out; }
`;
document.head.appendChild(style);
export default Toast;