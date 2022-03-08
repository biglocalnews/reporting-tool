import moment from "moment";
import { IDatasetDetailsFilter } from "../components/DatasetDetailsFilterProvider";
import {
    GetDataset,
    GetDataset_dataset_personTypes,
    GetDataset_dataset_program_targets_category,
    GetDataset_dataset_records,
    GetDataset_dataset_records_entries
} from "../graphql/__generated__/GetDataset";
import { catSort } from "../pages/CatSort";

const sumOfEntriesByAttributeCategory = (
    entries: readonly GetDataset_dataset_records_entries[],
    attributeCategory: GetDataset_dataset_program_targets_category,
    personType: GetDataset_dataset_personTypes | undefined
) => {
    return entries.reduce((prevEntry, currEntry) => {
        const personTypeBool =
            personType !== undefined
                ? currEntry.personType?.id === personType.id
                : true;
        return currEntry.categoryValue.category.id === attributeCategory.id &&
            personTypeBool
            ? currEntry.count + prevEntry
            : prevEntry;
    }, 0);
};

const sumOfRecordsByAttributeCategory = (
    records: readonly GetDataset_dataset_records[],
    attributeCategory: GetDataset_dataset_program_targets_category,
    personType: GetDataset_dataset_personTypes | undefined
) => {
    return records.reduce((prev, curr) => {
        return (
            prev +
            sumOfEntriesByAttributeCategory(
                curr.entries,
                attributeCategory,
                personType
            )
        );
    }, 0);
};


const sumOfEntriesByInTargetAttribute = (
    entries: readonly GetDataset_dataset_records_entries[],
    personType: GetDataset_dataset_personTypes | undefined,
    attributesInTarget: string[]
) => {
    return entries.reduce((prevEntry, currEntry) => {
        const personTypeBool =
            personType !== undefined
                ? currEntry.personType?.id === personType.id
                : true;
        const inTargetBool = attributesInTarget.includes(
            currEntry.categoryValue.name
        );
        return personTypeBool && inTargetBool
            ? currEntry.count + prevEntry
            : prevEntry;
    }, 0);
};

const sumOfRecordsByInTargetAttribute = (
    records: readonly GetDataset_dataset_records[],
    personType: GetDataset_dataset_personTypes | undefined,
    attributesInTarget: string[]
) => {
    return records.reduce((prev, curr) => {
        return (
            prev +
            sumOfEntriesByInTargetAttribute(
                curr.entries,
                undefined, //personType, this causes personType to be ignored in the sum
                attributesInTarget
            )
        );
    }, 0);
};

const percentOfInTargetAttributeCategories = (
    records: readonly GetDataset_dataset_records[],
    category: GetDataset_dataset_program_targets_category,
    personType: GetDataset_dataset_personTypes | undefined,
    attributesInTarget: string[]
) => {
    return Math.round(
        (sumOfRecordsByInTargetAttribute(
            records,
            personType,
            attributesInTarget
        ) /
            sumOfRecordsByAttributeCategory(records, category, personType)) *
        100
    );
};


const isTargetMember = (queryData: GetDataset, categoryValueId: string) => {
    return queryData?.dataset.program.targets
        .flat()
        .flatMap(x => x.tracks)
        .find((track) => track.categoryValue.id === categoryValueId)
        ?.targetMember ?? false
}

export const sortedRecords = (queryData: GetDataset | undefined) => {
    if (queryData?.dataset?.records) {
        return Array.from(queryData.dataset.records)
            .sort(
                (a, b) =>
                    Date.parse(a.publicationDate) - Date.parse(b.publicationDate)
            )
            .map((x) => ({
                ...x,
                entries: Array.from(x.entries).sort(
                    (a, b) =>
                        Number(isTargetMember(queryData, a.categoryValue.id)) - Number(isTargetMember(queryData, b.categoryValue.id))
                ),
            }));
    }
}

export const filteredRecords = (queryData: GetDataset | undefined, selectedFilters: IDatasetDetailsFilter) => {
    if (selectedFilters && sortedRecords(queryData)) {
        if (selectedFilters.DateRange && selectedFilters.DateRange.length === 2) {
            const from = selectedFilters.DateRange[0];
            const to = selectedFilters.DateRange[1];
            if (from && to) {
                return sortedRecords(queryData)?.filter(
                    (record: GetDataset_dataset_records) =>
                        moment(record.publicationDate) >= from &&
                        moment(record.publicationDate) <= to
                ) ?? [];
            }
        }
    }

    return queryData?.dataset?.records ?? [];
}


export const targetStates = (queryData: GetDataset | undefined, selectedFilters: IDatasetDetailsFilter) => {
    return queryData?.dataset?.program.targets.map((target) => {
        const status = filteredRecords
            ? percentOfInTargetAttributeCategories(
                filteredRecords(queryData, selectedFilters),
                target.category,
                undefined,
                queryData?.dataset?.program.targets
                    .find((x) => x.category.id === target.category.id)
                    ?.tracks
                    .filter(x => x.targetMember)
                    .map((x) => x.categoryValue.name) ?? new Array<string>()
            )
            : 0;
        return { target: target, status: status };
    })
        .sort((a, b) => catSort(a.target.category.name, b.target.category.name));
}