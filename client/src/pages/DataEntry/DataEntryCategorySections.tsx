import { Card, Col, Form, InputNumber, Row } from "antd";
import _ from "lodash";
import React, { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { GetDataset_dataset_personTypes } from "../../graphql/__generated__/GetDataset";
import { Entry } from "./DataEntryAggregateDataEntryForm";

interface DataEntryCategorySectionProps {
  entries: Entry[];
  onValueChange: (event: ChangeEvent<HTMLInputElement>, index: number) => void;
  personTypes?: ReadonlyArray<GetDataset_dataset_personTypes> | null;
}

/**
 * Group of entries related to the given category.
 */
interface GroupOfEntries {
  values: Entry[];
}

/**
 * Group entries together by category.
 */
const groupByCategory = (entries: Entry[]) => {
  const categoryGroups = _(entries)
    // Group the elements of Array based on nested `category` property
    .groupBy((obj) => obj.category)
    // `key` is group's name (category), `value` is the array of objects
    .map((value, key) => ({
      categoryName: key,
      description: _(value).head()?.description,
      values: value,
    }))
    .value();

  return categoryGroups;
};

// Groups entries by category and then by person type
// when person type exists in the dataset as metadata
const groupByCategoryAndPersonType = (entries: Entry[]) => {
  const categoryAndPersonTypeGroups = _.mapValues(
    _.groupBy(entries, (entry) => entry.category),
    (app) => _.groupBy(app, (entry) => entry.personType?.personTypeName)
  );

  const output = _.map(
    categoryAndPersonTypeGroups,
    (value, category: string) => ({
      categoryName: category,
      description: _(Object.values(value)[0]).head()?.description,
      personTypes: _.map(value, (value, key) => ({
        personType: key,
        values: value,
      })),
    })
  );

  return output;
};

const DataEntryCategorySections = ({
  entries,
  onValueChange,
  personTypes,
}: DataEntryCategorySectionProps): JSX.Element => {
  const { t } = useTranslation();

  const categories = groupByCategory(entries);

  const categoriesAndPersonTypes = groupByCategoryAndPersonType(entries);

  const inputs = (entries: GroupOfEntries) => {
    return entries.values.map((item) => (
      <Form.Item
        key={`${item.personType?.personTypeName}-${item.categoryValueLabel}`}
        className="data-entry-form_label"
        rules={[
          { required: true, message: "Please input a count for this value!" },
        ]}
      >
        <label
          htmlFor={`${item.personType?.personTypeName}-${item.categoryValueLabel}-input`}
          id={`${item.personType?.personTypeName}-${item.categoryValueLabel}-label`}
        >
          <InputNumber
            id={`${item.personType?.personTypeName}-${item.categoryValueLabel}-input`}
            aria-labelledby={`${item.personType?.personTypeName}-${item.categoryValueLabel}-label`}
            required={true}
            aria-required
            min={0}
            value={item.count}
            onChange={(e) => onValueChange(e, item.index)}
          />
          {` ${item.categoryValue} `}
        </label>
        <span className="data-entry-form_required-field">*</span>
      </Form.Item>
    ));
  };

  // returns person type groups if personTypes array
  if (!personTypes?.length) {
    return (
      <div className="data-entry_category_groups">
        {categories.map((category) => (
          <Row
            key={category.categoryName}
            aria-label={category.categoryName}
            role="group"
            gutter={[16, 16]}
            className="data-entry"
          >
            <Col span={7}>
              <h3 className="data-entry_category-descr-header">
                {t("aboutAttribute", { attribute: category.categoryName })}
              </h3>
              {t("attributeDescription", {
                description: category.description,
              })}
            </Col>
            <Col span={17}>
              <Card type="inner" title={category.categoryName}>
                <div className="data-entry-form_input-grid">
                  {inputs(category)}
                </div>
              </Card>
            </Col>
          </Row>
        ))}
      </div>
    );
  }

  return (
    <div className="data-entry_category_groups">
      {categoriesAndPersonTypes.map((category) => (
        <Row
          role="group"
          key={category.categoryName}
          aria-label={category.categoryName}
          gutter={[16, 16]}
          className="data-entry"
        >
          <Col span={7}>
            <h3 className="data-entry_category-descr-header">
              {t("aboutAttribute", { attribute: category.categoryName })}
            </h3>
            {t("attributeDescription", {
              description: category.description,
            })}
          </Col>
          <Col span={17}>
            <Card
              type="inner"
              id={category.categoryName}
              title={category.categoryName}
            >
              {category.personTypes.map((value) => (
                <React.Fragment key={value.personType}>
                  {value.personType.length > 0 && (
                    <h2 style={{ marginBottom: "1rem" }}>{value.personType}</h2>
                  )}
                  <div className="data-entry-form_input-grid">
                    {inputs(value)}
                  </div>
                </React.Fragment>
              ))}
            </Card>
          </Col>
        </Row>
      ))}
    </div>
  );
};

export { DataEntryCategorySections };
