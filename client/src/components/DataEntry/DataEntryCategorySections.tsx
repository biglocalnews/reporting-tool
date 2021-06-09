import { Card, Col, Row } from "antd";
import React, { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Entry } from "./DataEntryAggregateDataEntryForm";
import _ from "lodash";

interface DataEntryCategorySection {
  entries: Entry[];
  onValueChange: (event: ChangeEvent<HTMLInputElement>, index: number) => void;
}

const groupByCategory = (entries: Entry[]) => {
  const categoryGroups = _(entries)
    // Group the elements of Array based on nested `category` property
    .groupBy((obj) => obj.category)
    // `key` is group's name (category), `value` is the array of objects
    .map((value, key) => ({
      category: key,
      description: _(value).head()?.description, // TODO: update when description change is added
      values: value,
    }))
    .value();

  return categoryGroups;
};

const DataEntryCategorySections = ({
  entries,
  onValueChange,
}: DataEntryCategorySection): JSX.Element => {
  const { t } = useTranslation();

  const categories = groupByCategory(entries);

  return (
    <div className="data-entry_category_groups">
      {categories.map((category, index) => (
        <Row
          role="group"
          aria-labelledby={category.category}
          key={category.category}
          gutter={[16, 16]}
          className="data-entry"
        >
          <Col key={index} span={8}>
            <h3 className="data-entry_category-descr-header">
              {t("aboutAttribute", { attribute: category.category })}
            </h3>
            {t("attributeDescription", {
              description: category.description,
            })}
          </Col>
          <Col span={16}>
            <Card type="inner" id={category.category} title={category.category}>
              <div className="data-entry-form_input-grid">
                {category.values.map((item) => (
                  <label
                    key={item.index}
                    id={item.categoryValueLabel}
                    htmlFor={item.categoryValue}
                    className="data-entry-form_label"
                  >
                    <input
                      name={item.categoryValue}
                      required
                      aria-labelledby={item.categoryValueLabel}
                      aria-required="true"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0"
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
                  </label>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      ))}
    </div>
  );
};

export { DataEntryCategorySections };
