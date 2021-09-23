import { Moment } from "moment";
import { RangeValue } from "rc-picker/lib/interface.d";
import React from "react";

export interface IDatasetDetailsFilter {
  DateRange: RangeValue<Moment>;
}

const DatasetDetailsFilterContext = React.createContext<
  IDatasetDetailsFilter | undefined | null
>(null);

export default DatasetDetailsFilterContext;
