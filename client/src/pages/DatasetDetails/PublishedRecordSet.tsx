import { Col, Row } from "antd";
import Pie5050 from "../Charts/Pie";

export interface IPublishedEntry {
    attribute: string,
    category: string,
    personType: string,
    targetMember: boolean,
    percent: number,
    count: number
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
    record: IPublishedEntry[],
    targets: IPublishedTarget[],
    datasetTags: IPublishedTag[],
    datasetGroupTags: IPublishedTag[],
}

interface IProps {
    document: IPublishedRecordSetDocument
}


export const PublishedRecordSet = ({ document }: IProps) => {

    return <>
        <h3>{document.reportingPeriodDescription}</h3>
        <Row justify="center">
            {
                document.record
                    .filter(x => x.percent && x.targetMember)
                    .map((entry, i) =>
                        <Col key={i}>
                            <h3>{entry.personType}</h3>
                            <Pie5050
                                legend={true}
                                categoryName={entry.category}
                                status={entry.percent}
                                target={document.targets.find(x => x.category === entry.category)?.target}
                                attibute={entry.attribute}
                            />
                        </Col>
                    )
            }
        </Row>
    </>
}