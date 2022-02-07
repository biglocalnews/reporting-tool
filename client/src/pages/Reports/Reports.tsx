import { Line, LineConfig } from "@ant-design/charts";
import { useQuery } from "@apollo/client"
import { Col, PageHeader, Row } from "antd";
import { GetAllPublishedRecordSets } from "../../graphql/__generated__/GetAllPublishedRecordSets"
import { GET_ALL_PUBLISHED_RECORD_SETS } from "../../graphql/__queries__/GetAllPublishedRecordSets.gql"
import { flattenPublishedDocumentEntries, IPublishedRecordSetDocument } from "../DatasetDetails/PublishedRecordSet";

interface IChartData {
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

const chartConfig = (chartData: IChartData[] | undefined, loading: boolean): LineConfig => ({
    loading: loading,
    data: chartData ?? [],
    xField: 'groupedDate',
    yField: 'percent',
    seriesField: 'attribute',
    xAxis: {
        type: 'time',
    },
    smooth: true,
    color: ({ attribute }) => {
        const { targetMember, category } = chartData?.find(x => x.attribute === attribute) ?? {} as IChartData;
        const allAttributes = new Set(chartData?.filter(x => x.targetMember === targetMember).map(x => x.attribute))
        const colorChangeFactor = 255 / allAttributes.size;
        let color = 0;
        for (const x of Array.from(allAttributes)) {
            if (x === attribute) break;
            const newColor = Math.round(color += colorChangeFactor);
            color = newColor > 255 ? 255 : newColor;
        }
        switch (category) {
            case "Gender":
                return targetMember ? `rgba(255,51,${color},1)` : `rgba(46,117,${color},0.25)`;
            default:
                return targetMember ? "rgba(255,51,0,1)" : "rgba(46,117,182,0.5)";
        }


    }
})

export const Reports = () => {
    const { data, loading } = useQuery<GetAllPublishedRecordSets>(GET_ALL_PUBLISHED_RECORD_SETS);

    const chartData = data?.publishedRecordSets
        .flatMap(prs =>
            flattenPublishedDocumentEntries((prs.document as IPublishedRecordSetDocument).record)
                .filter(x => x.category == "Gender")
                .map((r) => ({ ...r, date: new Date(prs.end) }))
        )

    const grouped = (): IChartData[] | undefined => Object.values(
        chartData?.reduce((group, entry) => {
            const month = entry.date.getMonth();
            const monthName = new Intl.DateTimeFormat(window.navigator.language, {
                month: "long",
            }).format(entry.date);
            const year = entry.date.getFullYear();
            const monthYear = `${monthName} ${year}`;
            const key = `${monthYear} ${entry.attribute}`
            if (!(key in group)) {
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
        }, {} as Record<string, IChartData>) ?? {} as Record<string, IChartData>
    ).sort((a, b) => a.date.getTime() - b.date.getTime())

    return <Row>
        <Col span={24}>
            <PageHeader title={"Reports"} />
            <Line
                {...chartConfig(grouped(), loading)}
            />

        </Col>
    </Row>

}