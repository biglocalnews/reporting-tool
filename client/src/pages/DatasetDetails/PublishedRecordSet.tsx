import { Button, Col, Row, Switch } from "antd";
import Title from "antd/lib/typography/Title";
import moment from "moment";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GetDataset_dataset, GetDataset_dataset_program_reportingPeriods } from "../../graphql/__generated__/GetDataset";
import { catSort } from "../CatSort";
import Pie5050 from "../Charts/Pie";

export interface IPublishedEntry {
    attribute: string,
    category: string,
    personType: string,
    targetMember: boolean,
    percent: number,
    count?: number
}

interface IPublishedTag {
    name: string,
    group: string
}

interface IPublishedTarget {
    category: string,
    target: number
}

export interface IPublishedRecordSetDocument {
    datasetGroup: string
    reportingPeriodDescription: string,
    begin: Date,
    end: Date,
    record: Record<string, Record<string, { total?: number, entries: Record<string, IPublishedEntry> }>>,
    segmentedRecord: Record<string, Record<string, { total?: number, entries: Record<string, IPublishedEntry> }>>,
    targets: IPublishedTarget[],
    datasetTags: IPublishedTag[],
    datasetGroupTags: IPublishedTag[],
    teamName: string
}

interface IProps {
    dataset?: GetDataset_dataset,
    reportingPeriod?: GetDataset_dataset_program_reportingPeriods
    publishedDocument?: IPublishedRecordSetDocument,
    summary?: boolean
}

/*
const arrayToCsv = (data:[[]]) => {
  return data.map(row =>
    row
    .map(String)  // convert every value to String
    .map(v => v.replaceAll('"', '""'))  // escape double colons
    .map(v => `"${v}"`)  // quote it
    .join(',')  // comma-separated
  ).join('\r\n');  // rows starting on new lines
}

const downloadBlob = (content:string, filename:string, contentType:string) => {
    // Create a blob
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
  
    // Create a link to download it
    const pom = document.createElement('a');
    pom.href = url;
    pom.setAttribute('download', filename);
    pom.click();
  }
*/

export const stripCountsFromEntries = (record: Record<string, Record<string, { total?: number, entries: Record<string, IPublishedEntry> }>>) => {
    for (const personType in record) {
        for (const category in record[personType]) {
            delete record[personType][category]["total"];
            for (const entry in record[personType][category]["entries"]) {
                delete record[personType][category]["entries"][entry]["count"];
            }
        }
    }
    return record;
}

export const flattenPublishedDocumentEntries = (
    record: Record<string, Record<string, { total?: number, entries: Record<string, IPublishedEntry> }>>
) => Object.values(record)
    .flatMap(x => Object.values(x))
    .flatMap(x => Object.values(x.entries));

const reduceRecordsToOverallPercentages = (
    dataset: GetDataset_dataset,
    reportingPeriod: GetDataset_dataset_program_reportingPeriods,
    ignorePersonType: boolean
) => {
    const a = dataset.records.filter(x =>
        reportingPeriod.range &&
        moment(x.publicationDate)
            .isBetween(moment(reportingPeriod.range[0]), moment(reportingPeriod.range[1]))
    )
        .sort((a, b) => moment(b.publicationDate).unix() - moment(a.publicationDate).unix())
        .reduce((groupedByPersonTypeCategoryAttribute, record, recordIndex, allRecords) => {
            record.entries
                .flat() //just makes it sortable
                .sort((a, b) => a.categoryValue.name.localeCompare(b.categoryValue.name))
                .forEach(currEntry => {
                    const personType = ignorePersonType ? "Everyone" : (currEntry.personType?.personTypeName ?? "Everyone");
                    const category = currEntry.categoryValue.category.name;
                    const attribute = currEntry.categoryValue.name;

                    if (!groupedByPersonTypeCategoryAttribute[personType]) {
                        groupedByPersonTypeCategoryAttribute[personType] = {} as Record<string, { total: number, entries: Record<string, IPublishedEntry> }>;
                    }

                    if (!groupedByPersonTypeCategoryAttribute[personType][category]) {
                        groupedByPersonTypeCategoryAttribute[personType][category] = {} as { total: number, entries: Record<string, IPublishedEntry> };
                        groupedByPersonTypeCategoryAttribute[personType][category]
                            .total = allRecords
                                .flatMap(x => x.entries)
                                .filter(x => (ignorePersonType || (x.personType?.personTypeName ?? "Everyone") === personType) && x.categoryValue.category.name === category)
                                .reduce((total, curr) => { return total + curr.count }, 0);
                        groupedByPersonTypeCategoryAttribute[personType][category].entries = {} as Record<string, IPublishedEntry>;
                    }

                    if (!groupedByPersonTypeCategoryAttribute[personType][category].entries[attribute]) {
                        groupedByPersonTypeCategoryAttribute[personType][category].entries[attribute] = {} as IPublishedEntry;
                        const total = groupedByPersonTypeCategoryAttribute[personType][category].total ?? 0;
                        groupedByPersonTypeCategoryAttribute[personType][category].entries[attribute] = {
                            attribute: attribute,
                            category: currEntry.categoryValue.category.name,
                            count: currEntry.count,
                            personType: personType,
                            targetMember: dataset.program.targets
                                .flatMap(x => x.tracks)
                                .some(track => track.categoryValue.id === currEntry.categoryValue.id && track.targetMember),
                            percent: (
                                currEntry.count /
                                total
                            ) * 100
                        }
                    }
                    else {
                        const newCount = (groupedByPersonTypeCategoryAttribute[personType][category].entries[attribute].count ?? 0) + currEntry.count;
                        const total = groupedByPersonTypeCategoryAttribute[personType][category].total ?? 0;
                        groupedByPersonTypeCategoryAttribute[personType][category].entries[attribute].count = newCount;
                        groupedByPersonTypeCategoryAttribute[personType][category].entries[attribute].percent =
                            (
                                newCount /
                                total
                            ) * 100;

                    }
                });

            return groupedByPersonTypeCategoryAttribute;
        }, {} as Record<string, Record<string, { total?: number, entries: Record<string, IPublishedEntry> }>>);

    return a;
}

