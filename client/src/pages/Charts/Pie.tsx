import { Pie, Datum, PieConfig } from "@ant-design/charts";
import { AnnotationPosition } from "@antv/g2plot";
import { useTranslation } from "react-i18next";
import { getPalette } from "../DatasetDetails/DatasetDetails";

interface IProps {
    categoryName: string,
    attibute?: string,
    personType?: string,
    target?: number,
    status: number,
    legend?: boolean
}

const Pie5050 = (props: IProps) => {
    const { t } = useTranslation();
    const config: PieConfig = {
        width: 200,
        height: 200,
        data: [
            { targetName: props.attibute ? props.attibute : props.categoryName, value: props.status },
            { targetName: "Other", value: 100 - props.status },
        ],
        innerRadius: 0.5,
        angleField: "value",
        colorField: "targetName",
        color: (datum: Datum) => {
            return datum.targetName === "Other"
                ? getPalette(props.categoryName)[0]
                : getPalette(props.categoryName)[1];
        },
        tooltip: {
            formatter: (datum: Datum) => datum.targetName === "Other" ? { name: t("other"), value: `${Number(datum.value).toFixed(2)}%` } : {
                value: `${Number(datum.value).toFixed(2)}%`, name: `${datum.targetName}`
            }
        },
        legend: false,
        statistic: {
            title: false,
            content: {
                style: {
                    whiteSpace: 'pre-wrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: 'x-large'
                },
                customHtml: () => Math.round(props.status).toString()
            },
        },
        label: false,
        annotations: [
            {
                //type: 'dataMarker',
                //position: ['median', props.target],
                type: 'line',
                end: [0, props.target] as AnnotationPosition,
                start: [1.2, props.target] as AnnotationPosition,
                text: {
                    content: `${props.target}%`,
                    autoRotate: false,
                    style: { fontSize: 10 },
                    offsetX: 1,
                    offsetY: 5
                }
            },
        ],

        //padding: 40
        padding: "auto" as const,
        appendPadding: 10
    };
    return <Pie {...config} />
}

export default Pie5050;