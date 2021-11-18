/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React, { useEffect, createRef, useRef } from 'react';
import {
  styled,
  t,
  getNumberFormatter,
  computeMaxFontSize,
  NumberFormatter,
  smartDateVerboseFormatter,
} from '@superset-ui/core';

import Echart from './components/Echart';
import { PanelProps } from './types';
// The following Styles component is a <div> element, which has been styled using Emotion
// For docs, visit https://emotion.sh/docs/styled

// Theming variables are provided for your use via a ThemeProvider
// imported from @superset-ui/core. For variables available, please visit
// https://github.com/apache-superset/superset-ui/blob/master/packages/superset-ui-core/src/style/index.ts

const PROPORTION = {
  // text size: proportion of the chart container sans trendline
  KICKER: 0.1,
  HEADER: 0.3,
  SUBHEADER: 0.125,
  // trendline size: proportion of the whole chart container
  TRENDLINE: 0.3,
};

const CHART_MARGIN = {
  top: 4,
  right: 4,
  bottom: 4,
  left: 4,
};
const defaultNumberFormatter = getNumberFormatter();
type TimeSeriesDatum = {
  x: number; // timestamp as a number
  y: number | null;
};

const Styles = styled.div<any>`
  font-family: ${({ theme, indicateAsc }) =>
    theme.typography.families.sansSerif};
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;

  &.no-trendline .subheader-line {
    padding-bottom: 0.3em;
  }

  .text-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    .error {
      font-size: ${({ theme }) => theme.typography.sizes.s};
      margin: -0.5em 0 0.4em;
      line-height: 1;
      padding: 2px 4px 3px;
      border-radius: 3px;
    }
  }

  .kicker {
    font-weight: ${({ theme }) => theme.typography.weights.bold};
    line-height: 1em;
    padding-bottom: 2em;
  }

  .header-line {
    font-weight: ${({ theme }) => theme.typography.weights.bold};
    position: relative;
    line-height: 1em;
    color: ${({ theme, indicateAsc }) =>
      indicateAsc ? theme.colors.success.base : theme.colors.error.base};
    span {
      position: absolute;
      bottom: 0;
    }
  }

  .subheader-line {
    font-weight: ${({ theme }) => theme.typography.weights.bold};
    color: ${({ theme, indicateAsc }) =>
      indicateAsc ? theme.colors.success.base : theme.colors.error.base};
    line-height: 1em;
    padding-bottom: 0;
  }

  &.is-fallback-value {
    .kicker,
    .header-line,
    .subheader-line {
      opacity: 0.5;
    }
  }

  .superset-data-ui-tooltip {
    z-index: 1000;
    background: #000;
  }
  .subheader-container {
    display: flex;
    align-items: center;
    width: 30%;
    justify-content: space-between;
  }
  .arrow-up {
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: ${({ theme, indicateAsc }) =>
      `25px solid ${
        indicateAsc ? theme.colors.success.base : theme.colors.error.base
      }`};
  }

  .arrow-down {
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: ${({ theme, indicateAsc }) =>
      `25px solid ${
        indicateAsc ? theme.colors.success.base : theme.colors.error.base
      }`};
  }
`;

/**
 * ******************* WHAT YOU CAN BUILD HERE *******************
 *  In essence, a chart is given a few key ingredients to work with:
 *  * Data: provided via `props.data`
 *  * A DOM element
 *  * FormData (your controls!) provided as props by transformProps.ts
 */

export function renderTooltipFactory(
  formatDate = smartDateVerboseFormatter,
  formatValue = defaultNumberFormatter,
) {
  return function renderTooltip({
    datum: { x, y },
  }: {
    datum: TimeSeriesDatum;
  }) {
    // even though `formatDate` supports timestamp as numbers, we need
    // `new Date` to pass type check
    return (
      <div style={{ padding: '4px 8px' }}>
        {formatDate(new Date(x))}
        <br />
        <strong>{y === null ? t('N/A') : formatValue(y)}</strong>
      </div>
    );
  };
}

