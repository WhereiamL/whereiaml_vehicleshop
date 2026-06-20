import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import './styles.css';
import App from './App.jsx';

const theme = createTheme({
  fontFamily: 'Inter, "Segoe UI", sans-serif',
  primaryColor: 'amber',
  primaryShade: 6,
  defaultRadius: 'sm',
  colors: {
    amber: [
      '#fff8e1', '#ffecb3', '#ffe082', '#ffd54f', '#ffca28',
      '#f0b429', '#d99e1f', '#b3801a', '#8c6314', '#66470d',
    ],
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <App />
    </MantineProvider>
  </React.StrictMode>,
);
