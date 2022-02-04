import { Line } from "@ant-design/charts";
import { useQuery } from "@apollo/client"
import { Col, PageHeader, Row } from "antd";
import moment from "moment";
import { GetAllPublishedRecordSets } from "../../graphql/__generated__/GetAllPublishedRecordSets"
import { GET_ALL_PUBLISHED_RECORD_SETS } from "../../graphql/__queries__/GetAllPublishedRecordSets.gql"
import { flattenPublishedDocumentEntries, IPublishedRecordSetDocument } from "../DatasetDetails/PublishedRecordSet";

export const Reports = () => {
    const { data, loading } = useQuery<GetAllPublishedRecordSets>(GET_ALL_PUBLISHED_RECORD_SETS);

    const chartData = data?.publishedRecordSets
        .flat()
        .sort((a, b) => moment(a.begin).unix() - moment(b.begin).unix())
        .flatMap(prs =>
            flattenPublishedDocumentEntries((prs.document as IPublishedRecordSetDocument).segmentedRecord)
                .filter(x => x.category == "Gender")
                .map((r) => ({ ...r, date: `${moment(prs.end).format("dd MMM yy")}` }))
        )

    return <Row>
        <Col span={24}>
            <PageHeader title={"Reports"} />
            <Line
                loading={loading}
                data={chartData ?? []}
                xField='date'
                yField='percent'
                seriesField='attribute'
                xAxis={{
                    type: 'time',
                }}
            />
        </Col>
    </Row>

}