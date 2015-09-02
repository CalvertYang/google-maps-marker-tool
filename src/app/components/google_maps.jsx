'use strict';

import React from 'react';
import MarkerActions from '../actions/MarkerActions';
import MarkerStore from '../stores/MarkerStore';
import styles from '../app.css';
import _ from 'lodash';

export default class GoogleMaps extends React.Component {
  constructor(props) {
    super(props);

    this.state = MarkerStore.getState();
    this.infowindow = null;
    this.markers = [];

    this.handleStoreChange = (state) => {
      this.setState(state);
    };
  }

  componentDidMount() {
    MarkerStore.listen(this.handleStoreChange);

    let mapOptions = {
      center: this._getDefaultCenterLatLng(),
      zoom: this.props.zoom,
      styles: [{
        featureType: "poi.business",
        elementType: "labels",
        stylers: [
          { visibility: "off", },
        ],
      }],
    };

    this.map = new google.maps.Map(React.findDOMNode(this), mapOptions);
    this._setMarkers(this.state);

    if (this.markers.length > 0) {
      this.map.setCenter(_.last(this.markers).data.getPosition());
    }
  }

  componentWillUpdate(nextProps, nextState) {
    let currentLocationIds = _.pluck(this.markers, 'locationId');
    let nextLocationIds = _.pluck(nextState.locations, 'id');

    switch (nextState.action) {
      case 'add_marker':
        let newLocationIds = _.difference(nextLocationIds, currentLocationIds);

        newLocationIds.forEach(newLocationId => {
          let location = _.find(nextState.locations, location => {
            return location.id === newLocationId;
          });

          if (location) {
            let marker = this._createMarker(nextState, location);

            this.markers.push({
              locationId: location.id,
              data: marker,
              lastUpdateTime: location.lastUpdateTime,
            });

            this.map.setCenter(marker.getPosition());
          }
        });
        break;
      case 'update_setting':
        if (this.state.customFieldOneName !== nextState.customFieldOneName || this.state.customFieldTwoName !== nextState.customFieldTwoName) {
          this.markers.forEach(marker => {
            marker.data.setMap(null);
          });

          this.markers = [];
          this._setMarkers(nextState);
        }
        break;
      case 'update_marker':
        nextState.locations.forEach(location => {
          let marker = _.find(this.markers, marker => {
            return location.id === marker.locationId;
          });

          if (location.lastUpdateTime !== marker.lastUpdateTime) {
            marker.data.setMap(null);

            _.remove(this.markers, marker => {
              return marker.locationId === location.id;
            });

            this.markers.push({
              locationId: location.id,
              data: this._createMarker(nextState, location),
              lastUpdateTime: location.lastUpdateTime,
            });
          }
        });
        break;
      case 'delete_location':
        let removedLocationIds = _.difference(currentLocationIds, nextLocationIds);

        removedLocationIds.forEach(removedLocationId => {
          let marker = _.find(this.markers, marker => {
            return marker.locationId === removedLocationId;
          });

          if (marker) {
            marker.data.setMap(null);
          }
        });
        break;
      case 'set_center':
        let marker = _.find(this.markers, marker => {
          return marker.locationId === nextState.centerLocationId;
        });

        this.map.setCenter(marker.data.getPosition());

        if (this.infowindow) {
          this.infowindow.close();
        }
        break;
      default:
        break;
    }
  }

  componentWillUnmount() {
    MarkerStore.unlisten(this.handleStoreChange);
  }

  _getDefaultCenterLatLng() {
    return new google.maps.LatLng(this.state.defaultLatitude, this.state.defaultLongitude);
  }

  _setMarkers(state) {
    let locations = state.locations;

    if (locations.length == 0) {
      this.map.setCenter(this._getDefaultCenterLatLng());
    }

    locations.forEach((location) => {
      this.markers.push({
        locationId: location.id,
        data: this._createMarker(state, location),
        lastUpdateTime: location.lastUpdateTime,
      });
    });
  }

  _createMarker(state, location) {
    let myLatLng = new google.maps.LatLng(location.latitude, location.longitude);
    let markerOptions = {
      position: myLatLng,
      map: this.map,
      title: location.customFieldOne,
      draggable: true,
    };

    if (location.iconUrl) {
      markerOptions["icon"] = {
        url: location.iconUrl,
        scaledSize: new google.maps.Size(40, 40),
      };
    }

    let marker = new google.maps.Marker(markerOptions);

    let content = "";

    if (location.embedCode) {
      content += "<p>" + location.embedCode + "</p>";
    }

    content +=
      `<p>${state.customFieldOneName}：` + location.customFieldOne + "</p>" +
      `<p>${state.customFieldTwoName}：` + location.customFieldTwo + "</p>";

    google.maps.event.addListener(marker, "click", () => {
      if (this.infowindow) {
        this.infowindow.close();
      }

      let infowindow = new google.maps.InfoWindow({ content: content });
      infowindow.open(this.map, marker);

      this.infowindow = infowindow;
    });

    google.maps.event.addListener(marker, "dragend", () => {
      let point = marker.getPosition();
      let data = {
        locationId: location.id,
        latitude: point.lat(),
        longitude: point.lng(),
      };

      MarkerActions.updateMarkerLatLng(data);
    });

    return marker;
  }

  render() {
    return (
      <div className={styles.content}></div>
    );
  }
}

GoogleMaps.defaultProps = {
  zoom: 16,
}
