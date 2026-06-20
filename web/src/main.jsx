import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import './styles.css';
import App from './App.jsx';
import { isBrowser } from './fetchNui.js';

const theme = createTheme({
  fontFamily: 'Roboto, sans-serif',
  primaryColor: 'blue',
  defaultRadius: 'md',
  components: {
    Paper: {
      defaultProps: { withBorder: false },
      styles: {
        root: {
          backgroundColor: 'rgba(24, 24, 27, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
  },
});

if (isBrowser) {
  const root = document.getElementById('root');
  root.style.backgroundImage = 'url("https://i.imgur.com/vDGEfYg.jpeg")';
  root.style.backgroundSize = 'cover';
  root.style.backgroundPosition = 'center';
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <App />
    </MantineProvider>
  </React.StrictMode>,
);
