import { Column, ColumnConfig, Line, LineConfig } from "@ant-design/charts";
import { Datum } from "@antv/g2plot";
import { Col, Row, Select } from "antd"
import { useState } from "react";
import { IChartData } from "../../selectors/ChartData";

interface IProps {
    data: IChartData[],
    loading: boolean,
    options?: object,
    columnOptions?: object,
    lineOptions?: object
}

const chartConfig = ({
    xField: 'groupedDate',
    yField: 'percent',
    seriesField: 'attribute',
    width: 400,
    height: 300,
    legend: {
        position: "right"
    },
    //isPercent: true,
    tooltip: {
        formatter: (datum: Datum) => ({ name: datum.attribute ? datum.attribute : datum.category, value: `${Number(datum.percent).toFixed(2)}%` })
    },
    xAxis: {
        type: "cat",
        label: {
            formatter: (text: string) => new Date(text).toLocaleString(navigator.language, { month: "short", year: "numeric" } as Intl.DateTimeFormatOptions)
        }
    },
    yAxis: {
        label: {
            formatter: (text: string) => `${text}%`
        }
    },
    /*color: ({ attribute }) => {
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
    }*/
});

export const LineColumn = ({ data: chartData, loading, options, columnOptions, lineOptions }: IProps) => {

    const [chartMode, setChartMode] = useState("column");

    return <Row
        gutter={[16, 16]}
        justify="center"
    >
        <Col span={24}>
            <Row>
                <Col offset={20} span={4}>
                    <Select
                        style={{ width: "130px", float: "right" }}
                        onChange={(e) => setChartMode(e)}
                        defaultValue={chartMode}
                        value={chartMode}
                    >
                        <Select.Option value={"line"}>Line</Select.Option>
                        <Select.Option value={"column"}>Column</Select.Option>
                    </Select>
                </Col>
            </Row>
        </Col>
        <Col span={24}>
            {
                chartMode === "line" && <Line
                    {...
                    {
                        ...chartConfig,
                        data: chartData,
                        loading: loading,
                        smooth: true,
                        ...lineOptions,
                        ...options
                    } as LineConfig
                    }
                />
            }
            {
                chartMode === "column" && <Column
                    {...
                    {
                        ...chartConfig,
                        data: chartData,
                        loading: loading,
                        ...columnOptions,
                        ...options
                    } as ColumnConfig
                    }
                />
            }

        </Col>
    </Row>
}