import { Button, Col, Row } from "antd";
import { useTranslation } from "react-i18next";
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
    targets: IPublishedTarget[],
    datasetTags: IPublishedTag[],
    datasetGroupTags: IPublishedTag[],
}

interface IProps {
    document: IPublishedRecordSetDocument,
    summary?: boolean
}


const flattenPublishedDocumentEntries = (document: IPublishedRecordSetDocument) =>
    Object.values(document.record)
        .map(byPersonType => Object.values(byPersonType)
            .map(byCategory => Object.values(byCategory.entries)
                .map(byAttribute => {
                    const { count, ...rest } = byAttribute;
                    count;
                    return rest;
                })
            )
            .flat()
        )
        .flat()

export const PublishedRecordSet = ({ document, summary }: IProps) => {
    const { t } = useTranslation();

    return <>
        <Row justify="center"><Col span={24}><h2 style={{ textAlign: "center" }}>{document.reportingPeriodDescription}</h2></Col></Row>
        {
            Object.entries(document.record)
                .filter(([, categories]) => Object.values(categories).some(record => !Object.values(record.entries).every(e => !e.percent)))
                .map(([personType, categories]) =>
                    <Row key={personType} gutter={[16, 0]}>
                        <h2>{personType}</h2>
                        <Col span={24}>
                            {
                                Object.entries(categories)
                                    .filter(([, v]) => !Object.values(v.entries).every(e => !e.percent))
                                    .map(([category, v]) =>
                                        <Row justify="center" key={category} gutter={[16, 0]}>
                                            <Col span={24}>
                                                <h3>{category}</h3>
                                            </Col>
                                            {
                                                Object.entries(v.entries)
                                                    .filter(([, v]) => v.percent)
                                                    .map(([attribute, entry], i) => (
                                                        <Col span={summary ? 8 : 4} key={i} style={{ opacity: entry.targetMember ? "unset" : 0.5 }}>
                                                            <b style={{ textAlign: "center" }}>{attribute}</b>
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
                        onClick={() => alert(JSON.stringify(flattenPublishedDocumentEntries(document), null, 2))}
                    >{t("exportCSV")}</Button>
                </Col>
            </Row>
        }
    </>
}