export const getRecordSetDocument = (dataset: GetDataset_dataset, reportingPeriod: GetDataset_dataset_program_reportingPeriods) =>
    ({
        datasetGroup: dataset.program.name,
        datasetName: dataset.name,
        teamName: dataset.program.team?.name,
        reportingPeriodDescription: reportingPeriod.description ?? "",
        begin: reportingPeriod.range[0],
        end: reportingPeriod.range[1],
        datasetTags: dataset.tags
            .map(x => ({ name: x.name, group: x.tagType })),
        datasetGroupTags: dataset.program.tags
            .map(x => ({ name: x.name, group: x.tagType })),
        targets: dataset.program.targets
            .map(x => ({ category: x.category.name, target: x.target * 100 }))
            .sort((a, b) => catSort(a.category, b.category)),
        record: stripCountsFromEntries(reduceRecordsToOverallPercentages(dataset, reportingPeriod, true)),
        segmentedRecord: stripCountsFromEntries(reduceRecordsToOverallPercentages(dataset, reportingPeriod, false))
    }) as IPublishedRecordSetDocument;

export const PublishedRecordSet = ({ publishedDocument, dataset, reportingPeriod, summary }: IProps) => {
    const { t } = useTranslation();
    const [showByPersonType, setShowByPersonType] = useState(false);

    const document = publishedDocument ? publishedDocument : dataset && reportingPeriod ? getRecordSetDocument(dataset, reportingPeriod) : undefined;

    if (!document) {
        return null;
    }

    return <>
        <Row justify="center">
            <Col span={24}>
                <Title level={2} style={{ textAlign: "center" }}>{document.reportingPeriodDescription}
                    <Switch
                        style={{ float: "right" }}
                        checkedChildren={t("personType")}
                        unCheckedChildren={t("everyone")}
                        onChange={(checked) => setShowByPersonType(checked)}
                    />
                </Title>

            </Col>
        </Row>
        {
            Object.entries(showByPersonType ? document.segmentedRecord : document.record)
                .filter(([, categories]) => Object.values(categories).some(record => !Object.values(record.entries).every(e => !e.percent)))
                .map(([personType, categories]) =>
                    <Row key={personType} gutter={[16, 0]}>
                        <Title level={3}>{personType}</Title>
                        <Col span={24}>
                            {
                                Object.entries(categories)
                                    .filter(([, v]) => !Object.values(v.entries).every(e => !e.percent))
                                    .map(([category, v]) =>
                                        <Row justify="center" key={category} gutter={[16, 0]}>
                                            <Col span={24}>
                                                <Title level={4}>{category}</Title>
                                            </Col>
                                            {
                                                Object.entries(v.entries)
                                                    .filter(([, v]) => v.percent)
                                                    .map(([attribute, entry], i) => (
                                                        <Col sm={summary ? 16 : 8} lg={summary ? 8 : 4} key={i} style={{ opacity: entry.targetMember ? "unset" : 0.5 }}>
                                                            <div style={{ textAlign: "center" }}>
                                                                <b>{attribute}</b>
                                                            </div>
                                                            <Pie5050
                                                                legend={false}
                                                                categoryName={entry.category}
                                                                status={entry.percent}
                                                                target={document.targets.find(x => x.category === entry.category)?.target}
                                                                attibute={entry.attribute}
                                                            />
                                                        </Col>
                                                    ))
                                            }
                                        </Row>
                                    )
                            }
                        </Col>
                    </Row>
                )
        }
        {
            !summary && <Row>
                <Col span={2}>
                    <Button
                        type="primary"
                        onClick={() => alert(JSON.stringify(flattenPublishedDocumentEntries(document.record), null, 2))}
                    >{t("exportCSV")}</Button>
                </Col>
            </Row>
        }
    </>
}