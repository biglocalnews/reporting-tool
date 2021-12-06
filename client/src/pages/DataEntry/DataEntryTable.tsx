import "./DataEntryTable.css";

import { useQuery, useMutation } from '@apollo/client';
import { useTranslation } from "react-i18next";

import { GET_DATASET } from '../../graphql/__queries__/GetDataset.gql';
import { UPDATE_RECORD } from '../../graphql/__mutations__/UpdateRecord.gql';

import {
    GetDataset, GetDataset_dataset_program_reportingPeriods, GetDataset_dataset_records_entries_categoryValue
} from "../../graphql/__generated__/GetDataset";

import { CreateRecordInput, EntryInput, UpdateRecordInput } from "../../graphql/__generated__/globalTypes"

import { Button, Col, DatePicker, InputNumber, Row, Table, Tabs } from 'antd';
const { TabPane } = Tabs;

import moment from 'moment';
import { CREATE_RECORD } from "../../graphql/__mutations__/CreateRecord.gql";
import { useState } from "react";
import { DELETE_RECORD } from "../../graphql/__mutations__/DeleteRecord.gql";
import CloseCircleOutlined from "@ant-design/icons/lib/icons/CloseCircleOutlined";
import { GetRecord_record_entries_personType } from "../../graphql/__generated__/GetRecord";

interface IProps {
    id: string;
}

interface ITableRow {
    id: string | null,
    date: string,
    index: number
}

interface ITableEntry extends EntryInput {
    elementId: string
}

export const getColumnClassName = (targetCategory: string) => {
    switch (targetCategory) {
        case "Gender":
            return "col-gender";
        case "Race / ethnicity":
            return "col-ethnicity";
        case "Disability":
            return "col-disability";
        default:
            return null;
    }
};

