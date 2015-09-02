'use strict';

import React from 'react';
import MarkerBox from './components/marker_box';
import GoogleMaps from './components/google_maps';
import InjectTapEventPlugin from 'react-tap-event-plugin';

InjectTapEventPlugin();

React.render(<GoogleMaps />, document.querySelector("#maps_box"));
React.render(<MarkerBox />, document.querySelector("#marker_box"));
