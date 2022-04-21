import "./DataEntryTable.css";

import { useQuery, useMutation } from '@apollo/client';
import { useTranslation } from "react-i18next";

import { GET_DATASET } from '../../graphql/__queries__/GetDataset.gql';
import { UPDATE_RECORD } from '../../graphql/__mutations__/UpdateRecord.gql';

import {
    GetDataset, GetDataset_dataset_program_reportingPeriods, GetDataset_dataset_program_targets_category, GetDataset_dataset_records_entries_categoryValue
} from "../../graphql/__generated__/GetDataset";

import { CreatePublishedRecordSetInput, CreateRecordInput, CustomColumnType, CustomColumnValueInput, EntryInput, UpdateRecordInput } from "../../graphql/__generated__/globalTypes"

import { Button, Col, DatePicker, Input, InputNumber, message, Modal, Radio, Row, Space, Table, Tabs } from 'antd';
const { TabPane } = Tabs;

import {

    PlusCircleOutlined,

} from "@ant-design/icons";

import moment from 'moment';
import { CREATE_RECORD } from "../../graphql/__mutations__/CreateRecord.gql";
import { useState } from "react";
import { DELETE_RECORD } from "../../graphql/__mutations__/DeleteRecord.gql";
import CloseCircleOutlined from "@ant-design/icons/lib/icons/CloseCircleOutlined";
import { GetRecord_record_customColumnValues_customColumn, GetRecord_record_entries_personType } from "../../graphql/__generated__/GetRecord";
import SoundTwoTone from "@ant-design/icons/lib/icons/SoundTwoTone";
import { CREATE_PUBLISHED_RECORD_SET } from "../../graphql/__mutations__/CreatePublishedRecordSet.gql";
import { getRecordSetDocument, PublishedRecordSet } from "../DatasetDetails/PublishedRecordSet";
import { catSort } from "../CatSort";


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

interface ITableCustomValue extends CustomColumnValueInput {
    elementId: string,
    type: string,
    description: string | undefined
}

interface IPersonType {
    personTypeName: string,
    id: string | undefined
}

