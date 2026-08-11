import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      containerStyle={{ zIndex: 99999 }}
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: '14px',
          background: '#ffffff',
          color: '#1e293b',
          border: '1px solid #e2e8f0',
          fontSize: '13px',
          fontWeight: '500',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        },
        success: { iconTheme: { primary: '#22C55E', secondary: '#fff' } },
        error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
      }}
    />
  );
}

