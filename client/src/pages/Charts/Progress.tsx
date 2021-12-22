import { useMemo } from "react";
import { Column, ColumnConfig } from "@ant-design/charts";
import { GetDataset_dataset, GetDataset_dataset_records, GetDataset_dataset_records_entries } from "../../graphql/__generated__/GetDataset";
import { getPalette } from "../DatasetDetails/DatasetDetails";
import { useTranslation } from "react-i18next";
import { Typography, Col } from "antd";
const { Text } = Typography;

interface IProps {
    dataset: GetDataset_dataset | undefined,
    records: GetDataset_dataset_records[] | undefined
}

interface customColumnConfig extends ColumnConfig {
    title: string;
}

interface IEntry {
    MonthYear: string;
    Attribute: string;
    AttributeCategory: string;
    AttributeCategoryCount: number | undefined;
    AttributeCount: number;
    PersonType: string | undefined;
    Percent: number | undefined;
    Target: number | undefined;
    TargetMember: boolean | undefined;
}

const progressConfig = (
    chartData: IEntry[],
    target: number,
    title: string
) => {
    const config: customColumnConfig = {
        title: title,
        data: chartData,
        color: ({ Attribute }) =>
            Attribute.indexOf("Other") > -1 ? getPalette(title)[1] : getPalette(title)[0],
        columnStyle: { stroke: "black" },
        padding: 30,
        height: 300,
        xField: "MonthYear",
        yField: "Percent",
        intervalPadding: 0,
        seriesField: "Attribute",
        isStack: true,
        isPercent: true,
        annotations: [
            {
                type: "line",
                top: true,
                start: ["-5%", 100 - target],
                end: ["105%", 100 - target],
                style: {
                    lineWidth: 3,
                    stroke: "black",
                },
                text: {
                    content: "",
                    position: "start",
                    offsetY: 10,
                    offsetX: -35,
                    style: { fontSize: 20, fontWeight: 300 },
                },
            },
        ],
        legend: false,
        tooltip: {
            formatter: function content(item) {
                const labelString = `${Math.round(item.Percent * 100)}% `;
                return { name: item.Attribute.indexOf("Other") > -1 ? "Other" : `${item.Attribute} target`, value: labelString };
            },
        },
        yAxis: {
            tickCount: 0,
            max: 100,
            label: null,
        },
        xAxis: {
            label: {
                autoHide: true,
                autoRotate: false,
            },
        },
    };
    return config;
};


