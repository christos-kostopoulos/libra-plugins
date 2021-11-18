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
// eslint-disable-next-line import/no-extraneous-dependencies
import { EChartsCoreOption, ECharts, EChartsOption } from 'echarts';

import {
  QueryFormData,
  TimeseriesDataRecord,
  NumberFormatter,
  TimeFormatter,
} from '@superset-ui/core';

interface PanelCustomizeProps {
  headerText: string;
  className?: string;
  width: number;
  height: number;
  bigNumber?: number | null;
  bigNumberFallback?: TimeSeriesDatum;
  headerFormatter: NumberFormatter | TimeFormatter;
  formatTime: TimeFormatter;
  fromDatetime?: number;
  toDatetime?: number;
  kickerFontSize: number;
  subheader: string;
  subheaderFontSize: number;
  showTimestamp?: boolean;
  showTrendLine?: boolean;
  timestamp?: number;
  headerFontSize: number;
  indicateAsc: boolean;
  percentChange: number;
  echartOptions: EChartsCoreOption;
}

type TimeSeriesDatum = {
  x: number; // timestamp as a number
  y: number | null;
};
export type PanelQueryFormData = QueryFormData & PanelCustomizeProps;

export type PanelProps = PanelCustomizeProps & {
  data: TimeseriesDataRecord[];
  // add typing here for the props you pass in from transformProps.ts!
};

export interface EchartsHandler {
  getEchartInstance: () => ECharts | undefined;
}

export interface EchartsProps {
  height: number;
  width: number;
  echartOptions: EChartsCoreOption;
  eventHandlers?: EventHandlers;
  zrEventHandlers?: EventHandlers;
  selectedValues?: Record<number, string>;
  forceClear?: boolean;
}

export type EventHandlers = Record<string, { (props: any): void }>;

export type EchartsStylesProps = {
  height: number;
  width: number;
};