export default function Panel(props: PanelProps) {
  // height and width are the height and width of the DOM element as it exists in the dashboard.
  // There is also a `data` prop, which is, of course, your DATA 🎉

  const rootElem = createRef<HTMLDivElement>();

  // Often, you just want to get a hold of the DOM and go nuts.
  // Here, you can do that with createRef, and the useEffect hook.
  useEffect(() => {
    const root = rootElem.current as HTMLElement;
    console.log('Plugin element', root);
  });

  console.log('Plugin props', props);

  const getClassName = () => {
    const { className, showTrendLine, bigNumberFallback } = props;
    const names = `superset-legacy-chart-big-number ${className} ${
      bigNumberFallback ? 'is-fallback-value' : ''
    }`;
    if (showTrendLine) return names;
    return `${names} no-trendline`;
  };

  const createTemporaryContainer = () => {
    const container = document.createElement('div');
    container.className = getClassName();
    container.style.position = 'absolute'; // so it won't disrupt page layout
    container.style.opacity = '0'; // and not visible
    return container;
  };

  const renderFallbackWarning = () => {
    const { bigNumberFallback, formatTime, showTimestamp } = props;
    if (!bigNumberFallback || showTimestamp) return null;
    return (
      <span
        className="alert alert-warning"
        role="alert"
        title={t(
          `Last available value seen on %s`,
          formatTime(bigNumberFallback.x),
        )}
      >
        {t('Not up to date')}
      </span>
    );
  };

  const renderKicker = (maxHeight: number) => {
    const { timestamp, showTimestamp, formatTime, width } = props;
    if (!showTimestamp) return null;

    const text = timestamp === null ? '' : formatTime(timestamp);

    const container = createTemporaryContainer();
    document.body.append(container);
    const fontSize = computeMaxFontSize({
      text,
      maxWidth: width,
      maxHeight,
      className: 'kicker',
      container,
    });
    container.remove();

    return (
      <div
        className="kicker"
        style={{
          fontSize,
          height: maxHeight,
        }}
      >
        {text}
      </div>
    );
  };

  const renderHeader = (maxHeight: any) => {
    const { bigNumber, headerFormatter, width } = props;

    const text = bigNumber === null ? t('No data') : headerFormatter(bigNumber);

    const container = createTemporaryContainer();
    document.body.append(container);
    const fontSize = computeMaxFontSize({
      text,
      maxWidth: width,
      maxHeight,
      className: 'header-line',
      container,
    });
    container.remove();

    return (
      <div
        className="header-line"
        style={{
          fontSize,
          height: maxHeight,
        }}
      >
        {text}
      </div>
    );
  };

  const renderSubheader = (maxHeight: number) => {
    const { bigNumber, subheader, width, bigNumberFallback } = props;
    let fontSize = 0;

    const NO_DATA_OR_HASNT_LANDED = t(
      'No data after filtering or data is NULL for the latest time record',
    );
    const NO_DATA = t(
      'Try applying different filters or ensuring your datasource has data',
    );
    let text = subheader;
    if (bigNumber === null) {
      text = bigNumberFallback ? NO_DATA : NO_DATA_OR_HASNT_LANDED;
    }

    if (text) {
      const container = createTemporaryContainer();
      document.body.append(container);
      fontSize = computeMaxFontSize({
        text,
        maxWidth: width,
        maxHeight,
        className: 'subheader-line',
        container,
      });
      container.remove();

      return (
        <div
          className="subheader-line"
          style={{
            fontSize,
            height: maxHeight,
          }}
        >
          {text}
        </div>
      );
    }
    return null;
  };

  const renderTrendline = (maxHeight: number) => {
    const { width, subheader, headerFormatter, formatTime, echartOptions } =
      props;

    return (
      <>
        {renderTooltipFactory(formatTime, headerFormatter as NumberFormatter)}
        <Echart
          width={Math.floor(width)}
          height={maxHeight}
          echartOptions={echartOptions}
        />
      </>
    );
  };

  const {
    showTrendLine,
    height,
    kickerFontSize,
    headerFontSize,
    subheaderFontSize,
    indicateAsc,
    percentChange,
  } = props;

  const className = getClassName();

  if (showTrendLine) {
    const chartHeight = Math.floor(PROPORTION.TRENDLINE * height);
    const allTextHeight = height - chartHeight;

    return (
      <Styles indicateAsc={indicateAsc}>
        <div className={className}>
          <div className="text-container" style={{ height: allTextHeight }}>
            {renderFallbackWarning()}
            {renderKicker(
              Math.ceil(kickerFontSize * (1 - PROPORTION.TRENDLINE) * height),
            )}
            {renderHeader(
              Math.ceil(headerFontSize * (1 - PROPORTION.TRENDLINE) * height),
            )}
            <div className="subheader-container">
              {renderSubheader(
                Math.ceil(
                  subheaderFontSize * (1 - PROPORTION.TRENDLINE) * height,
                ),
              )}
              <div className={percentChange > 0 ? 'arrow-up' : 'arrow-down'} />
            </div>
          </div>
          {renderTrendline(chartHeight)}
        </div>
      </Styles>
    );
  }
  return (
    <Styles indicateAsc={indicateAsc}>
      <div className={className} style={{ height }}>
        {renderFallbackWarning()}
        {renderKicker(kickerFontSize * height)}
        {renderHeader(Math.ceil(headerFontSize * height))}
        <div className="subheader-container">
          {renderSubheader(Math.ceil(subheaderFontSize * height))}{' '}
          <div className={indicateAsc ? 'arrow-up' : 'arrow-down'} />
        </div>
      </div>
    </Styles>
  );
}
