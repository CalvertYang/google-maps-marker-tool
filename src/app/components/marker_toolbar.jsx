'use strict';

import React from 'react';
import MarkerActions from '../actions/MarkerActions';
import MarkerStore from '../stores/MarkerStore'
import mui from 'material-ui';
import beautify from 'js-beautify';
import Highlight from 'react-highlight';
import _ from 'lodash';

let ThemeManager = new mui.Styles.ThemeManager();
let Colors = mui.Styles.Colors;
let RaisedButton = mui.RaisedButton;
let Dialog = mui.Dialog;
let TextField = mui.TextField;
let Tabs = mui.Tabs;
let Tab = mui.Tab;

export default class MarkerToolbar extends React.Component {
  constructor(props) {
    super(props);

    this.state = MarkerStore.getState();

    this.handleStoreChange = (state) => {
      this.setState(state);
    };
  }

  componentDidMount() {
    MarkerStore.listen(this.handleStoreChange);
  }

  componentWillUnmount() {
    MarkerStore.unlisten(this.handleStoreChange);
  }

  getChildContext() {
    return {
      muiTheme: ThemeManager.getCurrentTheme()
    };
  }

  _handleErrorInputChange(target) {
    switch (target) {
      case 'customFieldOneText':
        if (this.refs.customFieldOneText.getValue().trim() === "") {
          this.refs.customFieldOneText.setErrorText("This field is required.");
        } else {
          this.refs.customFieldOneText.setErrorText("");
        }
        break;
      case 'customFieldTwoText':
        if (this.refs.customFieldTwoText.getValue().trim() === "") {
          this.refs.customFieldTwoText.setErrorText("This field is required.");
        } else {
          this.refs.customFieldTwoText.setErrorText("");
        }
        break;
    }
  }

