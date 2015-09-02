import alt from '../alt';
import MarkerActions from '../actions/MarkerActions'
import $ from 'jquery';
import _ from 'lodash';

class MarkerStore {
  constructor() {
    this.state = {
      defaultLatitude: 25.047627,
      defaultLongitude: 121.516969,
      domIdForMap: "map-canvas",
      customFieldOneName: "Title",
      customFieldTwoName: "Address",
      locations : [],
      centerLocationId: 0,
      currentIndex: 0,
      currentMarker: {
        latitude: 0,
        longitude: 0,
      },
      action: "initial",
      exportDataUrl: "javascript:;",
    };

    this.bindListeners({
      handleAddMarker: MarkerActions.addMarker,
      handleUpdateCustomizeSetting: MarkerActions.updateCustomizeSetting,
      handleUpdateMarker: MarkerActions.updateMarker,
      handelUpdateMarkerLatLng: MarkerActions.updateMarkerLatLng,
      handleSetMarkerCentered: MarkerActions.setMarkerCentered,
      handleSetCurrentMarkerInfo: MarkerActions.setCurrentMarkerInfo,
      handleDeleteLocation: MarkerActions.deleteLocation,
      handleImportLocationData: MarkerActions.importLocationData,
    });
  }

  getGeoByAddress(address, callback) {
    $.ajax({
      url: "//maps.google.com/maps/api/geocode/json",
      type: "get",
      dataType: "json",
      data: {address: address},
    })
    .done((data, status, xhr) => {
      callback(data.results);
    })
    .fail((xhr, options, err) => {
    })
    .always((xhr, status) => {
    });
  }

  generateExportDataUrl() {
    let exportDataUrl = "javascript:;";

    if (this.state.locations.length > 0) {
      let locations = _.clone(this.state.locations, true);
      locations.forEach(location => {
        delete location.id;
        delete location.lastUpdateTime;
      });

      let exportData = {
        domIdForMap: this.state.domIdForMap,
        customFieldOneName: this.state.customFieldOneName,
        customFieldTwoName: this.state.customFieldTwoName,
        locations: locations,
      };

      exportDataUrl = `data:text/json;charset=utf-8, ${encodeURIComponent(JSON.stringify(exportData))}`;
    }

    this.setState({
      exportDataUrl: exportDataUrl,
    });
  }

  handleAddMarker(data) {
    this.getGeoByAddress(data.customFieldTwo, (results) => {
      let latitude = this.state.defaultLatitude,
          longitude = this.state.defaultLongitude;

      if (results.length != 0) {
        latitude = results[0].geometry.location.lat;
        longitude = results[0].geometry.location.lng;
      }

      data["id"] = this.state.currentIndex + 1;
      data["latitude"] = latitude;
      data["longitude"] = longitude;
      data["lastUpdateTime"] = new Date().getTime();

      let locations = this.state.locations.concat(data);

      this.setState({
        action: "add_marker",
        locations: locations,
        centerLocationId: data.id,
        currentIndex: data.id,
      });
      this.generateExportDataUrl();
    });

    return false;
  }

  handleUpdateCustomizeSetting(data) {
    let newState = {
      action: "update_setting",
    };

    if (data.newDomIdForMap !== "") {
      newState["domIdForMap"] = data.newDomIdForMap;
    }

    if (data.newCustomFieldOneName !== "") {
      newState["customFieldOneName"] = data.newCustomFieldOneName;
    }

    if (data.newCustomFieldTwoName !== "") {
      newState["customFieldTwoName"] = data.newCustomFieldTwoName;
    }

    this.setState(newState);
    this.generateExportDataUrl();
  }

  handleUpdateMarker(data) {
    let location = this.state.locations.filter(location => {
      return location.id === data.locationId;
    }).pop();

    location.customFieldOne = data.customFieldOne;
    location.iconUrl = data.iconUrl;
    location.embedCode = data.embedCode;

    if (location.iconUrl === "") {
      delete location.iconUrl;
    }

    if (location.embedCode === "") {
      delete location.embedCode;
    }

    this.getGeoByAddress(data.customFieldTwo, (results) => {
      let latitude = this.state.defaultLatitude,
          longitude = this.state.defaultLongitude;

      if (results.length != 0) {
        latitude = results[0].geometry.location.lat;
        longitude = results[0].geometry.location.lng;
      }

      location.customFieldTwo = data.customFieldTwo;
      location.latitude = latitude;
      location.longitude = longitude;
      location.lastUpdateTime = new Date().getTime();

      this.state.action = "update_marker";
      this.generateExportDataUrl();
    });

    return false;
  }

  handelUpdateMarkerLatLng(data) {
    let location = this.state.locations.filter(location => {
      return location.id === data.locationId;
    }).pop();

    location.latitude = data.latitude;
    location.longitude = data.longitude;

    this.state.action = "do_nothing";
    this.generateExportDataUrl();
  }

  handleSetMarkerCentered(locationId) {
    this.setState({
      action: "set_center",
      centerLocationId: locationId,
    });
  }

  handleSetCurrentMarkerInfo(locationId) {
    let location = this.state.locations.filter(location => {
      return location.id === locationId;
    }).pop();

    this.setState({
      action: "do_nothing",
      currentMarker: _.clone(location, true),
    });
  }

  handleDeleteLocation() {
    _.remove(this.state.locations, location => {
      return location.id === this.state.currentMarker.id;
    });

    this.state.action = "delete_location";
    this.generateExportDataUrl();
  }

  handleImportLocationData(data) {
    this.state.domIdForMap = data.domIdForMap;
    this.state.customFieldOneName = data.customFieldOneName;
    this.state.customFieldTwoName = data.customFieldTwoName;

    data.locations.forEach(importLocation => {
      let location = {
        id: this.state.currentIndex + 1,
        customFieldOne: importLocation.customFieldOne,
        customFieldTwo: importLocation.customFieldTwo,
        latitude: importLocation.latitude,
        longitude: importLocation.longitude,
        lastUpdateTime: new Date().getTime(),
      };

      if (importLocation.iconUrl) {
        location["iconUrl"] = importLocation.iconUrl;
      }

      if (importLocation.embedCode) {
        location["embedCode"] = importLocation.embedCode;
      }

      let locations = this.state.locations.concat(location);

      this.state.action = "add_marker";
      this.state.locations = locations;
      this.state.centerLocationId = location.id;
      this.state.currentIndex = location.id;
    });

    this.generateExportDataUrl();
  }
}

export default alt.createStore(MarkerStore, "MarkerStore");
