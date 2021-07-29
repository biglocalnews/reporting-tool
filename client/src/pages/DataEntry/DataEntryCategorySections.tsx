import { Card, Col, Form, InputNumber, Row } from "antd";
import _ from "lodash";
import { ChangeEvent } from "react";
import { GetDataset_dataset_personTypes } from "../../graphql/__generated__/GetDataset";
import { Entry } from "./DataEntryAggregateDataEntryForm";

interface DataEntryCategorySectionProps {
  entries: Entry[];
  onValueChange: (event: ChangeEvent<HTMLInputElement>, index: number) => void;
  personTypes?: ReadonlyArray<GetDataset_dataset_personTypes> | null;
}

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
  

  const categories = groupByCategory(entries);

  const categoriesAndPersonTypes = groupByCategoryAndPersonType(entries);

  const groups = !personTypes?.length
    ? groupByCategory(entries)
    : groupByCategoryAndPersonType(entries);
  console.log(groups);

  const inputs = (entries: any) => {
    return entries.values.map((item: Entry) => (
      <Form.Item
        key={
          item.personType
            ? `${item.personType.personTypeName} ${item.categoryValueLabel}`
            : item.categoryValueLabel
        }
        id={
          item.personType
            ? `${item.personType.personTypeName} ${item.categoryValueLabel}`
            : item.categoryValueLabel
        }
        htmlFor={
          item.personType
            ? `${item.personType.personTypeName} ${item.categoryValueLabel}`
            : item.categoryValueLabel
        }
        className="data-entry-form_label"
        rules={[
          { required: true, message: "Please input a count for this value!" },
        ]}
      >
        <InputNumber
          aria-label={
            item.personType
              ? `${item.personType.personTypeName} ${item.categoryValueLabel}`
              : item.categoryValueLabel
          }
          aria-labelledby={
            item.personType
              ? `${item.personType.personTypeName} ${item.categoryValueLabel}`
              : item.categoryValueLabel
          }
          required={true}
          aria-required
          min={0}
          value={item.count}
          onChange={(e) => onValueChange(e, item.index)}
        />
        {` ${item.categoryValue} `}
        <span
          className="data-entry-form_required-field"
          aria-labelledby={item.categoryValueLabel}
        >
          *
        </span>
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

            <Col span={24}>
              <Card
                key={category.categoryName}
                type="inner"
                title={category.categoryName}
              >
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
          <Col span={24}>
            <Card
              key={category.categoryName}
              type="inner"
              id={category.categoryName}
              title={category.categoryName}
            >
              {category.personTypes.map((value, index) => (
                <>
                  {value.personType.length > 0 && (
                    <h2 key={index} style={{ marginBottom: "1rem" }}>
                      {value.personType}
                    </h2>
                  )}
                  <div className="data-entry-form_input-grid">
                    {inputs(value)}
                  </div>
                </>
              ))}
            </Card>
          </Col>
        </Row>
      ))}
    </div>
  );
};

export { DataEntryCategorySections };
