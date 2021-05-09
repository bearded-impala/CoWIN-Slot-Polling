import React from 'react';
import { render } from 'react-dom';
import CowinNotification from './CowinNotification';
import ReactGA from 'react-ga';

ReactGA.initialize('G-37ZWS4YK2P');
render(<CowinNotification />, document.getElementById('root'));
