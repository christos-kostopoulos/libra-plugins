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
import * as color from 'd3-color';
import {
  ChartProps,
  TimeseriesDataRecord,
  TimeFormatter,
  extractTimegrain,
  getNumberFormatter,
  getTimeFormatter,
  getTimeFormatterForGranularity,
  NumberFormats,
  LegacyQueryData,
  QueryFormData,
  smartDateFormatter,
  smartDateDetailedFormatter,
  supersetTheme,
} from '@superset-ui/core';
import { EChartsCoreOption, graphic } from 'echarts';

const TIME_COLUMN = '__timestamp';
const formatPercentChange = getNumberFormatter(
  NumberFormats.PERCENT_SIGNED_1_POINT,
);

// we trust both the x (time) and y (big number) to be numeric
export interface BigNumberDatum {
  [key: string]: number | null;
}

export type BigNumberFormData = QueryFormData & {
  colorPicker?: {
    r: number;
    g: number;
    b: number;
  };
  metric?:
    | {
        label: string;
      }
    | string;
  compareLag?: string | number;
  yAxisFormat?: string;
};

export type BigNumberChartProps = ChartProps & {
  formData: BigNumberFormData;
  queriesData: (LegacyQueryData & {
    data?: BigNumberDatum[];
  })[];
};
export default function transformProps(chartProps: BigNumberChartProps) {
  /**
   * This function is called after a successful response has been
   * received from the chart data endpoint, and is used to transform
   * the incoming data prior to being sent to the Visualization.
   *
   * The transformProps function is also quite useful to return
   * additional/modified props to your data viz component. The formData
   * can also be accessed from your Panel.tsx file, but
   * doing supplying custom props here is often handy for integrating third
   * party libraries that rely on specific props.
   *
   * A description of properties in `chartProps`:
   * - `height`, `width`: the height/width of the DOM element in which
   *   the chart is located
   * - `formData`: the chart data request payload that was sent to the
   *   backend.
   * - `queriesData`: the chart data response payload that was received
   *   from the backend. Some notable properties of `queriesData`:
   *   - `data`: an array with data, each row with an object mapping
   *     the column/alias to its value. Example:
   *     `[{ col1: 'abc', metric1: 10 }, { col1: 'xyz', metric1: 20 }]`
   *   - `rowcount`: the number of rows in `data`
   *   - `query`: the query that was issued.
   *
   * Please note: the transformProps function gets cached when the
   * application loads. When making changes to the `transformProps`
   * function during development with hot reloading, changes won't
   * be seen until restarting the development server.
   */

  const { width, height, formData, queriesData, rawFormData } = chartProps;
  const {
    boldText,
    headerText,
    colorPicker,
    compareLag: compareLag_,
    compareSuffix = '',
    timeFormat,
    headerFontSize,
    metric = 'value',
    showTimestamp,
    showTrendLine,
    subheader = '',
    subheaderFontSize,
    vizType,
  } = formData;
  // const data = queriesData[0].data as TimeseriesDataRecord[];
  const granularity = extractTimegrain(rawFormData as QueryFormData);
  let { yAxisFormat } = formData;
  const { headerFormatSelector, headerTimestampFormat } = formData;
  const {
    data = [],
    from_dttm: fromDatetime,
    to_dttm: toDatetime,
  } = queriesData[0];
  const metricName = typeof metric === 'string' ? metric : metric.label;
  const compareLag = Number(compareLag_) || 0;
  const supportTrendLine = vizType === 'panel';
  const supportAndShowTrendLine = supportTrendLine && showTrendLine;
  let formattedSubheader = subheader;

  let mainColor;
  if (colorPicker) {
    const { r, g, b } = colorPicker;
    mainColor = color.rgb(r, g, b).hex();
  }

  let trendLineData;
  let percentChange = 0;
  let bigNumber = data.length === 0 ? null : data[0][metricName];
  let timestamp = data.length === 0 ? null : data[0][TIME_COLUMN];
  let bigNumberFallback;

  if (data.length > 0) {
    const sortedData = (data as BigNumberDatum[])
      .map(d => ({ x: d[TIME_COLUMN], y: d[metricName] }))
      // sort in time descending order
      .sort((a, b) => (a.x !== null && b.x !== null ? b.x - a.x : 0));

    bigNumber = sortedData[0].y;
    timestamp = sortedData[0].x;

    if (bigNumber === null) {
      bigNumberFallback = sortedData.find(d => d.y !== null);
      bigNumber = bigNumberFallback ? bigNumberFallback.y : null;
      timestamp = bigNumberFallback ? bigNumberFallback.x : null;
    }

    if (compareLag > 0) {
      const compareIndex = compareLag;
      if (compareIndex < sortedData.length) {
        const compareValue = sortedData[compareIndex].y;
        // compare values must both be non-nulls
        if (bigNumber !== null && compareValue !== null && compareValue !== 0) {
          percentChange = (bigNumber - compareValue) / Math.abs(compareValue);
          formattedSubheader = `${formatPercentChange(
            percentChange,
          )} ${compareSuffix}`;
        }
      }
    }

    if (supportTrendLine) {
      // must reverse to ascending order otherwise it confuses tooltip triggers
      sortedData.reverse();
      trendLineData = supportAndShowTrendLine ? sortedData : undefined;
    }
  }

  let className = '';
  if (percentChange > 0) {
    className = 'positive';
  } else if (percentChange < 0) {
    className = 'negative';
  }

  if (!yAxisFormat && chartProps.datasource && chartProps.datasource.metrics) {
    chartProps.datasource.metrics.forEach(metricEntry => {
      if (metricEntry.metric_name === metric && metricEntry.d3format) {
        yAxisFormat = metricEntry.d3format;
      }
    });
  }

  const headerFormatter = headerFormatSelector
    ? getTimeFormatter(headerTimestampFormat)
    : getNumberFormatter(yAxisFormat);
  const formatTime =
    timeFormat === smartDateFormatter.id
      ? getTimeFormatterForGranularity(granularity)
      : getTimeFormatter(timeFormat);

  console.log('formData via TransformProps.ts', formData);

  const dateList = trendLineData?.map(function (item) {
    return item['x'];
  });
  const valueList = trendLineData?.map(function (item) {
    return item['y'];
  });

  const indicateAsc =
    formData.changeIndicator === 'above_zero'
      ? parseInt(formatPercentChange(percentChange), 10) > 0
      : parseInt(formatPercentChange(percentChange), 10) < 0;

  const trendlineColor = indicateAsc
    ? supersetTheme.colors.success.base
    : supersetTheme.colors.error.base;

  function getTooltipTimeFormatter(
    format?: string,
  ): TimeFormatter | StringConstructor {
    if (format === smartDateFormatter.id) {
      return smartDateDetailedFormatter;
    }
    if (format) {
      return getTimeFormatter(format);
    }
    return String;
  }
  const tooltipFormatter = getTooltipTimeFormatter('smart_date');
  const echartOptions: EChartsCoreOption = {
    color: trendlineColor,
    xAxis: {
      type: 'category',
      boundaryGap: false,
      show: false,
      data: dateList,
    },
    yAxis: {
      type: 'value',
      show: false,
    },
    tooltip: {
      trigger: 'axis',
      // formatter: (params: any) => {
      //   const xValue: number = params[0].name;
      //   const rows: Array<string> = [`${tooltipFormatter(xValue)}`];
      //   console.log('FORMATTER', params, xValue, rows);
      //   return rows.join('<br />');
      // },
    },
    grid: {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    },
    areaStyle: {
      opacity: 0.2,
      color: new graphic.LinearGradient(0, 0, 0, 1, [
        {
          offset: 0,
          color: trendlineColor,
        },
        {
          offset: 1,
          color: 'rgba(255, 255, 255, 0.1)',
        },
      ]),
    },
    series: [
      {
        data: valueList,
        type: 'line',
        areaStyle: {},
        showSymbol: false,
        // smooth: true,
      },
    ],
  };

  return {
    width,
    height,
    bigNumber,
    bigNumberFallback,
    className,
    headerFormatter,
    formatTime,
    headerFontSize,
    subheaderFontSize,
    mainColor,
    showTimestamp,
    showTrendLine: supportAndShowTrendLine,
    subheader: formattedSubheader,
    timestamp,
    toDatetime,
    boldText,
    headerText,
    percentChange: parseInt(formatPercentChange(percentChange), 10),
    indicateAsc,
    echartOptions,
  };
}
