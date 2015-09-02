'use strict';

import React from 'react';
import MarkerActions from '../actions/MarkerActions'
import MarkerStore from '../stores/MarkerStore'
import mui from 'material-ui';

let ThemeManager = new mui.Styles.ThemeManager();
let Colors = mui.Styles.Colors;
let List = mui.List;
let ListItem = mui.ListItem;
let ListDivider = mui.ListDivider;
let Avatar = mui.Avatar;
let FontIcon = mui.FontIcon;
let IconButton = mui.IconButton;
let IconMenu = mui.IconMenu;
let MenuItem = require('material-ui/lib/menus/menu-item');
let MenuDivider = require('material-ui/lib/menus/menu-divider');
let Card = mui.Card;
let CardHeader = mui.CardHeader;
let CardTitle = mui.CardTitle;
let CardText = mui.CardText;
let Dialog = mui.Dialog;
let TextField = mui.TextField;

export default class MarkerList extends React.Component {
  constructor(props) {
    super(props);

    this.state = MarkerStore.getState();
    this.markerInfo = {};

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
      case "customFieldOneText":
        if (this.refs.customFieldOneText.getValue().trim() === "") {
          this.refs.customFieldOneText.setErrorText("This field is required.");
        } else {
          this.refs.customFieldOneText.setErrorText("");
        }
        break;
      case "customFieldTwoText":
        if (this.refs.customFieldTwoText.getValue().trim() === "") {
          this.refs.customFieldTwoText.setErrorText("This field is required.");
        } else {
          this.refs.customFieldTwoText.setErrorText("");
        }
        break;
    }
  }

  _setMarkerCentered(locationId) {
    MarkerActions.setMarkerCentered(locationId);
  }

  _onTouchTapMoreInfoButton(locationId) {
    MarkerActions.setCurrentMarkerInfo(locationId);

    this.refs.markerInformationDialog.show();
  }

  _onTouchTapEditMarkerButton(locationId) {
    MarkerActions.setCurrentMarkerInfo(locationId);

    this.refs.editMarkerDialog.show();
  }

  _onTouchTapDeleteLocationButton(locationId) {
    MarkerActions.setCurrentMarkerInfo(locationId);

    this.refs.confirmDeleteLocationDialog.show();
  }

  _onTouchTapConfirmDeleteLocationButton() {
    MarkerActions.deleteLocation();

    this.refs.confirmDeleteLocationDialog.dismiss();
  }

  _onEditMarkerDialogSubmit() {
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
        locationId: this.state.currentMarker.id,
        iconUrl: iconUrl,
        customFieldOne: customFieldOne,
        customFieldTwo: customFieldTwo,
        embedCode: embedCode,
      };

      MarkerActions.updateMarker(data);
      this.refs.editMarkerDialog.dismiss();
    }
  }

  render() {
    let markerListElements = [];

    let markerInformationDialogActions = [
      { text: "Close" }
    ];

    let editMarkerDialogActions = [
      { text: "Cancel" },
      { text: "Submit", onTouchTap: this._onEditMarkerDialogSubmit.bind(this), ref: "submit" },
    ];

    let confirmDeleteLocationDialogActions = [
      { text: "Cancel" },
      { text: "Delete", onTouchTap: this._onTouchTapConfirmDeleteLocationButton.bind(this) },
    ];

    this.state.locations.forEach((location, index) => {
      markerListElements.push(
        <ListItem
          key={index * 2}
          leftAvatar={
            location.iconUrl === undefined ? (
              <Avatar icon={<FontIcon className="material-icons">place</FontIcon>} />
            ) : (
              <Avatar src={location.iconUrl} />
            )
          }
          rightIconButton={
            <IconMenu iconButtonElement={<IconButton iconClassName="material-icons">more_vert</IconButton>}>
              <MenuItem index={0} primaryText="More Info" onTouchTap={this._onTouchTapMoreInfoButton.bind(this, location.id)} />
              <MenuItem index={1} primaryText="Edit" onTouchTap={this._onTouchTapEditMarkerButton.bind(this, location.id)} />
              <MenuDivider />
              <MenuItem index={2} primaryText="Delete" style={{color: Colors.red500}} onTouchTap={this._onTouchTapDeleteLocationButton.bind(this, location.id)} />
            </IconMenu>
          }
          primaryText={location.customFieldOne}
          secondaryText={`${location.customFieldTwo} (${location.latitude.toFixed(7)}, ${location.longitude.toFixed(7)})`}
          onTouchTap={this._setMarkerCentered.bind(this, location.id)}
        />
      );

      if (index !== this.state.locations.length - 1) {
        markerListElements.push(<ListDivider key={index * 2 + 1}/>);
      }
    });

    return (
      <div>
        <Dialog
          title="Marker Information"
          actions={markerInformationDialogActions}
          autoScrollBodyContent={true}
          ref="markerInformationDialog"
        >
          <Card>
            <CardHeader
              title={this.state.currentMarker.customFieldOne}
              subtitle={`${this.state.currentMarker.customFieldTwo} (${this.state.currentMarker.latitude.toFixed(7)}, ${this.state.currentMarker.longitude.toFixed(7)})`}
              avatar={
                this.state.currentMarker.iconUrl === undefined ? (
                  <Avatar icon={<FontIcon className="material-icons">place</FontIcon>} />
                ) : (
                  <Avatar src={this.state.currentMarker.iconUrl} />
                )
              }
            />
            <CardText>{this.state.currentMarker.embedCode}</CardText>
          </Card>
        </Dialog>

        <Dialog
          title="Edit Marker"
          actions={editMarkerDialogActions}
          actionFocus="submit"
          autoScrollBodyContent={true}
          ref="editMarkerDialog"
        >
          <TextField
            floatingLabelText="Marker Icon URL (Optional)"
            fullWidth={true}
            hintText="Leave blank if you don't want to change marker icon."
            defaultValue={this.state.currentMarker.iconUrl}
            ref="iconUrlText"
          />

          <TextField
            floatingLabelText={this.state.customFieldOneName}
            fullWidth={true}
            onChange={this._handleErrorInputChange.bind(this, "customFieldOneText")}
            defaultValue={this.state.currentMarker.customFieldOne}
            ref="customFieldOneText"
          />

          <TextField
            floatingLabelText={this.state.customFieldTwoName}
            fullWidth={true}
            hintText="Find lat and lng by this field."
            onChange={this._handleErrorInputChange.bind(this, "customFieldTwoText")}
            defaultValue={this.state.currentMarker.customFieldTwo}
            ref="customFieldTwoText"
          />

          <TextField
            floatingLabelText="Embed Code (Optional)"
            fullWidth={true}
            multiLine={true}
            rows={10}
            defaultValue={this.state.currentMarker.embedCode}
            ref="embedCodeText"
          />
        </Dialog>

        <Dialog
          title="Are you sure?"
          actions={confirmDeleteLocationDialogActions}
          autoScrollBodyContent={true}
          ref="confirmDeleteLocationDialog"
        >
          Are you sure to delete location {this.state.currentMarker.customFieldOne}?
        </Dialog>

        <List subheader="Markers List">
          {markerListElements}
        </List>
      </div>
    );
  }
}

MarkerList.childContextTypes = {
  muiTheme: React.PropTypes.object
}
