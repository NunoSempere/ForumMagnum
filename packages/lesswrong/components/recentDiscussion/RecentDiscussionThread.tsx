import React, { useState, useCallback } from 'react';
import {
  Components,
  registerComponent,
} from '../../lib/vulcan-lib';

import classNames from 'classnames';
import { unflattenComments, CommentTreeNode } from '../../lib/utils/unflatten';
import withErrorBoundary from '../common/withErrorBoundary'
import { useRecordPostView } from '../common/withRecordPostView';

import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import type { CommentTreeOptions } from '../comments/commentTree';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: theme.spacing.unit*4,
    position: "relative",
    minHeight: 58,
    boxShadow: theme.palette.boxShadow.default,
    borderRadius: 3,
    backgroundColor: theme.palette.panelBackground.recentDiscussionThread,
  },
  postStyle: theme.typography.postStyle,
  postItem: {
    // position: "absolute",
    // right: "100%",
    paddingBottom:10,
    ...theme.typography.postStyle,
    // width: 300,
    // marginTop: -2,
    // textAlign: "right",
    // marginRight: -theme.spacing.unit
  },
  continueReading: {
    marginTop:theme.spacing.unit*2,
    marginBottom:theme.spacing.unit*2,
  },
  postHighlight: {
    overflow: "hidden",
    '& a, & a:hover, & a:focus, & a:active, & a:visited': {
      backgroundColor: "none"
    }
  },
  noComments: {
    paddingBottom: 16
  },
  threadMeta: {
    cursor: "pointer",

    "&:hover $showHighlight": {
      opacity: 1
    },
  },
  showHighlight: {
    opacity: 0,
  },
  content :{
    marginLeft: 4,
    marginRight: 4,
    paddingBottom: 1
  },
  commentsList: {
    marginTop: 12,
    marginLeft: 12,
    marginBottom: 8,
    [theme.breakpoints.down('sm')]: {
      marginLeft: 0,
      marginRight: 0,
      marginBottom: 0
    }
  },
  post: {
    paddingTop: 18,
    paddingLeft: 16,
    paddingRight: 16,
    background: theme.palette.panelBackground.default,
    borderRadius: 3,
    marginBottom:4,
    
    [theme.breakpoints.down('xs')]: {
      paddingTop: 16,
      paddingLeft: 14,
      paddingRight: 14,
    },
  },
  titleAndActions: {
    display: "flex",
  },
  title: {
    ...theme.typography.display2,
    ...theme.typography.postStyle,
    flexGrow: 1,
    marginTop: 0,
    marginBottom: 8,
    display: "block",
    fontSize: "1.75rem",
  },
  actions: {
    "& .PostsPageActions-icon": {
      fontSize: "1.5em",
    },
    opacity: 0.2,
    "&:hover": {
      opacity: 0.4,
    },
    marginRight: -8,
    marginTop: -8,
  },
})

const RecentDiscussionThread = ({
  post,
  comments, refetch,
  expandAllThreads: initialExpandAllThreads,
  classes,
}: {
  post: PostsRecentDiscussion,
  comments: Array<CommentsList>,
  refetch: any,
  expandAllThreads?: boolean,
  classes: ClassesType,
}) => {
  const [highlightVisible, setHighlightVisible] = useState(false);
  const [readStatus, setReadStatus] = useState(false);
  const [markedAsVisitedAt, setMarkedAsVisitedAt] = useState<Date|null>(null);
  const [expandAllThreads, setExpandAllThreads] = useState(false);
  const { isRead, recordPostView } = useRecordPostView(post);
  const [showSnippet] = useState(!isRead || post.commentCount === null); // This state should never change after mount, so we don't grab the setter from useState

  const markAsRead = useCallback(
    () => {
      setReadStatus(true);
      setMarkedAsVisitedAt(new Date());
      setExpandAllThreads(true);
      recordPostView({post, extraEventProperties: {type: "recentDiscussionClick"}})
    },
    [setReadStatus, setMarkedAsVisitedAt, setExpandAllThreads, recordPostView, post]
  );
  const showHighlight = useCallback(
    () => {
      setHighlightVisible(!highlightVisible);
      markAsRead();
    },
    [setHighlightVisible, highlightVisible, markAsRead]
  );

  const { PostsGroupDetails, PostsItemMeta, CommentsNode, PostsHighlight, PostsPageActions } = Components

  const lastCommentId = comments && comments[0]?._id
  const nestedComments = unflattenComments(comments);

  const lastVisitedAt = markedAsVisitedAt || post.lastVisitedAt

  if (comments && !comments.length && post.commentCount != null) {
    // New posts should render (to display their highlight).
    // Posts with at least one comment should only render if that those comments meet the frontpage filter requirements
    return null
  }

  const highlightClasses = classNames(classes.postHighlight, {
    [classes.noComments]: post.commentCount === null
  })
  
  const treeOptions: CommentTreeOptions = {
    scrollOnExpand: true,
    lastCommentId: lastCommentId,
    markAsRead: markAsRead,
    highlightDate: lastVisitedAt,
    refetch: refetch,
    condensed: true,
    post: post,
  };

  return (
    <AnalyticsContext pageSubSectionContext='recentDiscussionThread'>
      <div className={classes.root}>
        <div className={classes.post}>
          <div className={classes.postItem}>
            {post.group && <PostsGroupDetails post={post} documentId={post.group._id} inRecentDiscussion={true} />}
            <div className={classes.titleAndActions}>
              <Link to={postGetPageUrl(post)} className={classes.title}>
                {post.title}
              </Link>
              <div className={classes.actions}>
                <PostsPageActions post={post} vertical />
              </div>
            </div>
            <div className={classes.threadMeta} onClick={showHighlight}>
              <PostsItemMeta post={post}/>
            </div>
          </div>
          <div className={highlightClasses}>
            <PostsHighlight post={post} maxLengthWords={lastVisitedAt ? 50 : 170} />
          </div>
        </div>
        {nestedComments.length ? <div className={classes.content}>
          <div className={classes.commentsList}>
            {nestedComments.map((comment: CommentTreeNode<CommentsList>) =>
              <div key={comment.item._id}>
                <CommentsNode
                  treeOptions={treeOptions}
                  startThreadTruncated={true}
                  expandAllThreads={initialExpandAllThreads || expandAllThreads}
                  nestingLevel={1}
                  comment={comment.item}
                  childComments={comment.children}
                  key={comment.item._id}
                />
              </div>
            )}
          </div>
        </div> : null}
      </div>
    </AnalyticsContext>
  )
};

const RecentDiscussionThreadComponent = registerComponent(
  'RecentDiscussionThread', RecentDiscussionThread, {
    styles,
    hocs: [withErrorBoundary],
    areEqual: {
      post: (before, after) => (before?._id === after?._id),
      refetch: "ignore",
    },
  }
);

declare global {
  interface ComponentTypes {
    RecentDiscussionThread: typeof RecentDiscussionThreadComponent,
  }
}

