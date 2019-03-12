import React, { Component } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import Icon from '@material-ui/core/Icon';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

const styles = theme => ({
  icon: {
    width: "1.2rem"
  },
  buttons: {
    display: "inline",
    cursor: "pointer",
  },
  subscribeButton: {
    position: "relative",
    top: "2px",
    display: "inline",
    paddingLeft: 5,
    color: theme.palette.text.secondary,
    "&:hover": {
      color: theme.palette.text.primary
    }
  },
  label: {
    width: 58,
    textAlign: "center",
    color: theme.palette.text.secondary
  }
});

const defaultSubscribeLabel = "Subscribe";

class SubscribeWidget extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dialogOpen: false,
      method: "",
      subscribeLabel: defaultSubscribeLabel
    };
  }

  openDialog(method) {
    this.setState({ dialogOpen: true, method });
  }

  setSubscribeLabel(label) {
    this.setState({
      subscribeLabel: label,
      subscribeLabelHighlighted: true
    });
  }

  resetSubscribeLabel() {
    this.setState({
      subscribeLabel: defaultSubscribeLabel,
      subscribeLabelHighlighted: false
    });
  }

  render() {
    const { classes, className, view } = this.props;
    const { dialogOpen, method, subscribeLabel } = this.state;

    return (
      <span className={classNames(className, classes.buttons)}>
        <span className={classes.label} onClick={ () => this.openDialog("email") }>
          {subscribeLabel}
        </span>
        <span
          className={classes.subscribeButton}
          onClick={ () => this.openDialog("rss") }
          onMouseEnter={ () => this.setSubscribeLabel("Via RSS") }
          onMouseLeave={ () => this.resetSubscribeLabel() }
        >
          <Icon fontSize="inherit" className={classes.icon}>rss_feed</Icon>
        </span>
        <span
          className={classes.subscribeButton}
          onClick={ () => this.openDialog("email") }
          onMouseEnter={ () => this.setSubscribeLabel("Via Email") }
          onMouseLeave={ () => this.resetSubscribeLabel() }
        >
          <Icon fontSize="inherit" className={classes.icon}>email</Icon>
        </span>
        { dialogOpen && <Components.SubscribeDialog
          open={true}
          onClose={ () => this.setState({ dialogOpen: false })}
          view={view}
          method={method} /> }
      </span>
    );
  }
}

registerComponent('SubscribeWidget', SubscribeWidget, withStyles(styles, { name: "SubscribeWidget" }));