  _getHtmlSorceCode() {
    let code =
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Google Maps Marker</title>
          <meta name="viewport" content="initial-scale=1.0, user-scalable=no">
          <meta charset="utf-8">
          <meta name="generator" content="Google Maps APIs Marker Tool by CalvertYang">
          <style>
            html, body, #${this.state.domIdForMap} { height: 100%; margin: 0; padding: 0; }
          </style>
          <script src="https://maps.googleapis.com/maps/api/js${this.state.apiKey === '' ? '' : '?key=' + this.state.apiKey}"></script>
          <script>
          ${this._getJavascriptSourceCode()}
          </script>
        </head>
        <body>
          <div id="${this.state.domIdForMap}"></div>
        </body>
      </html>`;

    code = beautify.html_beautify(code, { indent_size: 4 });

    return code;
  }

  _getJavascriptSourceCode() {
    let locationData = `var locations = [`;

    this.state.locations.forEach(location => {
      locationData += "{";

      if (location.iconUrl) {
        locationData += `iconUrl: '${location.iconUrl}',`;
      }

      if (location.embedCode) {
        locationData += `embedCode: '${location.embedCode}',`;
      }

      locationData += `customFieldOne: '${location.customFieldOne}',`;
      locationData += `customFieldTwo: '${location.customFieldTwo}',`;
      locationData += `latitude: ${location.latitude},`;
      locationData += `longitude: ${location.longitude},`;
      locationData += "},";
    });
    locationData += "];";

    let code = `
      var infowindow;
      (function () {
        google.maps.Map.prototype.markers = new Array();

        google.maps.Map.prototype.addMarker = function(marker) {
          this.markers[this.markers.length] = marker;
        };

        google.maps.Map.prototype.getMarkers = function() {
          return this.markers
        };

        google.maps.Map.prototype.clearMarkers = function() {
          if(infowindow) {
            infowindow.close();
          }

          this.markers.forEach(function(marker) {
            marker.setMap(null);
          });
        };
      })();

      function initialize() {
        var mapOptions = {
          zoom: 16,
          center: new google.maps.LatLng(${this.state.defaultLatitude}, ${this.state.defaultLongitude}),
          styles: [{
            featureType: "poi.business",
            elementType: "labels",
            stylers: [
              { visibility: "off" }
            ]
          }],
        };
        var map = new google.maps.Map(document.getElementById("${this.state.domIdForMap}"), mapOptions);

        setMarkers(map, locations);
      }

      ${locationData}

      function createMarker(map, location) {
        var myLatLng = new google.maps.LatLng(location.latitude, location.longitude);
        var icon, markerOptions = {
          position: myLatLng,
          map: map,
          title: location.customField1,
        };

        if (location.iconUrl) {
          markerOptions["icon"] = {
            url: location.iconUrl,
            size: new google.maps.Size(40, 40),
          };
        }

        var marker = new google.maps.Marker(markerOptions);
        var content = "";

        if (location.embedCode) {
          content += "<p>" + location.embedCode + "</p>";
        }

        content +=
          "<p>${this.state.customFieldOneName}：" + location.customFieldOne + "</p>" +
          "<p>${this.state.customFieldTwoName}：" + location.customFieldTwo + "</p>";

        map.setCenter(marker.getPosition());

        google.maps.event.addListener(marker, "click", function() {
          if (infowindow) infowindow.close();
          infowindow = new google.maps.InfoWindow({content: content});
          infowindow.open(map, marker);
        });

        return marker;
      }

      function setMarkers(map, locations) {
         locations.forEach(function(location) {
          map.addMarker(createMarker(map, location));
        });
      }
      google.maps.event.addDomListener(window, "load", initialize);`;

    code = beautify.js_beautify(code, { indent_size: 4 });

    return code;
  }

  _onTouchTapAddMarkerButton() {
    this.refs.newMarkerDialog.show();
  }

  _onTouchTapEmbedCodeButton() {
    this.refs.embedCodeDialog.show();
  }

  _onChangeImportData() {
    if (this.refs.importDataInput.getDOMNode().files.length > 0) {
      let reader = new FileReader();

      reader.onload = (e) => {
        try {
          let locationData = JSON.parse(reader.result);

          // Check locationData is valid
          if (_.has(locationData, "domIdForMap") && _.has(locationData, "customFieldOneName") &&
            _.has(locationData, "customFieldTwoName") && _.has(locationData, "locations")) {
            let hasError = false;

            locationData.locations.forEach(location => {
              if (!_.has(location, "customFieldOne") || !_.has(location, "customFieldTwo") ||
                !_.has(location, "latitude") || !_.has(location, "longitude")) {
                hasError = true;
              }
            });

            if (hasError) {
              this.refs.errorDialog.show();
            } else {
              MarkerActions.importLocationData(locationData);
            }
          } else {
            this.refs.errorDialog.show();
          }
        } catch (e) {
          this.refs.errorDialog.show();
        }
      }

      reader.readAsText(this.refs.importDataInput.getDOMNode().files[0], "utf-8");

      this.refs.importDataInput.getDOMNode().value = null;
    }
  }

  _onTouchTapCustomizeButton() {
    this.refs.customizeDialog.show();
  }

  _onShowNewMarkerDialog() {
    this.refs.iconUrlText.focus();
  }

  _onNewMarkerDialogSubmit() {
    let iconUrl = this.refs.iconUrlText.getValue().trim(),
        customFieldOne = this.refs.customFieldOneText.getValue().trim(),
        customFieldTwo = this.refs.customFieldTwoText.getValue().trim(),
        embedCode = this.refs.embedCodeText.getValue().trim(),
        hasError = false;

    if (customFieldTwo === "") {
      this.refs.customFieldTwoText.setErrorText("This field is required.");
      this.refs.customFieldTwoText.focus();
      hasError = true;
    }

    if (customFieldOne === "") {
      this.refs.customFieldOneText.setErrorText("This field is required.");
      this.refs.customFieldOneText.focus();
      hasError = true;
    }

    if (hasError) {
      return;
    } else {
      let data = {
        customFieldOne: customFieldOne,
        customFieldTwo: customFieldTwo,
      };

      if (iconUrl) {
        data["iconUrl"] = iconUrl;
      }

      if (embedCode) {
        data["embedCode"] = embedCode;
      }

      MarkerActions.addMarker(data);
      this.refs.newMarkerDialog.dismiss();
    }
  }

  _onCustomizeDialogSubmit() {
    let data = {
      newDomIdForMap: this.refs.newDomIdForMap.getValue().trim(),
      newCustomFieldOneName: this.refs.newCustomFieldOneName.getValue().trim(),
      newCustomFieldTwoName: this.refs.newCustomFieldTwoName.getValue().trim(),
      newApiKey: this.refs.newApiKey.getValue().trim(),
    }

    MarkerActions.updateCustomizeSetting(data);
    this.refs.customizeDialog.dismiss();
  }

  render() {
    let errorDialogActions = [
      { text: 'Close' },
    ];

    let newMarkerDialogActions = [
      { text: "Cancel" },
      { text: "Submit", onTouchTap: this._onNewMarkerDialogSubmit.bind(this), ref: "submit" },
    ];

    let embedCodeDialogActions = [
      { text: "Close" },
    ];

    let customizeDialogActions = [
      { text: "Close" },
      { text: "Submit", onTouchTap: this._onCustomizeDialogSubmit.bind(this), ref: "submit" },
    ];

    return (
      <div>
        <Dialog
          title="Error"
          actions={errorDialogActions}
          ref="errorDialog"
        >
          Invalid JSON file！
        </Dialog>

        <Dialog
          title="Add Marker"
          actions={newMarkerDialogActions}
          actionFocus="submit"
          autoScrollBodyContent={true}
          onShow={this._onShowNewMarkerDialog.bind(this)}
          ref="newMarkerDialog"
        >
          <TextField
            floatingLabelText="Marker Icon URL (Optional)"
            fullWidth={true}
            hintText="Leave blank if you don't want to change marker icon."
            ref="iconUrlText"
          />

          <TextField
            floatingLabelText={this.state.customFieldOneName}
            fullWidth={true}
            onChange={this._handleErrorInputChange.bind(this, "customFieldOneText")}
            ref="customFieldOneText"
          />

          <TextField
            floatingLabelText={this.state.customFieldTwoName}
            fullWidth={true}
            hintText="Find lat and lng by this field."
            onChange={this._handleErrorInputChange.bind(this, "customFieldTwoText")}
            ref="customFieldTwoText"
          />

          <TextField
            floatingLabelText="Embed Code (Optional)"
            fullWidth={true}
            multiLine={true}
            rows={10}
            ref="embedCodeText"
          />
        </Dialog>

        <Dialog
          title="Google Maps Embed Code"
          actions={embedCodeDialogActions}
          autoScrollBodyContent={true}
          ref="embedCodeDialog"
        >
          <Tabs style={{height: "400px"}}>
            <Tab label="JAVASCRIPT">
              <Highlight className="javascript">
                {this._getJavascriptSourceCode()}
              </Highlight>
            </Tab>
            <Tab label="JAVASCRIPT + HTML">
              <Highlight className="html">
                {this._getHtmlSorceCode()}
              </Highlight>
            </Tab>
          </Tabs>
        </Dialog>

        <Dialog
          title="Customize Setting"
          actions={customizeDialogActions}
          actionFocus="submit"
          autoScrollBodyContent={true}
          ref="customizeDialog"
        >
          <TextField
            floatingLabelText={`HTML DOM id for mount Google Maps`}
            defaultValue={this.state.domIdForMap}
            fullWidth={true}
            ref="newDomIdForMap"
          />

          <TextField
            floatingLabelText={`Change name of field '${this.state.customFieldOneName}'`}
            defaultValue={this.state.customFieldOneName}
            fullWidth={true}
            ref="newCustomFieldOneName"
          />

          <TextField
            floatingLabelText={`Change name of field '${this.state.customFieldTwoName}' (Find latitude and longitude by this field)`}
            defaultValue={this.state.customFieldTwoName}
            fullWidth={true}
            ref="newCustomFieldTwoName"
          />

          <TextField
            floatingLabelText={`Google Maps JavaScript API Key (Leave blank if you don't have key)`}
            defaultValue={this.state.apiKey}
            fullWidth={true}
            ref="newApiKey"
          />
        </Dialog>

        <div className="mdl-grid">
          <div className="mdl-cell mdl-cell--12-col">
            <RaisedButton
              label="Add Marker"
              onTouchTap={this._onTouchTapAddMarkerButton.bind(this)}
            />&nbsp;&nbsp;
            <RaisedButton
              label="Embed Code"
              labelColor="#fff"
              backgroundColor={Colors.deepPurpleA200}
              onTouchTap={this._onTouchTapEmbedCodeButton.bind(this)}
            />&nbsp;&nbsp;
            <RaisedButton
              label="Import Data"
              labelColor="#fff"
              backgroundColor={Colors.blue500}
            >
              <input
                type="file"
                style={{
                  cursor: "pointer",
                  position: "absolute",
                  top: "0px",
                  bottom: "0px",
                  right: "0px",
                  left: "0px",
                  opacity: "0",
                }}
                accept="application/json"
                onChange={this._onChangeImportData.bind(this)}
                ref="importDataInput"
              />
            </RaisedButton>&nbsp;&nbsp;
            <RaisedButton
              label="Export Data"
              labelColor="#fff"
              backgroundColor={Colors.orange800}
            >
              <a
                style={{
                  position: "absolute",
                  top: "0px",
                  bottom: "0px",
                  right: "0px",
                  left: "0px",
                }}
                href={this.state.exportDataUrl}
                download="markers_data.json"
              />
            </RaisedButton>&nbsp;&nbsp;
            <RaisedButton
              label="Customize"
              backgroundColor={Colors.grey500}
              onTouchTap={this._onTouchTapCustomizeButton.bind(this)}
            />
          </div>
        </div>
      </div>
    );
  }
}

MarkerToolbar.childContextTypes = {
  muiTheme: React.PropTypes.object
}
