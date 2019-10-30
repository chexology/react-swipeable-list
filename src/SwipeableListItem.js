import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import styles from './SwipeableListItem.css';

const SwipeActionPropType = PropTypes.shape({
  action: PropTypes.func.isRequired,
  content: PropTypes.node.isRequired
});

const debugDragDirection = direction => {
  switch (direction) {
    case 1:
      console.info('N, NE, NW - GÓRA');
      break;
    case 2:
      console.info('S, SE, SW - DÓŁ');
      break;
    case 3:
      console.info('W - LEWO');
      break;
    case 4:
      console.info('E - PRAWO');
      break;
    case 5:
      console.info('NOT SET YET');
      break;
  }
};

const DragDirection = {
  UP: 1,
  DOWN: 2,
  LEFT: 3,
  RIGHT: 4,
  UNKNOWN: 5
};

class SwipeableListItem extends PureComponent {
  constructor(props) {
    super(props);

    this.dragStartPoint = { x: 0, y: 0 };
    this.dragDirection = DragDirection.UNKNOWN;
    this.dragHorizontalDirectionThreshold = props.swipeStartThreshold || 10;
    this.dragVerticalDirectionThreshold = props.scrollStartThreshold || 10;

    this.contentLeft = null;
    this.contentRight = null;
    this.listElement = null;
    this.wrapper = null;

    this.left = 0;

    this.fpsInterval = 1000 / 60;
    this.startTime = null;
  }

  resetState = () => {
    this.dragStartPoint = { x: -1, y: -1 };
    this.dragDirection = DragDirection.UNKNOWN;
    this.left = 0;
  };

  componentDidMount() {
    this.wrapper.addEventListener('mousedown', this.handleDragStartMouse);
    this.wrapper.addEventListener('touchstart', this.handleDragStartTouch);
  }

  componentWillUnmount() {
    this.wrapper.removeEventListener('mousedown', this.handleDragStartMouse);
    this.wrapper.removeEventListener('touchstart', this.handleDragStartTouch);
  }

  handleDragStartMouse = event => {
    event.stopPropagation();

    window.addEventListener('mouseup', this.handleDragEndMouse);
    window.addEventListener('mousemove', this.handleMouseMove);

    this.wrapper.addEventListener('mouseup', this.handleDragEndMouse);
    this.wrapper.addEventListener('mousemove', this.handleMouseMove);

    this.handleDragStart(event);
  };

  handleDragStartTouch = event => {
    // do not stop propagation here as it can be handled by parent to start scrolling

    window.addEventListener('touchend', this.handleDragEndTouch);

    this.wrapper.addEventListener('touchend', this.handleDragEndTouch);
    this.wrapper.addEventListener('touchmove', this.handleTouchMove);

    const touch = event.targetTouches[0];
    this.handleDragStart(touch);
  };

  handleDragStart = ({ clientX, clientY }) => {
    this.dragStartPoint = { x: clientX, y: clientY };

    this.listElement.className = styles.content;
    if (this.contentLeft) {
      this.contentLeft.className = styles.contentLeft;
    }

    if (this.contentRight) {
      this.contentRight.className = styles.contentRight;
    }

    this.startTime = Date.now();
    requestAnimationFrame(this.updatePosition);
  };

  handleTouchMove = event => this.handleMove(event, event.targetTouches[0]);

  handleMouseMove = event => this.handleMove(event, event);

  handleMove = (event, { clientX, clientY }) => {
    if (this.dragStartedWithinItem()) {
      this.setDragDirection(clientX, clientY);

      if (this.isSwiping()) {
        event.stopPropagation();
        if (event.cancelable) {
          event.preventDefault();
        }

        const delta = clientX - this.dragStartPoint.x;
        if (this.shouldMoveItem(delta)) {
          this.left = delta;
        }
      }
    }
  };

  handleDragEndMouse = () => {
    window.removeEventListener('mouseup', this.handleDragEndMouse);
    window.removeEventListener('mousemove', this.handleMouseMove);

    this.wrapper.removeEventListener('mouseup', this.handleDragEndMouse);
    this.wrapper.removeEventListener('mousemove', this.handleMouseMove);

    this.handleDragEnd();
  };

  handleDragEndTouch = () => {
    window.removeEventListener('touchend', this.handleDragEndTouch);

    this.wrapper.removeEventListener('touchend', this.handleDragEndTouch);
    this.wrapper.removeEventListener('touchmove', this.handleTouchMove);

    this.handleDragEnd();
  };

  handleDragEnd = () => {
    if (this.isSwiping()) {
      const threshold = this.props.threshold || 0.5;

      if (this.left < this.listElement.offsetWidth * threshold * -1) {
        this.handleSwipedLeft();
      } else if (this.left > this.listElement.offsetWidth * threshold) {
        this.handleSwipedRight();
      }
    }

    this.resetState();
    this.listElement.className = styles.contentReturn;
    this.listElement.style.transform = `translateX(${this.left}px)`;

    // hide backgrounds
    if (this.contentLeft) {
      this.contentLeft.style.opacity = 0;
      this.contentLeft.className = styles.contentLeftReturn;
    }

    if (this.contentRight) {
      this.contentRight.style.opacity = 0;
      this.contentRight.className = styles.contentRightReturn;
    }
  };

