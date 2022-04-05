import { Moment } from "moment";
import { RangeValue } from "rc-picker/lib/interface.d";
import React from "react";

export interface IDatasetDetailsFilter {
  DateRange: RangeValue<Moment>;
  categories: string[];
  PublishedDateRange: PublishedDateRange
}

export enum PublishedDateRange {
  last3Periods = 3,
  last6Periods = 6
}

const DatasetDetailsFilterContext = React.createContext<
  IDatasetDetailsFilter | undefined | null
>(null);

export default DatasetDetailsFilterContext;
