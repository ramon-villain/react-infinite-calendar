import React, { PureComponent } from 'react';
import classNames from 'classnames';
import { getDateString } from '../utils';
import {
  format,
  getDay,
  isSameYear,
  isSameDay,
  isSameWeek,
  startOfWeek,
  endOfWeek,
  addWeeks,
  getMonth,
} from 'date-fns';
import styles from './Month.scss';
import dayStyles from '../Day/Day.scss';

export default class Month extends PureComponent {
  renderRows() {
    const {
      DayComponent,
      disabledDates,
      disabledDays,
      monthDate,
      locale,
      maxDate,
      minDate,
      rowHeight,
      rows,
      selected,
      today,
      theme,
      passThrough,
    } = this.props;
    const currentYear = today.getFullYear();
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const monthShort = format(monthDate, 'MMM', { locale: locale.locale });
    const monthRows = [];
    let day = 0;
    let isDisabled = false;
    let isToday = false;

    const { isWeeklySelection } = passThrough.Day || {};
    let { start, end } = selected;
    if (isWeeklySelection) {
      start = format(startOfWeek(start), 'YYYY-MM-DD');
      end = format(endOfWeek(end), 'YYYY-MM-DD');
    }
    const edgeRows = {};

    let date, days, dow, row;

    // Used for faster comparisons
    const _today = format(today, 'YYYY-MM-DD');
    let _minDate = format(minDate, 'YYYY-MM-DD');
    let _maxDate = format(maxDate, 'YYYY-MM-DD');

    // disable partial weeks for weekly selection
    if (isWeeklySelection) {
      const weekStartOfMin = startOfWeek(minDate);
      if (!isSameDay(minDate, weekStartOfMin)) {
        _minDate = format(addWeeks(weekStartOfMin, 1), 'YYYY-MM-DD');
      }

      const weekEndOfMax = endOfWeek(maxDate);
      if (!isSameDay(maxDate, weekEndOfMax)) {
        _maxDate = format(addWeeks(weekEndOfMax, -1), 'YYYY-MM-DD');
      }
    }

    // Oh the things we do in the name of performance...
    for (let i = 0, len = rows.length; i < len; i++) {
      row = rows[i];
      days = [];
      dow = getDay(new Date(year, month, row[0]));

      for (let k = 0, len = row.length; k < len; k++) {
        day = row[k];

        date = getDateString(year, month, day);
        isToday = date === _today;

        if (isWeeklySelection) {
          edgeRows[i] = isSameWeek(start, date) || isSameWeek(end, date);
        }

        isDisabled =
          (minDate && date < _minDate) ||
          (maxDate && date > _maxDate) ||
          (disabledDays &&
            disabledDays.length &&
            disabledDays.indexOf(dow) !== -1) ||
          (disabledDates &&
            disabledDates.length &&
            disabledDates.indexOf(date) !== -1);

        days[k] = (
          <DayComponent
            key={`day-${day}`}
            currentYear={currentYear}
            date={date}
            day={day}
            selected={selected}
            isDisabled={isDisabled}
            isToday={isToday}
            locale={locale}
            month={month}
            monthShort={monthShort}
            theme={theme}
            year={year}
            {...passThrough.Day}
          />
        );

        dow += 1;
      }
      monthRows[i] = (
        <ul
          key={`Row-${i}`}
          className={classNames(styles.row, {
            [styles.partial]: row.length !== 7,
            [dayStyles.edge]: edgeRows[i],
          })}
          style={{ height: rowHeight }}
          role="row"
          aria-label={`Week ${i + 1}`}
        >
          {days}
        </ul>
      );
    }

    return monthRows;
  }

  render() {
    const {
      locale: { locale },
      monthDate,
      today,
      rows,
      rowHeight,
      showOverlay,
      style,
      theme,
    } = this.props;
    const dateFormat = isSameYear(monthDate, today) ? 'MMMM' : 'MMMM YYYY';
    const month = getMonth(monthDate);

    return (
      <div
        className={classNames(styles.root, {
          [styles.even]: month % 2 === 0,
          [styles.odd]: month % 2 === 1,
        })}
        style={{ ...style, lineHeight: `${rowHeight}px` }}
      >
        <div className={styles.rows}>
          {this.renderRows()}
          {showOverlay && (
            <label
              className={classNames(styles.label, {
                [styles.partialFirstRow]: rows[0].length !== 7,
              })}
              style={{ backgroundColor: theme.overlayColor }}
            >
              <span>{format(monthDate, dateFormat, { locale })}</span>
            </label>
          )}
        </div>
      </div>
    );
  }
}
