import React, { Component } from 'react';
import PropTypes from 'prop-types';
import VirtualList from 'react-tiny-virtual-list';
import classNames from 'classnames';
import { emptyFn, getMonthsForYear, isRange } from '../utils';
import {
  format,
  isAfter,
  isBefore,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  parse,
  isWithinRange,
} from 'date-fns';
import styles from './Years.scss';

const SPACING = 0;

const isDateDisabled = ({ date, min, minDate, max, maxDate }) =>
  isBefore(date, startOfMonth(min)) ||
  isBefore(date, startOfMonth(minDate)) ||
  isAfter(date, max) ||
  isAfter(date, maxDate);

const allowToSwitchYear = ({ selected, year, min, minDate, max, maxDate }) => {
  if (isRange(selected)) {
    return false;
  }

  if (
    isDateDisabled({
      date: new Date(selected).setYear(year),
      min,
      minDate,
      max,
      maxDate,
    })
  ) {
    return false;
  }

  return true;
};

export default class Years extends Component {
  static propTypes = {
    height: PropTypes.number,
    hideOnSelect: PropTypes.bool,
    locale: PropTypes.object,
    max: PropTypes.object,
    maxDate: PropTypes.object,
    min: PropTypes.object,
    minDate: PropTypes.object,
    onSelect: PropTypes.func,
    scrollToDate: PropTypes.func,
    selectedYear: PropTypes.number,
    setDisplay: PropTypes.func,
    theme: PropTypes.object,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    years: PropTypes.array,
  };
  static defaultProps = {
    onSelect: emptyFn,
    showMonths: true,
  };

  constructor(props) {
    super(props);
    const years = this.props.years.slice(0, this.props.years.length);
    this.selectedYearIndex = years.indexOf(
      this.getSelected(this.props.selected).start.getFullYear()
    );
  }

  handleClick(date, e) {
    let { hideOnSelect, onSelect, setDisplay, scrollToDate } = this.props;

    onSelect(date, e, date => scrollToDate(date));

    if (hideOnSelect) {
      window.requestAnimationFrame(() => setDisplay('days'));
    }
  }

  getSelected(selected) {
    if (isRange(selected)) {
      return {
        start: startOfMonth(selected.start),
        end: endOfMonth(selected.end),
      };
    }
    // remove time
    return {
      start: parse(format(selected, 'YYYY-MM-DD')),
      end: parse(format(selected, 'YYYY-MM-DD')),
    };
  }

  renderMonths(year) {
    const {
      locale: { locale },
      selected,
      theme,
      today,
      min,
      max,
      minDate,
      maxDate,
      handlers,
    } = this.props;
    const months = getMonthsForYear(
      year,
      this.getSelected(selected).start.getDate()
    );
    return (
      <ol>
        {months.map((date, index) => {
          const isSelected = isWithinRange(
            date,
            this.getSelected(selected).start,
            this.getSelected(selected).end
          );
          const isCurrentMonth = isSameMonth(date, today);
          const isDisabled = isDateDisabled({
            date,
            min,
            minDate,
            max,
            maxDate,
          });
          const style = Object.assign(
            {},
            isSelected && {
              backgroundColor:
                typeof theme.selectionColor === 'function'
                  ? theme.selectionColor(date)
                  : theme.selectionColor,
            },
            isCurrentMonth && {
              borderColor: theme.todayColor,
            }
          );
          const isStart = isSameMonth(date, selected.start);
          const isEnd = isSameMonth(date, selected.end);
          return (
            <li
              key={index}
              onClick={e => {
                e.stopPropagation();

                if (!isDisabled) {
                  this.handleClick(date, e);
                }
              }}
              className={classNames(styles.month, {
                [styles.selected]: isSelected,
                [styles.currentMonth]: isCurrentMonth,
                [styles.disabled]: isDisabled,
                [styles.range]: !(isStart && isEnd),
                [styles.start]: isStart,
                [styles.betweenRange]:
                  isWithinRange(date, selected.start, selected.end) &&
                  !isStart &&
                  !isEnd,
                [styles.end]: isEnd,
              })}
              style={style}
              title={
                isRange(selected)
                  ? ''
                  : `Set date to ${format(date, 'MMMM Do, YYYY')}`
              }
              data-month={`${format(date, 'YYYY-MM')}`}
              {...handlers}
            >
              <div
                className={styles.selection}
                data-month={`${format(date, 'YYYY-MM')}`}
              >
                {format(date, 'MMM', { locale })}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  render() {
    const {
      height,
      selected,
      showMonths,
      theme,
      today,
      width,
      min,
      minDate,
      max,
      maxDate,
    } = this.props;

    const currentYear = today.getFullYear();
    const years = this.props.years.slice(0, this.props.years.length);
    const selectedYearIndex = this.selectedYearIndex;
    const rowHeight = showMonths ? 80 : 40;
    const heights = years.map((val, index) =>
      index === 0 || index === years.length - 1
        ? rowHeight + SPACING
        : rowHeight
    );
    const isYearLess = years.length * rowHeight < height + 40;
    const containerHeight = isYearLess
      ? years.length * rowHeight + 2 * SPACING
      : height + 40;

    let scrollOffset = 0;
    if (!isYearLess && selectedYearIndex !== -1) {
      const top = heights
        .slice(0, selectedYearIndex)
        .reduce((acc, val) => acc + val, 0);
      scrollOffset = top - containerHeight / 2 + 40;
    }

    return (
      <div
        className={styles.root}
        style={{ color: theme.selectionColor, height: height + 40 }}
      >
        <VirtualList
          ref="List"
          className={styles.list}
          width={width}
          height={containerHeight}
          itemCount={years.length}
          estimatedItemSize={rowHeight}
          itemSize={index => heights[index]}
          scrollOffset={scrollOffset}
          renderItem={({ index, style }) => {
            const year = years[index];
            const isActive = index === selectedYearIndex;
            const shouldAllowToSwitchYear = allowToSwitchYear({
              selected,
              year,
              min,
              minDate,
              max,
              maxDate,
            });

            return (
              <div
                key={index}
                className={classNames(styles.year, {
                  [styles.active]: !showMonths && isActive,
                  [styles.currentYear]: !showMonths && year === currentYear,
                  [styles.withMonths]: showMonths,
                  [styles.first]: index === 0,
                  [styles.last]: index === years.length - 1,
                })}
                onClick={() =>
                  shouldAllowToSwitchYear &&
                  this.handleClick(new Date(selected).setYear(year))
                }
                title={shouldAllowToSwitchYear ? `Set year to ${year}` : ''}
                data-year={year}
                style={Object.assign({}, style, {
                  color:
                    typeof theme.selectionColor === 'function'
                      ? theme.selectionColor(new Date(year, 0, 1))
                      : theme.selectionColor,
                })}
              >
                <label>
                  <span
                    style={
                      !showMonths && year === currentYear
                        ? { borderColor: theme.todayColor }
                        : null
                    }
                  >
                    {year}
                  </span>
                </label>
                {showMonths && this.renderMonths(year)}
              </div>
            );
          }}
        />
      </div>
    );
  }
}