export const getColumnClassName = (targetCategory: GetDataset_dataset_program_targets_category) => {
    switch (targetCategory.name) {
        case "Gender":
            return "col-gender";
        case "Ethnicity":
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

    const [createRecord, { loading: createRecordLoading }] = useMutation<CreateRecordInput>(CREATE_RECORD, {
        refetchQueries: [
            {
                query: GET_DATASET,
                variables: {
                    id: props.id
                }
            }
        ],
        onError: () => { ; },
    });

    const [deleteRecord, { loading: deleteRecordLoading }] = useMutation(
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

    const [createPublishedRecordSet] = useMutation<CreatePublishedRecordSetInput>(CREATE_PUBLISHED_RECORD_SET, {
        refetchQueries: [
            {
                query: GET_DATASET,
                variables: {
                    id: props.id
                }
            }
        ],
    });

    const [selectedForInput, setSelectedForInput] = useState<ITableEntry | undefined>();
    const [selectedForCustomInput, setSelectedForCustomInput] = useState<ITableCustomValue | undefined>();
    const [selectedForRowInput, setSelectedForRowInput] = useState<ITableRow | undefined>();
    const [publishedRecordSetModalVisiblity, setPublishedRecordSetModalVisiblity] = useState({} as Record<number, boolean>);
    const [addRecordDatePicker, setAddRecordDatePicker] = useState<moment.Moment | undefined>(undefined);
    const [noOfNewRecords, setNoOfNewRecords] = useState(1);
    const [activePersonTypeTab, setActivePersonTypeTab] = useState<string>("0");

    const { t } = useTranslation();

    if (getDatasetLoading) return <p>Loading dataset...</p>
    if (getDatasetError) return <p>{`getDataset Error! ${getDatasetError.message}`}</p>
    if (!getDatasetData) return <p>no dataset data</p>

    const personTypeArrayFromDataset = getDatasetData?.dataset.personTypes ?? [];

    /*const personTypeArrayFromRecords = Array.from(new Set(getDatasetData?.dataset.records
        .map(r => r.entries).flat().map(x => x.personType))) ?? [];
    */

    const personTypeArrayFromRecordsByReportingPeriod = (reportingPeriod: GetDataset_dataset_program_reportingPeriods) =>
        Array.from(
            new Set(
                getDatasetData?.dataset.records
                    .filter(x =>
                        reportingPeriod.range &&
                        moment.utc(x.publicationDate)
                            .isBetween(moment.utc(reportingPeriod.range[0]), moment.utc(reportingPeriod.range[1]), null, "[]")
                    )
                    .map(r => r.entries).flat().map(x => x.personType)
            )
        ) ?? [];

    const mergedPersonTypes = (reportingPeriod: GetDataset_dataset_program_reportingPeriods) =>
        personTypeArrayFromDataset
            .filter(x => !personTypeArrayFromRecordsByReportingPeriod(reportingPeriod).some(y => y?.id === x.id))
            .concat(personTypeArrayFromRecordsByReportingPeriod(reportingPeriod) as GetRecord_record_entries_personType[])
            .filter(x => x)
            .map(x => ({ id: x.id, personTypeName: x.personTypeName }))
            .sort((a, b) => a.personTypeName.localeCompare(b.personTypeName));

    const customColumnArrayFromDataset = getDatasetData?.dataset.customColumns ?? [];

    const customColumnArrayFromRecords = (range: GetDataset_dataset_program_reportingPeriods) => Array.from(new Set(getDatasetData?.dataset.records
        .filter(x =>
            range.range &&
            moment.utc(x.publicationDate)
                .isBetween(moment.utc(range.range[0]), moment.utc(range.range[1]), null, "[]")
        )
        .map(r => r.customColumnValues).flat().map(x => x?.customColumn))) ?? [];

    const mergedCustomColumns = (range: GetDataset_dataset_program_reportingPeriods) => customColumnArrayFromDataset
        .filter(x => !customColumnArrayFromRecords(range).some(y => y?.id === x.id))
        .concat(customColumnArrayFromRecords(range) as GetRecord_record_customColumnValues_customColumn[])
        .filter(x => x)
        .sort((a, b) => a.name.localeCompare(b.name));

    const currentTrackedAttributesByCategory = (attributeCategory: GetDataset_dataset_program_targets_category) => getDatasetData.dataset?.program?.targets
        .filter(x => x.category.id === attributeCategory.id)
        .sort((a, b) => catSort(a.category.name, b.category.name))
        .flatMap(x => x.tracks)
        .map(x => x.categoryValue) ?? [];

    const currentTrackedAttributes = getDatasetData.dataset?.program?.targets
        .flatMap(x => x.tracks)
        .map(x => x.categoryValue);

    const currentTrackedAttributeCategories = Array.from(getDatasetData.dataset?.program?.targets ?? [])
        .sort((a, b) => catSort(a.category.name, b.category.name))
        .map(x => x.category);

    const getChildren = (
        reportingPeriod: GetDataset_dataset_program_reportingPeriods,
        attributeCategory: GetDataset_dataset_program_targets_category,
        personType: IPersonType) =>
        getDatasetData.dataset.records
            .filter(x =>
                reportingPeriod.range &&
                moment.utc(x.publicationDate)
                    .isBetween(moment.utc(reportingPeriod.range[0]), moment.utc(reportingPeriod.range[1]), null, "[]")
            )
            .flatMap(x => x.entries)
            .filter(x => x.categoryValue.category.id === attributeCategory.id && x.personType?.id === personType.id)
            .map(x => x.categoryValue)
            .filter(x => !currentTrackedAttributesByCategory(attributeCategory).some(y => y.id === x.id))
            .concat(currentTrackedAttributesByCategory(attributeCategory) as GetDataset_dataset_records_entries_categoryValue[])
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(x => ({
                className: getColumnClassName(attributeCategory),
                title: <b>{x.name}</b>,
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
                            .catch((e) => {
                                setSelectedForInput(undefined);
                                message.error(e)
                            })
                            .finally(() => setSelectedForInput((curr) => curr?.id === entry.id ? undefined : curr));

                    }
                    return selectedForInput?.elementId === entry.elementId ?
                        <InputNumber
                            tabIndex={0}
                            autoFocus={true}
                            min={0}
                            style={{ width: "60px" }}
                            value={selectedForInput?.count === null ? undefined : selectedForInput?.count}
                            title={`${t("numberOf")} ${x.name}`}
                            aria-label={`${t("numberOf")} ${x.name}`}
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
                            title={`${t("numberOf")} ${x.name}`}
                            aria-label={`${t("numberOf")} ${x.name}`}
                            onKeyDown={() => setSelectedForInput(entry)}
                            onClick={() => setSelectedForInput(entry)}
                            onFocus={() => setSelectedForInput(entry)}
                        >
                            {entry.count === undefined ? <em>{t("null")}</em> : entry.count}
                        </div>

                }
            }));

    const getColumns = (reportingPeriod: GetDataset_dataset_program_reportingPeriods,
        personType: IPersonType) =>
        getDatasetData.dataset.records
            .flatMap(x => x.entries)
            .map(x => x.categoryValue.category)
            .filter(x => !currentTrackedAttributeCategories.some(y => y.id === x.id))
            .concat(currentTrackedAttributeCategories)
            .map((attributeCategory) => ({
                title: <span style={{ fontSize: "larger" }}>{attributeCategory.name}</span>,
                children: getChildren(reportingPeriod, attributeCategory, personType)
            }));

    const getCustomColumns = (reportingPeriod: GetDataset_dataset_program_reportingPeriods) =>
        mergedCustomColumns(reportingPeriod)
            .map((customColumn) => ({
                fixed: true,
                title: customColumn.name,
                dataIndex: customColumn.name,
                key: customColumn.name,
                render: function pd(customValue: ITableCustomValue, record: ITableRow) {
                    if (!customValue) {
                        customValue = {
                            customColumnId: customColumn.id,
                            value: undefined,
                            elementId: `${record.id}-${customColumn.id}`,
                            type: CustomColumnType.string,
                            description: undefined
                        }
                    }
                    const save = async () => {
                        if (!selectedForCustomInput || selectedForCustomInput.value === undefined || selectedForCustomInput.value === null) return;
                        const { elementId, type, description, ...customValueInput } = selectedForCustomInput;
                        //remove elementId and keep linter happy by using it!
                        elementId;
                        type;
                        description;

                        let promise;
                        promise = record.id ? saveRecord({
                            variables: {
                                input: {
                                    id: record.id,
                                    customColumnValues: [customValueInput]
                                }
                            }
                        }) :
                            promise = createRecord({
                                variables: {
                                    input: {
                                        datasetId: props.id,
                                        publicationDate: moment().toISOString(),
                                        customColumnValues: [customValueInput]
                                    }
                                }
                            })
                        await promise
                            .catch((e) => {
                                setSelectedForCustomInput(undefined);
                                message.error(e)
                            })
                            .finally(() => setSelectedForCustomInput((curr) => curr?.id === customValue.id ? undefined : curr));

                    }

                    if (selectedForCustomInput?.elementId === customValue.elementId) {
                        switch (customColumn.type) {
                            default:
                                return <Input
                                    type="text"
                                    tabIndex={0}
                                    autoFocus={true}
                                    title={customColumn.name}
                                    aria-label={customColumn.name}
                                    onChange={(e) => setSelectedForCustomInput({
                                        ...customValue,
                                        value: e.target.value === undefined ? undefined : e.target.value
                                    })}
                                    onPressEnter={() => save()}
                                    onBlur={() => save()}
                                    value={selectedForCustomInput?.value ?? undefined}
                                />
                        }
                    }
                    return <div
                        tabIndex={0}
                        role="button"
                        style={{ maxWidth: "150px" }}
                        title={customColumn.name}
                        aria-label={customColumn.name}
                        onKeyDown={() => setSelectedForCustomInput(customValue)}
                        onClick={() => setSelectedForCustomInput(customValue)}
                        onFocus={() => setSelectedForCustomInput(customValue)}
                    >
                        {customValue.value === undefined ? <em>{t("null")}</em> : customValue.value}
                    </div>
                }
            }));

    const getTableData = (reportingPeriod: GetDataset_dataset_program_reportingPeriods,
        personType: IPersonType) => {
        const tableData = getDatasetData.dataset.records
            .filter(x =>
                reportingPeriod.range &&
                moment.utc(x.publicationDate)
                    .isBetween(moment.utc(reportingPeriod.range[0]), moment.utc(reportingPeriod.range[1]), null, "[]")
            )
            .sort((a, b) => moment(b.publicationDate).unix() - moment(a.publicationDate).unix())
            .reduce((tableData, record, i) => {
                const currDate = moment.utc(record.publicationDate).toISOString();
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
                    }, {} as any);
                const customColumnValues = record.customColumnValues?.
                    reduce((obj, currValue) => {
                        obj = {
                            ...obj,
                            [currValue.customColumn.name]: {
                                id: currValue.id,
                                elementId: currValue.id,
                                customColumnId: currValue.customColumn.id,
                                value: currValue.value,
                                type: currValue.customColumn.type
                            }
                        }
                        return obj;
                    }, {} as any);
                tableData.push({ id: record.id, date: currDate, index: i, ...entries, ...customColumnValues });
                return tableData;

            }, [] as ITableRow[])

        return tableData;
    }

    function getRandomInt(min: number, max: number) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    }

    const getRandomDateTime = (date: moment.Moment) => moment.unix(
        getRandomInt(
            date.clone().set("hour", 0).set("minute", 0).set("second", 0).set("millisecond", 0).unix(),
            date.clone().set("hour", 23).set("minute", 59).set("second", 59).set("millisecond", 999).unix()
        )
    );

    const getReportingPeriods = (includePublished: boolean) => getDatasetData.dataset?.program?.reportingPeriods?.
        filter(x => x.range && (includePublished || !getDatasetData.dataset.publishedRecordSets?.some(y => y.reportingPeriodId === x.id)))
        .sort((a, b) => moment(a.range[1]).unix() - moment(b.range[1]).unix());

    if (!getReportingPeriods(false)?.length) {
        if (getReportingPeriods(true)?.length) return <p>{t("allReportingPeriodsPublished")}</p>
        return <p>{t("noReportingPeriodsConfigured")}</p>
    }

    return <Tabs
        tabPosition="left"
        centered
        tabBarExtraContent={{ left: <div style={{ minHeight: "6em" }} /> }}
        defaultActiveKey={getReportingPeriods(false)?.
            reduce((prev, reportingPeriod, rpIndex: number) => {
                if (moment().isBetween(moment.utc(reportingPeriod.range[0]), moment.utc(reportingPeriod.range[1]), null, "[]")) { return rpIndex.toString() }
                return prev;
            }, "0") ?? "0"
        }
    >
        {
            getReportingPeriods(false)?.
                map((reportingPeriod, rpIndex: number) =>
                    <TabPane
                        tab={
                            <span
                                style={{
                                    color:
                                        moment().add(-5, "days").isAfter(moment(reportingPeriod.range[1])) ? "red" :
                                            moment().isBetween(moment.utc(reportingPeriod.range[1]).add(-5, "days"), moment().add(1, "day"), null, "[]") ? "orange" : "unset",
                                    fontWeight: moment().isBetween(moment.utc(reportingPeriod.range[0]), moment.utc(reportingPeriod.range[1]), null, "[]") ? 600 : 400
                                }}
                            >
                                {`${moment.utc(reportingPeriod.range[0]).format("D MMM YY")} - ${moment.utc(reportingPeriod.range[1]).format("D MMM YY")}`}
                            </span>
                        }
                        key={rpIndex}
                    >
                        <Modal title="Publish this?"
                            visible={publishedRecordSetModalVisiblity[rpIndex]}
                            onOk={async () => {
                                await createPublishedRecordSet({
                                    variables: {
                                        input: {
                                            begin: reportingPeriod.range[0],
                                            end: reportingPeriod.range[1],
                                            datasetId: getDatasetData.dataset.id,
                                            reportingPeriodId: reportingPeriod.id,
                                            document: JSON.stringify(getRecordSetDocument(getDatasetData.dataset, reportingPeriod))
                                        }
                                    }
                                })
                                    .then(() => message.success(`${t("published")}!`))
                                    .catch((e) => message.error(e))
                                setPublishedRecordSetModalVisiblity((curr) => ({ ...curr, [rpIndex]: false }));
                            }
                            }
                            onCancel={() => setPublishedRecordSetModalVisiblity((curr) => ({ ...curr, [rpIndex]: false }))}
                        >

                            <PublishedRecordSet summary={true} dataset={getDatasetData.dataset} reportingPeriod={reportingPeriod} />

                        </Modal>
                        <Row gutter={[10, 10]}>
                            <Col span={24} style={{ display: "flex" }}>

                                <Space
                                    align="center"
                                >
                                    {
                                        addRecordDatePicker &&
                                        <Space>
                                            <DatePicker
                                                value={addRecordDatePicker}
                                                onChange={(v) => v ? setAddRecordDatePicker(v) : setAddRecordDatePicker(undefined)}
                                                format={(val) =>
                                                    Intl.DateTimeFormat(window.navigator.language, {
                                                        weekday: "short",
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    }).format(val.toDate())
                                                }
                                                renderExtraFooter={() =>
                                                    <Radio.Group
                                                        defaultValue={"today"}
                                                        onChange={e => {
                                                            switch (e.target.value) {
                                                                case "currentrp":
                                                                    setAddRecordDatePicker(moment.utc(reportingPeriod.range[1]));
                                                                    break;
                                                                default:
                                                                    setAddRecordDatePicker(moment());
                                                            }
                                                        }
                                                        }

                                                    >

                                                        <Radio value={"currentrp"}>{t("currentrp")}</Radio>
                                                    </Radio.Group>
                                                }
                                            />
                                            <InputNumber
                                                min={1}
                                                defaultValue={1}
                                                value={noOfNewRecords}
                                                onChange={e => setNoOfNewRecords(e)}
                                                style={{ width: "4rem" }}
                                                title={t("noOfRecords")}
                                            />
                                        </Space>
                                    }
                                    <Button
                                        type="primary"
                                        danger={addRecordDatePicker ? true : false}
                                        icon={addRecordDatePicker ? undefined : <PlusCircleOutlined />}
                                        onClick={
                                            async () => {
                                                if (!addRecordDatePicker) return setAddRecordDatePicker(moment())
                                                const createRecordPromise = () => {
                                                    return createRecord({
                                                        variables: {
                                                            input: {
                                                                publicationDate: getRandomDateTime(addRecordDatePicker).toISOString(),
                                                                datasetId: getDatasetData.dataset.id,
                                                                entries: currentTrackedAttributes?.map(cv => {
                                                                    if (personTypeArrayFromDataset.length) {
                                                                        return personTypeArrayFromDataset.map(pt => ({
                                                                            personTypeId: pt.id,
                                                                            categoryValueId: cv.id,
                                                                            count: 0,
                                                                        }))
                                                                    }
                                                                    return ({
                                                                        categoryValueId: cv.id,
                                                                        count: 0,
                                                                    })
                                                                }).flat()
                                                            }
                                                        }
                                                    })
                                                }
                                                const promises = [];
                                                for (let i = 0; i < noOfNewRecords; i++) {
                                                    promises.push(createRecordPromise());
                                                }
                                                await Promise.all(promises)
                                                    .then(() => setAddRecordDatePicker(undefined));
                                            }
                                        }
                                    >
                                        {addRecordDatePicker ? t("saveRecord") : t("newRow")}
                                    </Button>
                                </Space>
                                <div style={{ flexGrow: 1 }} />
                                <Button
                                    type="primary"
                                    icon={<SoundTwoTone twoToneColor="#ffaaaa" />}
                                    onClick={() => setPublishedRecordSetModalVisiblity((curr) => ({ ...curr, [rpIndex]: true }))}
                                >{`${t("publishRecordSet")} ${reportingPeriod.description}`}
                                </Button>
                            </Col>
                            <Col span={24}>
                                <Tabs
                                    centered={true}
                                    type="card"
                                    size="large"
                                    onChange={(e) => setActivePersonTypeTab(e)}
                                >
                                    {
                                        (mergedPersonTypes(reportingPeriod).length ? mergedPersonTypes(reportingPeriod) : [{ personTypeName: t("unknownPersonType"), id: undefined }])
                                            .map((personType: IPersonType, pTypeindex: number) =>
                                                <TabPane
                                                    tab={
                                                        activePersonTypeTab === pTypeindex.toString() ?
                                                            <span style={{ fontSize: "larger", fontWeight: 600 }}>{personType.personTypeName}</span>
                                                            :
                                                            <span style={{ fontSize: "smaller" }}>{personType.personTypeName}</span>}
                                                    key={pTypeindex.toString()}
                                                >
                                                    <Table
                                                        pagination={false}
                                                        scroll={{ x: "max-content" }}
                                                        loading={getDatasetLoading || createRecordLoading || deleteRecordLoading}
                                                        dataSource={getTableData(reportingPeriod, personType)}
                                                        columns={[
                                                            {
                                                                fixed: true,
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
                                                                            .then(() => message.success("Deleted!"))
                                                                            .catch((e) => message.error(e))
                                                                        }
                                                                    />
                                                                }
                                                            },
                                                            {
                                                                fixed: true,
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
                                                                            .catch((e) => {
                                                                                setSelectedForRowInput(undefined);
                                                                                message.error(e)
                                                                            })
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
                                                            ...getCustomColumns(reportingPeriod),
                                                            ...getColumns(reportingPeriod, personType)
                                                        ]}

                                                    >
                                                    </Table>
                                                </TabPane>
                                            )}
                                </Tabs>
                            </Col>
                        </Row>
                    </TabPane >

                )}
    </Tabs >
}