export const ProgressColumns = ({ dataset, records }: IProps) => {

    const { t } = useTranslation();

    const newMonthYearRecord = (
        entry: GetDataset_dataset_records_entries,
        monthYear: string
    ) => {
        return {
            MonthYear: monthYear,
            Attribute: entry.categoryValue.name,
            AttributeCategory: entry.categoryValue.category.name,
            AttributeCategoryCount: undefined,
            AttributeCount: entry.count,
            PersonType: undefined, //entry.personType?.personTypeName,
            Target: dataset?.program.targets.find(x => x.category.id === entry.categoryValue.category.id)?.target,
            TargetMember: dataset?.program.targets
                .find(x => x.category.id === entry.categoryValue.category.id)?.
                tracks.find(x => x.categoryValue.id === entry.categoryValue.id)?.
                targetMember,
            Percent: undefined,
        };
    };

    const groupedByMonthYearRecords = useMemo(() => {
        return records?.reduce((groupedByMonthYearRecords, curr) => {
            const recordDate = new Date(curr.publicationDate);
            const monthName = new Intl.DateTimeFormat(window.navigator.language, {
                month: "short",
            }).format(recordDate);
            const monthYear = `${monthName} ${recordDate.getFullYear()}`;
            //reduced to ignore people types
            const reducedEntries = curr.entries.reduce((newEntries, entry) => {
                const oldEntry = newEntries[entry.categoryValue.name];
                if (!oldEntry) {
                    newEntries[entry.categoryValue.name] = newMonthYearRecord(entry, monthYear);
                }
                else {
                    newEntries[entry.categoryValue.name] =
                    {
                        ...oldEntry,
                        AttributeCount: oldEntry.AttributeCount + entry.count
                    };
                }
                return newEntries;
            }, {} as Record<string, IEntry>);


            if (!groupedByMonthYearRecords[monthYear]) {
                groupedByMonthYearRecords[monthYear] = Object.values(reducedEntries);
            }
            else {
                Object.values(reducedEntries).forEach((entry) => {
                    const entryIdx = groupedByMonthYearRecords[monthYear].findIndex(x => x.Attribute === entry.Attribute);
                    const oldEntry = groupedByMonthYearRecords[monthYear][entryIdx]
                    if (entryIdx === -1) {
                        groupedByMonthYearRecords[monthYear].push(entry);
                    }
                    else {
                        groupedByMonthYearRecords[monthYear][entryIdx] =
                        {
                            ...oldEntry,
                            AttributeCount: oldEntry.AttributeCount + entry.AttributeCount
                        };
                    }

                });
            }
            return groupedByMonthYearRecords;
        }, {} as Record<string, IEntry[]>);

    }, [records]);

    const progressCharts: customColumnConfig[] | undefined = useMemo(() => {
        //return Array.from(new Set(queryData?.dataset.program.targets.map(x => x.categoryValue.category.name)))
        //yes this is a bit hard to read!
        if (
            !groupedByMonthYearRecords ||
            Object.keys(groupedByMonthYearRecords).length < 2
        ) { return undefined; }
        return Array.from(dataset?.program.targets ?? [])
            .sort((a, b) => b.target - a.target)
            .reduce(
                (configs, target) => {
                    const chartData = Object.values(groupedByMonthYearRecords).reduce(
                        (chartData, record) => {
                            const totalAttributeCategoryCount = record
                                .filter(x => x.AttributeCategory === target.category.name)
                                .reduce((count, currEntry) => {
                                    count += currEntry.AttributeCount;
                                    return count;
                                }, 0);
                            if (totalAttributeCategoryCount === 0) {
                                return chartData;
                            }
                            const reducedRecord = record
                                .filter(x => x.AttributeCategory === target.category.name)
                                .reduce((reducedRecord, currEntry) => {
                                    let categoryKey = target.category.name;
                                    if (!currEntry.TargetMember) {
                                        categoryKey = `Other ${target.category.name}`;
                                    }

                                    if (reducedRecord[categoryKey]) {
                                        reducedRecord[categoryKey].AttributeCount += currEntry.AttributeCount;
                                        reducedRecord[categoryKey].Percent = (reducedRecord[categoryKey].AttributeCount / totalAttributeCategoryCount) * 100
                                    } else {
                                        reducedRecord[categoryKey] = {
                                            ...currEntry,
                                            Attribute: categoryKey,
                                            AttributeCategoryCount: totalAttributeCategoryCount,
                                            Percent: (currEntry.AttributeCount / totalAttributeCategoryCount) * 100
                                        };
                                    }
                                    return reducedRecord;
                                }, {} as Record<string, IEntry>);
                            if (Object.values(reducedRecord).length === 1) return chartData;
                            Object.values(reducedRecord).forEach(x => chartData.push(x));
                            return chartData;
                        }, new Array<IEntry>());
                    if (chartData.length > 1) {
                        configs.push(
                            progressConfig(
                                [
                                    ...chartData.slice(-6).map((x) => ({
                                        ...x,
                                        PersonType: x.PersonType
                                            ? x.PersonType
                                            : t("unknownPersonType"),
                                    })),
                                ],
                                Math.round(target.target * 100),
                                target.category.name
                            )
                        );
                    }
                    else {
                        configs.push({} as customColumnConfig)
                    }

                    return configs;
                },
                ([] as customColumnConfig[]) ?? new Array<customColumnConfig>()
            )
    }, [groupedByMonthYearRecords, dataset?.program.targets]);

    return <>
        {
            progressCharts && progressCharts.length ? progressCharts.map(
                (config, i) =>
                    <Col span={4} offset={i ? 4 : 0} key={i}>
                        {
                            config && Object.keys(config).length ? <Column {...config} /> : null
                        }
                    </Col>

            ) : <div
                style={{
                    marginTop: "auto",
                    marginBottom: "auto",
                    textAlign: "center",
                }}
            >
                <Text strong>
                    {t("noDataAvailable")}
                </Text>
            </div>
        }
    </>
}