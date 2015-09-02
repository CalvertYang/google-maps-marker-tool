'use strict';

import React from 'react';
import MarkerToolbar from './marker_toolbar';
import MarkerList from './marker_list';
import styles from '../app.css';

export default class MarkerBox extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className={styles.content} style={{overflow: "auto"}}>
        <MarkerToolbar />
        <MarkerList />
      </div>
    );
  }
}
