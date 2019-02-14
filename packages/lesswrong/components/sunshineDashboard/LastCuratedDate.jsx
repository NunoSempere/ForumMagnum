import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Posts } from '../../lib/collections/posts';

const styles = theme => ({
  overflow: {
    color: "red"
  }
})

class LastCuratedDate extends Component {
  render () {
    const { classes, results } = this.props
    const { MetaInfo, FormatDate } = Components
    const curatedDate = results && results.length && results[0].curatedDate
    if (curatedDate) {
      return <div><MetaInfo>Last Curation: <FormatDate date={results[0].curatedDate}/></MetaInfo></div>
    } else {
      return null
    }
  }
}


const withListOptions = {
  collection: Posts,
  queryName: 'lastCuratedPost',
  fragmentName: 'PostsList',
};


registerComponent(
  'LastCuratedDate',
  LastCuratedDate,
  [withList, withListOptions], 
  withStyles(styles, {name: "LastCuratedDate"})
);