export const DataEntryTable = (props: IProps) => {
    const { loading: getDatasetLoading, error: getDatasetError, data: getDatasetData } = useQuery<GetDataset>(
        GET_DATASET,
        {
            variables: {
                id: props.id
            }
        }
    );
    const [saveRecord,] = useMutation<UpdateRecordInput>(UPDATE_RECORD, {
        refetchQueries: [
            {
                query: GET_DATASET,
                variables: {
                    id: props.id
                }
            }
        ],
    });

    const [createRecord] = useMutation<CreateRecordInput>(CREATE_RECORD, {
        refetchQueries: [
            {
                query: GET_DATASET,
                variables: {
                    id: props.id
                }
            }
        ],
    });

    const [deleteRecord] = useMutation(
        DELETE_RECORD,
        {
            refetchQueries: [
                {
                    query: GET_DATASET,
                    variables: {
                        id: props.id
                    }
                }
            ],
        }
    );

    const [selectedForInput, setSelectedForInput] = useState<ITableEntry | undefined>();
    const [selectedForRowInput, setSelectedForRowInput] = useState<ITableRow | undefined>();

    const { t } = useTranslation();

    if (getDatasetLoading) return <p>Loading dataset...</p>
    if (getDatasetError) return <p>{`getDataset Error! ${getDatasetError.message}`}</p>
    if (!getDatasetData) return <p>no dataset data</p>

    const personTypeArrayFromDataset = getDatasetData?.dataset.personTypes ?? [];

    const personTypeArrayFromRecords = Array.from(new Set(getDatasetData?.dataset.records
        .map(r => r.entries).flat().map(x => x.personType))) ?? [];

    const mergedPersonTypes = personTypeArrayFromDataset
        .filter(x => !personTypeArrayFromRecords.some(y => y?.personTypeName === x.personTypeName))
        .concat(personTypeArrayFromRecords as GetRecord_record_entries_personType[]);

    const currentTrackedAttributes = (attributeCategory: string) => getDatasetData.dataset.program.targets
        .filter(x => x.category.name === attributeCategory)
        .flatMap(x => x.tracks)
        .map(x => x.categoryValue);

    const currentTrackedAttributeCategories = getDatasetData.dataset.program.targets
        .map(x => x.category.name);

    const getChildren = (
        reportingPeriod: GetDataset_dataset_program_reportingPeriods,
        attributeCategory: string,
        personType: GetRecord_record_entries_personType) =>
        getDatasetData.dataset.records
            .filter(x =>
                reportingPeriod.range &&
                moment(x.publicationDate)
                    .isBetween(moment(reportingPeriod.range[0]), moment(reportingPeriod.range[1]))
            )
            .flatMap(x => x.entries)
            .filter(x => x.categoryValue.category.name === attributeCategory && x.personType?.id === personType.id)
            .map(x => x.categoryValue)
            .filter(x => !currentTrackedAttributes(attributeCategory).some(y => y.name === x.name))
            .concat(currentTrackedAttributes(attributeCategory) as GetDataset_dataset_records_entries_categoryValue[])
            .map(x => ({
                className: getColumnClassName(attributeCategory),
                title: t(x.name),
                dataIndex: x.name,
                key: x.name,
                render: function pd(entry: ITableEntry, record: ITableRow) {
                    if (!entry) {
                        entry = {
                            id: undefined,
                            count: undefined,
                            personTypeId: personType.id,
                            categoryValueId: x.id,
                            elementId: `${record.id}-${personType}-${x.name}`
                        }
                    }
                    const save = async () => {
                        if (!selectedForInput || selectedForInput.count === undefined || selectedForInput.count === null) return;
                        const { elementId, ...entryInput } = selectedForInput;
                        //remove elementId and keep linter happy by using it!
                        elementId;

                        let promise;
                        promise = record.id ? saveRecord({
                            variables: {
                                input: {
                                    id: record.id,
                                    entries: [entryInput]
                                }
                            }
                        }) :
                            promise = createRecord({
                                variables: {
                                    input: {
                                        datasetId: props.id,
                                        publicationDate: moment().toISOString(),
                                        entries: [entryInput]
                                    }
                                }
                            })
                        await promise
                            .catch((e) => setSelectedForInput(() => alert(e) as undefined))
                            .finally(() => setSelectedForInput((curr) => curr?.id === entry.id ? undefined : curr));

                    }
                    return selectedForInput?.elementId === entry.elementId ?
                        <InputNumber
                            tabIndex={0}
                            autoFocus={true}
                            min={0}
                            style={{ width: "60px" }}
                            value={selectedForInput?.count === null ? undefined : selectedForInput?.count}
                            title={`${t("numberOf")} ${t(x.name)}`}
                            aria-label={`${t("numberOf")} ${t(x.name)}`}
                            onChange={(e) => setSelectedForInput({
                                ...entry,
                                count: e === undefined ? undefined : e
                            })}
                            onPressEnter={() => save()}
                            onBlur={() => save()}
                        /> :
                        <div
                            tabIndex={0}
                            role="button"
                            title={`${t("numberOf")} ${t(x.name)}`}
                            aria-label={`${t("numberOf")} ${t(x.name)}`}
                            onKeyDown={() => setSelectedForInput(entry)}
                            onClick={() => setSelectedForInput(entry)}
                            onFocus={() => setSelectedForInput(entry)}
                        >
                            {entry.count === undefined ? <em>{t("null")}</em> : entry.count}
                        </div>

                }
            }));

    const getColumns = (reportingPeriod: GetDataset_dataset_program_reportingPeriods, personType: GetRecord_record_entries_personType) =>
        getDatasetData.dataset.records
            .flatMap(x => x.entries)
            .map(x => x.categoryValue.category.name)
            .filter(x => !currentTrackedAttributeCategories.includes(x))
            .concat(currentTrackedAttributeCategories)
            .map((attributeCategory) => ({
                title: attributeCategory,
                children: getChildren(reportingPeriod, attributeCategory, personType)
            }));

    const getTableData = (reportingPeriod: GetDataset_dataset_program_reportingPeriods, personType: GetRecord_record_entries_personType) => {
        const tableData = getDatasetData.dataset.records
            .filter(x =>
                reportingPeriod.range &&
                moment(x.publicationDate)
                    .isBetween(moment(reportingPeriod.range[0]), moment(reportingPeriod.range[1]))
            )
            .sort((a, b) => moment(b.publicationDate).unix() - moment(a.publicationDate).unix())
            .reduce((tableData, record, i) => {
                const currDate = moment(record.publicationDate).toISOString();
                const entries = record.entries
                    .filter(x => !personType || x.personType?.id === personType.id)
                    .reduce((obj, currEntry) => {
                        obj = {
                            ...obj,
                            [currEntry.categoryValue.name]: {
                                id: currEntry.id,
                                personTypeId: currEntry.personType?.id,
                                categoryValueId: currEntry.categoryValue.id,
                                count: currEntry.count,
                                elementId: currEntry.id
                            }
                        }
                        return obj;
                    }, {} as EntryInput);
                tableData.push({ id: record.id, date: currDate, index: i, ...entries });
                return tableData;

            }, [] as ITableRow[])

        return tableData;
    }

    function getRandomInt(min: number, max: number) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    }

    const getRandomDateTime = (date: moment.Moment) => moment.unix(getRandomInt(date.clone().subtract(1, "day").unix(), date.unix()));

    const getReportingPeriods = getDatasetData.dataset.program.reportingPeriods?.
        filter(x => x.range)
        .sort((a, b) => moment(a.range[1]).unix() - moment(b.range[1]).unix());

    return getReportingPeriods?.length ?
        <Tabs
            tabPosition="left"
            centered
            tabBarExtraContent={{ left: <div style={{ minHeight: "6em" }} /> }}
        >
            {
                getReportingPeriods?.
                    map((reportingPeriod, i) =>
                        <TabPane
                            tab={`${moment(reportingPeriod.range[0]).format("D MMM YY")} - ${moment(reportingPeriod.range[1]).format("D MMM YY")}`}
                            key={i}
                        >
                            <Row>
                                <Col span={24} style={{ display: "flex" }}>
                                    <h2>{reportingPeriod.description}</h2>
                                    <div style={{ flexGrow: 1 }} />
                                    <Button
                                        type="primary"
                                        onClick={
                                            async () => await createRecord({
                                                variables: {
                                                    input: {
                                                        publicationDate: getRandomDateTime(moment(reportingPeriod.range[1])).toISOString(),
                                                        datasetId: getDatasetData.dataset.id
                                                    }
                                                }
                                            })
                                                .then(() => console.log("Created!"))
                                                .catch((e) => alert(e))
                                        }
                                    >{t("addData")}</Button>

                                </Col>
                                <Col span={24}>
                                    <Tabs centered={true}>
                                        {
                                            mergedPersonTypes.map(personType =>
                                                <TabPane tab={personType.personTypeName} key={personType.id}>
                                                    <Table
                                                        pagination={false}
                                                        scroll={{ x: "max-content" }}
                                                        key={i}
                                                        columns={[
                                                            {
                                                                render: function d(record) {
                                                                    return <Button
                                                                        tabIndex={-1}
                                                                        type="text"
                                                                        danger
                                                                        title={t("deleteRecord")}
                                                                        aria-label={t("deleteRecord")}
                                                                        icon={<CloseCircleOutlined />}
                                                                        onClick={async () => await deleteRecord({
                                                                            variables: {
                                                                                id: record.id
                                                                            }
                                                                        })
                                                                            .then(() => console.log("Deleted!"))
                                                                            .catch((e) => alert(e))
                                                                        }
                                                                    />
                                                                }
                                                            },
                                                            {
                                                                title: "Date",
                                                                dataIndex: "date",
                                                                key: "date",
                                                                render: function pd(text, record: ITableRow) {
                                                                    const save = async () => {
                                                                        if (!selectedForRowInput) return;
                                                                        const promise = saveRecord({
                                                                            variables: {
                                                                                input: {
                                                                                    id: selectedForRowInput.id,
                                                                                    publicationDate: selectedForRowInput.date
                                                                                }
                                                                            }
                                                                        })
                                                                        await promise
                                                                            .catch((e) => setSelectedForRowInput(() => alert(e) as undefined))
                                                                            .finally(() => setSelectedForRowInput(undefined));

                                                                    }
                                                                    if (selectedForRowInput?.id === record.id) {
                                                                        return <DatePicker
                                                                            aria-label={t("recordDate")}
                                                                            tabIndex={0}
                                                                            value={moment(selectedForRowInput.date)}
                                                                            onChange={(e) => e && setSelectedForRowInput({
                                                                                ...record,
                                                                                date: e.toISOString()
                                                                            })}
                                                                            onBlur={() => save()}
                                                                        />
                                                                    }
                                                                    return <div
                                                                        title={t("recordDate")}
                                                                        aria-label={t("recordDate")}
                                                                        tabIndex={0}
                                                                        role="button"
                                                                        onKeyDown={() => setSelectedForRowInput(record)}
                                                                        onClick={() => setSelectedForRowInput(record)}
                                                                        onFocus={() => setSelectedForRowInput(record)}
                                                                    >
                                                                        {moment(text).format("D MMM YYYY")}
                                                                    </div>
                                                                    return;
                                                                },
                                                                sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix(),
                                                                sortDirections: ['ascend', 'descend'],
                                                            },
                                                            ...getColumns(reportingPeriod, personType)
                                                        ]}
                                                        dataSource={getTableData(reportingPeriod, personType)}
                                                    >
                                                    </Table>
                                                </TabPane>
                                            )}
                                    </Tabs>
                                </Col>
                            </Row>
                        </TabPane >

                    )}
        </Tabs > : <p>No reporting periods configured</p>
}
