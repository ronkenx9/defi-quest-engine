"use client";

interface IWalletNotification {
    publicKey?: string;
    shortAddress?: string;
    walletName?: string;
    metadata?: {
        name: string;
        url: string;
        icon: string;
        supportedTransactionVersions?: any;
    };
}

// Simple notification component using Matrix-styled toast
const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    console.log(`[${type.toUpperCase()}] ${message}`);

    if (typeof window !== 'undefined') {
        const notification = document.createElement('div');
        notification.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      background: ${type === 'error' ? 'rgba(239, 68, 68, 0.9)' : type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(0, 255, 0, 0.1)'};
      color: ${type === 'info' ? '#00ff00' : 'white'};
      padding: 12px 20px;
      border-radius: 4px;
      border: 1px solid ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#00ff00'};
      z-index: 9999;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      box-shadow: 0 0 20px rgba(0,255,0,0.1);
      backdrop-filter: blur(8px);
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.1em;
      transition: all 0.3s ease;
    `;
        notification.textContent = `> ${message}`;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
};

export const WalletNotification = {
    onConnect: ({ shortAddress, walletName }: IWalletNotification) => {
        showNotification(`ACCESS GRANTED: ${walletName} (${shortAddress})`, 'success');
    },
    onConnecting: ({ walletName }: IWalletNotification) => {
        showNotification(`INITIALIZING LINK: ${walletName}...`, 'info');
    },
    onDisconnect: ({ walletName }: IWalletNotification) => {
        showNotification(`LINK SEVERED: ${walletName}`, 'info');
    },
    onError: ({ walletName }: IWalletNotification) => {
        showNotification(`CONNECTION PROTOCOL FAILED: ${walletName}`, 'error');
    },
    onNotInstalled: ({ walletName }: IWalletNotification) => {
        showNotification(`HARDWARE NOT DETECTED: ${walletName}`, 'error');
    },
};

export default WalletNotification;
