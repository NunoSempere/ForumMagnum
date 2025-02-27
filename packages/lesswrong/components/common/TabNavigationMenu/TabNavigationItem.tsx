import { registerComponent, Components } from '../../../lib/vulcan-lib';
import React from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import { Link } from '../../../lib/reactRouterWrapper';
import classNames from 'classnames';
import { useLocation } from '../../../lib/routeUtil';
import { MenuTabRegular } from './menuTabs';

export const iconWidth = 30

const styles = (theme: ThemeType): JssStyles => ({
  selected: {
    '& $icon': {
      opacity: 1,
    },
    '& $navText': {
      color: theme.palette.grey[900],
      fontWeight: 600,
    },
  },
  navButton: {
    '&:hover': {
      opacity:.6,
      backgroundColor: 'transparent' // Prevent MUI default behavior of rendering solid background on hover
    },
    
    ...(theme.forumType === "LessWrong"
      ? {
        paddingTop: 7,
        paddingBottom: 8,
        paddingLeft: 16,
        paddingRight: 16,
      } : {
        padding: 16,
      }
    ),
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    flexDirection: "row",
  },
  subItemOverride: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    '&:hover': {
      backgroundColor: 'transparent' // Prevent MUI default behavior of rendering solid background on hover
    }
  },
  icon: {
    opacity: .3,
    width: iconWidth,
    height: 28,
    marginRight: 16,
    display: "inline",
    
    "& svg": {
      fill: "currentColor",
      color: theme.palette.icon.navigationSidebarIcon,
      ...(theme.forumType === "LessWrong"
        ? { transform: "scale(0.8)" }
        : {}
      ),
    },
  },
  navText: {
    ...theme.typography.body2,
    color: theme.palette.grey[800],
    textTransform: "none !important",
  },
  homeIcon: {
    '& svg': {
      height: 29,
      position: "relative",
      top: -1,
    }
  },
})

type TabNavigationItemProps = {
  tab: MenuTabRegular,
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void,
  classes: ClassesType,
}

const TabNavigationItem = ({tab, onClick, classes}: TabNavigationItemProps) => {
  const { TabNavigationSubItem, LWTooltip } = Components
  const { pathname } = useLocation()
  
  // MenuItem takes a component and passes unrecognized props to that component,
  // but its material-ui-provided type signature does not include this feature.
  // Cast to any to work around it, to be able to pass a "to" parameter.
  const MenuItemUntyped = MenuItem as any;
  
  // Due to an issue with using anchor tags, we use react-router links, even for
  // external links, we just use window.open to actuate the link.
  const externalLink = /https?:\/\//.test(tab.link);
  let handleClick = onClick
  if (externalLink) {
    handleClick = (e) => {
      e.preventDefault()
      window.open(tab.link, '_blank')?.focus()
      onClick && onClick(e)
    }
  }

  return <LWTooltip placement='right-start' title={tab.tooltip || ''}>
    <MenuItemUntyped
      onClick={handleClick}
      // We tried making this a function that return an a tag once. It made the
      // entire sidebar fail on iOS. True story.
      component={Link}
      to={tab.link}
      disableGutters
      classes={{root: classNames({
        [classes.navButton]: !tab.subItem,
        [classes.subItemOverride]: tab.subItem,
        [classes.selected]: pathname === tab.link,
      })}}
      disableTouchRipple
    >
      {(tab.icon || tab.iconComponent) && <span
        className={classNames(classes.icon, {[classes.homeIcon]: tab.id === 'home'})}
      >
        {tab.iconComponent && <tab.iconComponent />}
        {tab.icon && tab.icon}
      </span>}
      {tab.subItem ?
        <TabNavigationSubItem>
          {tab.title}
        </TabNavigationSubItem> :
        <span className={classes.navText}>
          {tab.title}
        </span>
      }
    </MenuItemUntyped>
  </LWTooltip>
}

const TabNavigationItemComponent = registerComponent(
  'TabNavigationItem', TabNavigationItem, {styles}
);

declare global {
  interface ComponentTypes {
    TabNavigationItem: typeof TabNavigationItemComponent
  }
}
