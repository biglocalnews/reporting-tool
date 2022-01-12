import "./DataEntryTable.css";

import { useQuery, useMutation } from '@apollo/client';
import { useTranslation } from "react-i18next";

import { GET_DATASET } from '../../graphql/__queries__/GetDataset.gql';
import { UPDATE_RECORD } from '../../graphql/__mutations__/UpdateRecord.gql';

import {
    GetDataset, GetDataset_dataset_program_reportingPeriods, GetDataset_dataset_program_targets_category, GetDataset_dataset_records_entries_categoryValue
} from "../../graphql/__generated__/GetDataset";

import { CreatePublishedRecordSetInput, CreateRecordInput, CustomColumnType, CustomColumnValueInput, EntryInput, UpdateRecordInput } from "../../graphql/__generated__/globalTypes"

import { Button, Col, DatePicker, Input, InputNumber, Modal, Radio, Row, Space, Table, Tabs } from 'antd';
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
import { IPublishedEntry, IPublishedRecordSetDocument, PublishedRecordSet } from "../DatasetDetails/PublishedRecordSet";


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

    const { t } = useTranslation();

    if (getDatasetLoading) return <p>Loading dataset...</p>
    if (getDatasetError) return <p>{`getDataset Error! ${getDatasetError.message}`}</p>
    if (!getDatasetData) return <p>no dataset data</p>

    const personTypeArrayFromDataset = getDatasetData?.dataset.personTypes ?? [];

    const personTypeArrayFromRecords = Array.from(new Set(getDatasetData?.dataset.records
        .map(r => r.entries).flat().map(x => x.personType))) ?? [];

    const mergedPersonTypes = personTypeArrayFromDataset
        .filter(x => !personTypeArrayFromRecords.some(y => y?.id === x.id))
        .concat(personTypeArrayFromRecords as GetRecord_record_entries_personType[])
        .filter(x => x)
        .map(x => ({ id: x.id, personTypeName: x.personTypeName }))
        .sort((a, b) => a.personTypeName.localeCompare(b.personTypeName));

    const customColumnArrayFromDataset = getDatasetData?.dataset.customColumns ?? [];

    const customColumnArrayFromRecords = (range: GetDataset_dataset_program_reportingPeriods) => Array.from(new Set(getDatasetData?.dataset.records
        .filter(x =>
            range.range &&
            moment(x.publicationDate)
                .isBetween(moment(range.range[0]), moment(range.range[1]))
        )
        .map(r => r.customColumnValues).flat().map(x => x?.customColumn))) ?? [];

    const mergedCustomColumns = (range: GetDataset_dataset_program_reportingPeriods) => customColumnArrayFromDataset
        .filter(x => !customColumnArrayFromRecords(range).some(y => y?.id === x.id))
        .concat(customColumnArrayFromRecords(range) as GetRecord_record_customColumnValues_customColumn[])
        .filter(x => x)
        .sort((a, b) => a.name.localeCompare(b.name));

    const currentTrackedAttributesByCategory = (attributeCategory: GetDataset_dataset_program_targets_category) => getDatasetData.dataset.program.targets
        .filter(x => x.category.id === attributeCategory.id)
        .sort((a, b) => b.target - a.target)
        .flatMap(x => x.tracks)
        .map(x => x.categoryValue);

    const currentTrackedAttributes = getDatasetData.dataset.program.targets
        .flatMap(x => x.tracks)
        .map(x => x.categoryValue);

    const currentTrackedAttributeCategories = Array.from(getDatasetData.dataset.program.targets)
        .sort((a, b) => b.target - a.target)
        .map(x => x.category);

    const getChildren = (
        reportingPeriod: GetDataset_dataset_program_reportingPeriods,
        attributeCategory: GetDataset_dataset_program_targets_category,
        personType: IPersonType) =>
        getDatasetData.dataset.records
            .filter(x =>
                reportingPeriod.range &&
                moment(x.publicationDate)
                    .isBetween(moment(reportingPeriod.range[0]), moment(reportingPeriod.range[1]))
            )
            .flatMap(x => x.entries)
            .filter(x => x.categoryValue.category.id === attributeCategory.id && x.personType?.id === personType.id)
            .map(x => x.categoryValue)
            .filter(x => !currentTrackedAttributesByCategory(attributeCategory).some(y => y.id === x.id))
            .concat(currentTrackedAttributesByCategory(attributeCategory) as GetDataset_dataset_records_entries_categoryValue[])
            .sort((a, b) => a.name.localeCompare(b.name))
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

    const getColumns = (reportingPeriod: GetDataset_dataset_program_reportingPeriods,
        personType: IPersonType) =>
        getDatasetData.dataset.records
            .flatMap(x => x.entries)
            .map(x => x.categoryValue.category)
            .filter(x => !currentTrackedAttributeCategories.some(y => y.id === x.id))
            .concat(currentTrackedAttributeCategories)
            .map((attributeCategory) => ({
                title: attributeCategory,
                children: getChildren(reportingPeriod, attributeCategory, personType)
            }));

    const getCustomColumns = (reportingPeriod: GetDataset_dataset_program_reportingPeriods) =>
        mergedCustomColumns(reportingPeriod)
            .map((customColumn) => ({
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
                            .catch((e) => setSelectedForCustomInput(() => alert(e) as undefined))
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

    const getRandomDateTime = (date: moment.Moment) => moment.unix(getRandomInt(date.clone().subtract(1, "day").unix(), date.unix()));

    const getReportingPeriods = (includePublished: boolean) => getDatasetData.dataset.program.reportingPeriods?.
        filter(x => x.range && (includePublished || !getDatasetData.dataset.publishedRecordSets?.some(y => y.reportingPeriodId === x.id)))
        .sort((a, b) => moment(a.range[1]).unix() - moment(b.range[1]).unix());

    const getRecordSetDocument = (reportingPeriod: GetDataset_dataset_program_reportingPeriods) =>
        ({
            datasetGroup: getDatasetData.dataset.program.name,
            reportingPeriodDescription: reportingPeriod.description ?? "",
            begin: reportingPeriod.range[0],
            end: reportingPeriod.range[1],
            datasetTags: getDatasetData.dataset.tags
                .map(x => ({ name: x.name, group: x.tagType })),
            datasetGroupTags: getDatasetData.dataset.program.tags
                .map(x => ({ name: x.name, group: x.tagType })),
            targets: getDatasetData.dataset.program.targets
                .map(x => ({ category: x.category.name, target: x.target * 100 }))
                .sort((a, b) => b.target - a.target),
            record: getDatasetData.dataset.records
                .filter(x =>
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
                            const personType = currEntry.personType?.personTypeName ?? "Everyone";
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
                                        .filter(x => (x.personType?.personTypeName ?? "Everyone") === personType && x.categoryValue.category.name === category)
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
                                    personType: currEntry.personType?.personTypeName ?? "Everyone",
                                    targetMember: getDatasetData.dataset.program.targets
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
                }, {} as Record<string, Record<string, { total?: number, entries: Record<string, IPublishedEntry> }>>)
        }) as IPublishedRecordSetDocument;



    const stripCountsFromEntries = (document: IPublishedRecordSetDocument) => {
        for (const personType in document.record) {
            for (const category in document.record[personType]) {
                delete document.record[personType][category]["total"];
                for (const entry in document.record[personType][category]["entries"]) {
                    delete document.record[personType][category]["entries"][entry]["count"];
                }
            }
        }
        return document;
    }

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
                if (moment().isBetween(moment(reportingPeriod.range[0]), moment(reportingPeriod.range[1]))) { return rpIndex.toString() }
                return prev;
            }, "0") ?? "0"
        }
    >
        {
            getReportingPeriods(false)?.
                map((reportingPeriod, rpIndex: number) =>
                    <TabPane
                        tab={`${moment(reportingPeriod.range[0]).format("D MMM YY")} - ${moment(reportingPeriod.range[1]).format("D MMM YY")}`}
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
                                            document: JSON.stringify(stripCountsFromEntries(getRecordSetDocument(reportingPeriod)))
                                        }
                                    }
                                })
                                    .then(() => console.log("Published!"))
                                    .catch((e) => alert(e))
                                setPublishedRecordSetModalVisiblity((curr) => ({ ...curr, [rpIndex]: false }));
                            }
                            }
                            onCancel={() => setPublishedRecordSetModalVisiblity((curr) => ({ ...curr, [rpIndex]: false }))}
                        >
                            <PublishedRecordSet summary={true} document={stripCountsFromEntries(getRecordSetDocument(reportingPeriod))} />
                        </Modal>
                        <Row>
                            <Col span={24} style={{ display: "flex" }}>
                                <Button
                                    type="primary"
                                    icon={<SoundTwoTone twoToneColor="#ffaaaa" />}
                                    onClick={() => setPublishedRecordSetModalVisiblity((curr) => ({ ...curr, [rpIndex]: true }))}
                                >{`${t("publishRecordSet")} ${reportingPeriod.description}`}
                                </Button>
                                <div style={{ flexGrow: 1 }} />
                                <Space>
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
                                                                    setAddRecordDatePicker(moment(reportingPeriod.range[1]));
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
                                                    createRecord({
                                                        variables: {
                                                            input: {
                                                                publicationDate: getRandomDateTime(addRecordDatePicker).toISOString(),
                                                                datasetId: getDatasetData.dataset.id,
                                                                entries: currentTrackedAttributes.map(cv => {
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
                                                        .then(() => {
                                                            console.log("Created!");
                                                            setAddRecordDatePicker(undefined);
                                                        })
                                                        .catch((e) => alert(e))
                                                }
                                                const promises = [];
                                                for (let i = 0; i < noOfNewRecords; i++) {
                                                    promises.push(createRecordPromise());
                                                }
                                                await Promise.all(promises)
                                                    .then((results) => console.log(results))
                                            }
                                        }
                                    >
                                        {addRecordDatePicker ? t("saveRecord") : t("newRow")}
                                    </Button>
                                </Space>
                            </Col>
                            <Col span={24}>
                                <Tabs centered={true}>
                                    {
                                        (mergedPersonTypes.length ? mergedPersonTypes : [{ personTypeName: t("unknownPersonType"), id: undefined }])
                                            .map((personType: IPersonType, pTypeindex: number) =>
                                                <TabPane tab={personType.personTypeName} key={pTypeindex}>
                                                    <Table
                                                        pagination={false}
                                                        scroll={{ x: "max-content" }}
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
                                                            ...getCustomColumns(reportingPeriod),
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
    </Tabs >
}
