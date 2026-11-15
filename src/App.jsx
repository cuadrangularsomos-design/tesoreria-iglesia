import React from 'react';

export default function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'sans-serif',
      backgroundColor: '#f8fafc',
      color: '#334155',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#0f172a' }}>🛠️ En Mantenimiento</h1>
        <p style={{ fontSize: '15px', lineHeight: '1.5', color: '#64748b' }}>
          La plataforma de tesorería se encuentra temporalmente en mantenimiento. Estaremos de regreso en breve. Gracias por su comprensión.
        </p>
      </div>
    </div>
  );
}
