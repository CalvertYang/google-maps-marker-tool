import alt from '../alt';

class MarkerActions {
  addMarker(data) {
    this.dispatch(data);
  }

  updateCustomizeSetting(data) {
    this.dispatch(data);
  }

  updateMarker(data) {
    this.dispatch(data);
  }

  updateMarkerLatLng(data) {
    this.dispatch(data);
  }

  setMarkerCentered(locationId) {
    this.dispatch(locationId);
  }

  setCurrentMarkerInfo(locationId) {
    this.dispatch(locationId);
  }

  deleteLocation() {
    this.dispatch();
  }

  importLocationData(data) {
    this.dispatch(data);
  }
}

export default alt.createActions(MarkerActions);
