import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import styles from './SwipeableList.css';

const SwipeableList = ({ children, threshold }) => {
  const [blockSwipe, setBlockSwipe] = useState(false);

  useEffect(() => {
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchend', handleDragEnd);

    return () => {
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, []);

  const handleDragStart = () => setBlockSwipe(false);

  const handleDragEnd = () => setBlockSwipe(false);

  return (
    <div
      className={styles.swipeableList}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      data-testid="list-wrapper"
    >
      {React.Children.map(children, child =>
        React.cloneElement(child, { blockSwipe, threshold })
      )}
    </div>
  );
};

SwipeableList.propTypes = {
  children: PropTypes.node,
  scrollElement:
    typeof EventTarget !== 'undefined'
      ? PropTypes.instanceOf(EventTarget)
      : PropTypes.any,
  threshold: PropTypes.number
};

export default SwipeableList;
