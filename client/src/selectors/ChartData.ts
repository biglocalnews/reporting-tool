import { GetAllPublishedRecordSets_publishedRecordSets } from "../graphql/__generated__/GetAllPublishedRecordSets";
import { flattenPublishedDocumentEntries, IPublishedRecordSetDocument } from "../pages/DatasetDetails/PublishedRecordSet";

export interface IChartData {
    category: string,
    attribute: string,
    date: Date,
    groupedDate: string,
    percent: number,
    personType: string,
    targetMember: boolean,
    count: number,
    summedPercent: number
}


export const grouped = (chartData: IChartData[] | undefined) => {
    return (chartData?.reduce((group, entry) => {
        const month = entry.date.getMonth();
        const monthName = new Intl.DateTimeFormat(window.navigator.language, {
            month: "long",
        }).format(entry.date);
        const year = entry.date.getFullYear();
        const monthYear = `${monthName} ${year}`;
        const key = `${monthYear} ${entry.attribute}`
        if (!group[key]) {
            group[key] = {} as IChartData;
            group[key] = {
                ...entry,
                groupedDate: `${year}-${month + 1}-1`,
                count: 1,
                summedPercent: entry.percent
            };
            return group;
        }

        group[key].count += 1;
        group[key].summedPercent += entry.percent;
        group[key].percent = (group[key].summedPercent) / group[key].count;
        return group;
    }, {} as Record<string, IChartData>) ?? {} as Record<string, IChartData>)
}

export const groupedByYearCategory = (filteredData: (GetAllPublishedRecordSets_publishedRecordSets[] | undefined)[]) => {
    if (!filteredData) return [{}] as Record<string, Record<string, { percent: number, count: number, sum: number }>>[];
    return filteredData.map(x => x?.reduce((groupedRecords, x) => {
        const groupedEntries = flattenPublishedDocumentEntries((x.document as IPublishedRecordSetDocument).record)
            .map((r) => ({ ...r, date: new Date(x.end) }))
            .reduce((groupedEntries, entry) => {
                const year = entry.date.getFullYear();
                if (!(year in groupedEntries)) {
                    groupedEntries[year] = {} as Record<string, number>;
                }
                if (!(entry.category in groupedEntries[year]) && entry.targetMember) {
                    groupedEntries[year][entry.category] = entry.percent;
                    return groupedEntries;
                }
                if (entry.targetMember) {
                    groupedEntries[year][entry.category] += entry.percent;
                }
                return groupedEntries
            }, {} as Record<string, Record<string, number>>);

        Object.entries(groupedEntries)
            .forEach(([year, categories]) => {
                if (!(year in groupedRecords)) {
                    groupedRecords[year] = {} as Record<string, { percent: number, count: number, sum: number }>
                }
                Object.entries(categories)
                    .forEach(([category, percent]) => {
                        if (!(category in groupedRecords[year])) {
                            groupedRecords[year][category] = {} as { percent: number, count: number, sum: number };
                            groupedRecords[year][category].sum = percent;
                            groupedRecords[year][category].count = 1;
                            groupedRecords[year][category].percent = percent;
                        }
                        else {
                            groupedRecords[year][category].sum += percent;
                            groupedRecords[year][category].count += 1;
                            groupedRecords[year][category].percent = groupedRecords[year][category].sum / groupedRecords[year][category].count
                        }

                    });
            });

        return groupedRecords;

    }, {} as Record<string, Record<string, { percent: number, count: number, sum: number }>>));

}

export const groupedByMonthYearCategory =
    (filteredData: GetAllPublishedRecordSets_publishedRecordSets[] | undefined, categories: readonly string[]) => {

        if (!filteredData) return {} as Record<string, Record<string, IChartData>>;

        return filteredData.reduce((groupedRecords, x) => {
            const groupedEntries = flattenPublishedDocumentEntries((x.document as IPublishedRecordSetDocument).record)
                .map((r) => ({ ...r, date: new Date(x.end) }))
                .reduce((groupedEntries, entry) => {

                    if (categories.length && !categories.includes(entry.category)) return groupedEntries;

                    const year = entry.date.getFullYear();
                    const month = entry.date.getMonth();
                    const monthName = new Intl.DateTimeFormat(window.navigator.language, {
                        month: "long",
                    }).format(entry.date);
                    const monthYear = `${monthName} ${year}`;
                    if (!(monthYear in groupedEntries)) {
                        groupedEntries[monthYear] = {} as Record<string, IChartData>;
                    }
                    if (!(entry.category in groupedEntries[monthYear]) && entry.targetMember) {
                        groupedEntries[monthYear][entry.category] = {
                            ...entry,
                            percent: entry.percent,
                            summedPercent: 0,
                            count: 0,
                            groupedDate: `${year}-${month + 1}-1`,
                            date: new Date(x.end)
                        } as IChartData
                        return groupedEntries;
                    }
                    if (entry.targetMember) {
                        groupedEntries[monthYear][entry.category].percent += entry.percent;
                    }
                    return groupedEntries
                }, {} as Record<string, Record<string, IChartData>>);
            Object.entries(groupedEntries)
                .forEach(([monthYear, categories]) => {
                    if (!(monthYear in groupedRecords)) {
                        groupedRecords[monthYear] = {} as Record<string, IChartData>
                    }
                    Object.entries(categories)
                        .forEach(([category, groupedEntry]) => {
                            if (!(category in groupedRecords[monthYear])) {
                                groupedRecords[monthYear][category] = { ...groupedEntry } as IChartData;
                                groupedRecords[monthYear][category].summedPercent = groupedEntry.percent;
                                groupedRecords[monthYear][category].count = 1;
                                groupedRecords[monthYear][category].percent = groupedEntry.percent;
                            }
                            else {
                                groupedRecords[monthYear][category].summedPercent += groupedEntry.percent;
                                groupedRecords[monthYear][category].count += 1;
                                groupedRecords[monthYear][category].percent = groupedRecords[monthYear][category].summedPercent / groupedRecords[monthYear][category].count
                            }

                        });
                });

            return groupedRecords;

        }, {} as Record<string, Record<string, IChartData>>);

    }


export const flattenChartData = (records: Record<string, Record<string, IChartData>>): IChartData[] =>
    Object.values(records)
        .flatMap(byMonthYear => Object.values(byMonthYear))
        .sort((a, b) => a.date.valueOf() - b.date.valueOf())

export const flattened = (grouped: Record<string, IChartData>) => {
    return Object.values(grouped).sort((a, b) => a.date.getTime() - b.date.getTime())
}