  shouldMoveItem = delta => {
    const {
      swipeLeft: { content: contentLeft } = {},
      swipeRight: { content: contentRight } = {},
      blockSwipe
    } = this.props;
    const swipingLeft = delta < 0;
    const swipingRight = delta > 0;

    return (
      !blockSwipe &&
      ((swipingLeft && contentLeft) || (swipingRight && contentRight))
    );
  };

  dragStartedWithinItem = () => {
    const { x, y } = this.dragStartPoint;

    return x !== -1 && y !== -1;
  };

  setDragDirection = (x, y) => {
    if (this.dragDirection === DragDirection.UNKNOWN) {
      const { x: startX, y: startY } = this.dragStartPoint;
      const angle = Math.atan2(y - startY, x - startX);
      const octant = Math.round((8 * angle) / (2 * Math.PI) + 8) % 8;
      const length = Math.sqrt(
        Math.pow(x - startX, 2) + Math.pow(y - startY, 2)
      );

      if (
        length <= this.dragHorizontalDirectionThreshold &&
        length <= this.dragVerticalDirectionThreshold
      ) {
        return DragDirection.UNKNOWN;
      }

      switch (octant) {
        case 0:
          if (length > this.dragHorizontalDirectionThreshold) {
            this.dragDirection = DragDirection.RIGHT;
          }
          break;
        case 1:
        case 2:
        case 3:
          if (length > this.dragVerticalDirectionThreshold) {
            this.dragDirection = DragDirection.DOWN;
          }
          break;
        case 4:
          if (length > this.dragHorizontalDirectionThreshold) {
            this.dragDirection = DragDirection.LEFT;
          }
          break;
        case 5:
        case 6:
        case 7:
          if (length > this.dragVerticalDirectionThreshold) {
            this.dragDirection = DragDirection.UP;
          }
          break;
      }

      console.info('SET UP to ', this.dragDirection);
      debugDragDirection(this.dragDirection);
    }

    return this.dragDirection;
  };

  isSwiping = () =>
    this.dragDirection === DragDirection.LEFT ||
    this.dragDirection === DragDirection.RIGHT;

  updatePosition = () => {
    const { blockSwipe } = this.props;

    if (this.dragStartedWithinItem() && !blockSwipe) {
      requestAnimationFrame(this.updatePosition);
    }

    const now = Date.now();
    const elapsed = now - this.startTime;

    if (this.dragStartedWithinItem() && elapsed > this.fpsInterval) {
      let contentToShow = this.left < 0 ? this.contentLeft : this.contentRight;
      let contentToHide = this.left < 0 ? this.contentRight : this.contentLeft;

      if (!contentToShow) {
        return;
      }

      const opacity = (Math.abs(this.left) / 100).toFixed(2);

      if (this.isSwiping()) {
        this.listElement.style.transform = `translateX(${this.left}px)`;

        if (opacity < 1 && opacity.toString() !== contentToShow.style.opacity) {
          contentToShow.style.opacity = opacity.toString();

          if (contentToHide) {
            contentToHide.style.opacity = '0';
          }
        }

        if (opacity >= 1) {
          contentToShow.style.opacity = '1';
        }
      }

      this.startTime = Date.now();
    }
  };

  handleSwipedLeft = () => {
    const { swipeLeft: { action } = {} } = this.props;

    if (action) {
      action();
    }
  };

  handleSwipedRight = () => {
    const { swipeRight: { action } = {} } = this.props;

    if (action) {
      action();
    }
  };

  bindContentLeft = ref => (this.contentLeft = ref);
  bindContentRight = ref => (this.contentRight = ref);
  bindListElement = ref => (this.listElement = ref);
  bindWrapper = ref => (this.wrapper = ref);

  render() {
    const { children, swipeLeft, swipeRight } = this.props;

    return (
      <div className={styles.swipeableListItem} ref={this.bindWrapper}>
        {swipeLeft && (
          <div
            ref={this.bindContentLeft}
            className={styles.contentLeft}
            data-testid="swipe-left-content"
          >
            {swipeLeft.content}
          </div>
        )}
        {swipeRight && (
          <div
            ref={this.bindContentRight}
            className={styles.contentRight}
            data-testid="swipe-right-content"
          >
            {swipeRight.content}
          </div>
        )}
        <div
          ref={this.bindListElement}
          className={styles.content}
          data-testid="content"
        >
          {children}
        </div>
      </div>
    );
  }
}

SwipeableListItem.propTypes = {
  blockSwipe: PropTypes.bool,
  children: PropTypes.node.isRequired,
  swipeLeft: SwipeActionPropType,
  swipeRight: SwipeActionPropType,
  threshold: PropTypes.number,
  swipeStartThreshold: PropTypes.number,
  scrollStartThreshold: PropTypes.number
};

export default SwipeableListItem;
